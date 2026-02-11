import { RESTConnector } from './rest-connector.js';
import { DeviceConfig, DeviceStatus } from '../types.js';

export class ProxmoxConnector extends RESTConnector {
  private ticket: string | null = null;
  private csrfToken: string | null = null;

  constructor(config: DeviceConfig) {
    super(config);
    // Support API token auth: PVEAPIToken=user@realm!tokenid=secret
    if (config.apiKey) {
      this.headers['Authorization'] = `PVEAPIToken=${config.apiKey}`;
    }
  }

  async connect(): Promise<void> {
    // Skip ticket auth if using API token
    if (this.config.apiKey) {
      this._status = 'connected';
      return;
    }
    // Ticket-based authentication
    const response = await this.apiFetch<{ data: { ticket: string; CSRFPreventionToken: string } }>(
      '/api2/json/access/ticket',
      {
        method: 'POST',
        body: JSON.stringify({
          username: this.config.username,
          password: this.config.password,
        }),
      }
    );
    this.ticket = response.data.ticket;
    this.csrfToken = response.data.CSRFPreventionToken;
    this.headers['Cookie'] = `PVEAuthCookie=${this.ticket}`;
    this.headers['CSRFPreventionToken'] = this.csrfToken;
    this._status = 'connected';
  }

  async disconnect(): Promise<void> {
    this.ticket = null;
    this.csrfToken = null;
    delete this.headers['Cookie'];
    delete this.headers['CSRFPreventionToken'];
    this._status = 'disconnected';
  }

  private async pveGet<T = unknown>(path: string): Promise<T> {
    if (!this.config.apiKey && !this.ticket) await this.connect();
    const response = await this.apiFetch<{ data: T }>(`/api2/json${path}`, { method: 'GET' });
    return response.data;
  }

  async getStatus(): Promise<DeviceStatus> {
    try {
      const nodes = await this.getNodes();
      const nodeList = nodes as Array<Record<string, unknown>>;
      return this.buildStatus({
        status: 'connected',
        details: {
          nodes: nodeList.length,
          nodeNames: nodeList.map(n => n.node),
        },
      });
    } catch (error) {
      return this.buildStatus({
        status: 'error',
        details: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  async getNodes(): Promise<unknown> {
    return this.pveGet('/nodes');
  }

  async getNodeStatus(node: string): Promise<unknown> {
    return this.pveGet(`/nodes/${encodeURIComponent(node)}/status`);
  }

  async listVMs(node: string): Promise<unknown> {
    return this.pveGet(`/nodes/${encodeURIComponent(node)}/qemu`);
  }

  async getVMStatus(node: string, vmid: number): Promise<unknown> {
    return this.pveGet(`/nodes/${encodeURIComponent(node)}/qemu/${vmid}/status/current`);
  }

  async listContainers(node: string): Promise<unknown> {
    return this.pveGet(`/nodes/${encodeURIComponent(node)}/lxc`);
  }

  async getContainerStatus(node: string, vmid: number): Promise<unknown> {
    return this.pveGet(`/nodes/${encodeURIComponent(node)}/lxc/${vmid}/status/current`);
  }

  async getStorage(node: string): Promise<unknown> {
    return this.pveGet(`/nodes/${encodeURIComponent(node)}/storage`);
  }

  async getNetwork(node: string): Promise<unknown> {
    return this.pveGet(`/nodes/${encodeURIComponent(node)}/network`);
  }

  async getClusterResources(type?: string): Promise<unknown> {
    const param = type ? `?type=${type}` : '';
    return this.pveGet(`/cluster/resources${param}`);
  }

  async getTasks(node: string, limit = 50): Promise<unknown> {
    return this.pveGet(`/nodes/${encodeURIComponent(node)}/tasks?limit=${limit}`);
  }

  async executeCommand(command: string): Promise<import('../types.js').CommandResult> {
    return {
      success: false,
      device: this.config.id,
      command,
      output: '',
      error: 'Direct command execution not supported via Proxmox REST API. Use SSH transport for CLI access.',
    };
  }

  async getConfig(section?: string): Promise<string> {
    const nodes = await this.getNodes();
    return JSON.stringify(nodes, null, 2);
  }
}
