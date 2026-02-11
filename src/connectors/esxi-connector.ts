import { RESTConnector } from './rest-connector.js';
import { DeviceConfig, DeviceStatus } from '../types.js';
import https from 'https';

// Custom fetch agent for self-signed certs
const insecureAgent = new https.Agent({ rejectUnauthorized: false });

export class ESXiConnector extends RESTConnector {
  private sessionId: string | null = null;

  constructor(config: DeviceConfig) {
    super(config);
    // Default baseUrl to https://<host> if apiUrl not set
    if (!config.apiUrl && config.host) {
      this.baseUrl = `https://${config.host}`;
    }
  }

  private async esxiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      // @ts-expect-error Node.js fetch supports agent option
      agent: insecureAgent,
      headers: {
        'Content-Type': 'application/json',
        ...(this.sessionId ? { 'vmware-api-session-id': this.sessionId } : {}),
        ...(options.headers as Record<string, string> || {}),
      },
    });

    // Handle session expiry
    if (response.status === 401 && this.sessionId) {
      this.sessionId = null;
      await this.connect();
      return this.esxiFetch<T>(path, options);
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`ESXi API ${response.status}: ${text}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json() as Promise<T>;
    }
    return response.text() as unknown as T;
  }

  async connect(): Promise<void> {
    const credentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
    const url = `${this.baseUrl}/api/session`;
    const response = await fetch(url, {
      method: 'POST',
      // @ts-expect-error Node.js fetch supports agent option
      agent: insecureAgent,
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ESXi authentication failed: ${response.status} ${response.statusText}`);
    }

    this.sessionId = await response.json() as string;
    this._status = 'connected';
  }

  async disconnect(): Promise<void> {
    if (this.sessionId) {
      try {
        await this.esxiFetch('/api/session', { method: 'DELETE' });
      } catch { /* ignore */ }
    }
    this.sessionId = null;
    this._status = 'disconnected';
  }

  private async ensureAuth(): Promise<void> {
    if (!this.sessionId) await this.connect();
  }

  async getStatus(): Promise<DeviceStatus> {
    try {
      const host = await this.getHostInfo();
      return this.buildStatus({
        status: 'connected',
        model: (host as Record<string, unknown>).name as string | undefined,
        firmware: ((host as Record<string, unknown>).product as Record<string, unknown>)?.version as string | undefined,
        details: host as Record<string, unknown>,
      });
    } catch (error) {
      return this.buildStatus({
        status: 'error',
        details: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  // VM Operations
  async listVMs(): Promise<unknown> {
    await this.ensureAuth();
    return this.esxiFetch('/api/vcenter/vm');
  }

  async getVM(vmId: string): Promise<unknown> {
    await this.ensureAuth();
    return this.esxiFetch(`/api/vcenter/vm/${vmId}`);
  }

  async findVMByName(name: string): Promise<Record<string, unknown> | null> {
    const vms = await this.listVMs() as Array<Record<string, unknown>>;
    return vms.find((vm) => (vm.name as string).toLowerCase() === name.toLowerCase()) || null;
  }

  async getVMPowerState(vmId: string): Promise<string> {
    await this.ensureAuth();
    const data = await this.esxiFetch<Record<string, unknown>>(`/api/vcenter/vm/${vmId}/power`);
    return data.state as string;
  }

  async powerOn(vmId: string): Promise<void> {
    await this.ensureAuth();
    await this.esxiFetch(`/api/vcenter/vm/${vmId}/power?action=start`, { method: 'POST' });
  }

  async powerOff(vmId: string): Promise<void> {
    await this.ensureAuth();
    await this.esxiFetch(`/api/vcenter/vm/${vmId}/power?action=stop`, { method: 'POST' });
  }

  async guestShutdown(vmId: string): Promise<void> {
    await this.ensureAuth();
    await this.esxiFetch(`/api/vcenter/vm/${vmId}/guest/power?action=shutdown`, { method: 'POST' });
  }

  async restart(vmId: string): Promise<void> {
    await this.ensureAuth();
    await this.esxiFetch(`/api/vcenter/vm/${vmId}/power?action=reset`, { method: 'POST' });
  }

  async guestReboot(vmId: string): Promise<void> {
    await this.ensureAuth();
    await this.esxiFetch(`/api/vcenter/vm/${vmId}/guest/power?action=reboot`, { method: 'POST' });
  }

  async suspend(vmId: string): Promise<void> {
    await this.ensureAuth();
    await this.esxiFetch(`/api/vcenter/vm/${vmId}/power?action=suspend`, { method: 'POST' });
  }

  // Host Operations
  async getHostInfo(): Promise<unknown> {
    await this.ensureAuth();
    const hosts = await this.esxiFetch<Array<Record<string, unknown>>>('/api/vcenter/host');
    if (!hosts.length) throw new Error('No ESXi hosts found');
    const hostId = hosts[0].host;
    const hostDetail = await this.esxiFetch<Record<string, unknown>>(`/api/vcenter/host/${hostId}`);
    return { name: hosts[0].name, ...hostDetail };
  }

  async listDatastores(): Promise<unknown> {
    await this.ensureAuth();
    const datastores = await this.esxiFetch<Array<Record<string, unknown>>>('/api/vcenter/datastore');
    return datastores.map((ds) => ({
      ...ds,
      free_space_GB: Math.round((ds.free_space as number) / (1024 * 1024 * 1024)),
      capacity_GB: Math.round((ds.capacity as number) / (1024 * 1024 * 1024)),
      used_percent: Math.round((((ds.capacity as number) - (ds.free_space as number)) / (ds.capacity as number)) * 100),
    }));
  }

  async listNetworks(): Promise<unknown> {
    await this.ensureAuth();
    return this.esxiFetch('/api/vcenter/network');
  }

  // Snapshot Operations
  async listSnapshots(vmId: string): Promise<unknown> {
    await this.ensureAuth();
    try {
      return await this.esxiFetch(`/api/vcenter/vm/${vmId}/snapshots`);
    } catch {
      return [];
    }
  }

  async createSnapshot(vmId: string, name: string, description = '', memory = false): Promise<unknown> {
    await this.ensureAuth();
    return this.esxiFetch(`/api/vcenter/vm/${vmId}/snapshots`, {
      method: 'POST',
      body: JSON.stringify({ name, description, memory }),
    });
  }

  async deleteSnapshot(vmId: string, snapshotId: string): Promise<void> {
    await this.ensureAuth();
    await this.esxiFetch(`/api/vcenter/vm/${vmId}/snapshots/${snapshotId}`, { method: 'DELETE' });
  }

  async revertSnapshot(vmId: string, snapshotId: string): Promise<void> {
    await this.ensureAuth();
    await this.esxiFetch(`/api/vcenter/vm/${vmId}/snapshots/${snapshotId}?action=revert`, { method: 'POST' });
  }

  async executeCommand(command: string): Promise<import('../types.js').CommandResult> {
    return {
      success: false,
      device: this.config.id,
      command,
      output: '',
      error: 'Direct command execution not supported via vSphere REST API. Use SSH transport for CLI access.',
    };
  }

  async getConfig(section?: string): Promise<string> {
    const host = await this.getHostInfo();
    return JSON.stringify(host, null, 2);
  }
}
