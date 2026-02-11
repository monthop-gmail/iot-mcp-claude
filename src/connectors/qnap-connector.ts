import { RESTConnector } from './rest-connector.js';
import { DeviceConfig, DeviceStatus } from '../types.js';

export class QnapConnector extends RESTConnector {
  private sid: string | null = null;

  constructor(config: DeviceConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    // QTS API login - returns session ID (sid)
    const response = await this.apiFetch<string>(
      `/cgi-bin/authLogin.cgi?user=${encodeURIComponent(this.config.username || '')}&pwd=${encodeURIComponent(this.config.password || '')}`,
      { method: 'GET' }
    );
    // Response is XML: <authSid><![CDATA[xxxxxx]]></authSid>
    const sidMatch = String(response).match(/<authSid><!\[CDATA\[([^\]]+)\]\]><\/authSid>/);
    if (!sidMatch) {
      throw new Error('QNAP authentication failed: could not extract session ID');
    }
    this.sid = sidMatch[1];
    this._status = 'connected';
  }

  async disconnect(): Promise<void> {
    if (this.sid) {
      try {
        await this.apiFetch(`/cgi-bin/authLogout.cgi?sid=${this.sid}`, { method: 'GET' });
      } catch { /* ignore */ }
    }
    this.sid = null;
    this._status = 'disconnected';
  }

  private async qtsGet<T = unknown>(path: string): Promise<T> {
    if (!this.sid) await this.connect();
    const separator = path.includes('?') ? '&' : '?';
    return this.apiFetch<T>(`${path}${separator}sid=${this.sid}`, { method: 'GET' });
  }

  async getStatus(): Promise<DeviceStatus> {
    try {
      const info = await this.getSystemInfo();
      return this.buildStatus({
        status: 'connected',
        model: info.model as string | undefined,
        firmware: info.firmware as string | undefined,
        uptime: info.uptime as string | undefined,
        details: info,
      });
    } catch (error) {
      return this.buildStatus({
        status: 'error',
        details: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  async getSystemInfo(): Promise<Record<string, unknown>> {
    const data = await this.qtsGet<Record<string, unknown>>(
      '/cgi-bin/management/manaRequest.cgi?subfunc=sysinfo&sysinfo=1'
    );
    // Also try QTS API v2 JSON endpoint
    try {
      const sysHealth = await this.qtsGet<Record<string, unknown>>(
        '/api/v2/system/info'
      );
      return { ...data, ...sysHealth };
    } catch {
      return data;
    }
  }

  async getVolumes(): Promise<unknown> {
    // Get storage pool / volume info
    try {
      return await this.qtsGet('/api/v2/storage/volumes');
    } catch {
      return this.qtsGet(
        '/cgi-bin/management/manaRequest.cgi?subfunc=smart_info&volume=1'
      );
    }
  }

  async getDisks(): Promise<unknown> {
    try {
      return await this.qtsGet('/api/v2/storage/disks');
    } catch {
      return this.qtsGet(
        '/cgi-bin/management/manaRequest.cgi?subfunc=smart_info&disk=1'
      );
    }
  }

  async getSharedFolders(): Promise<unknown> {
    try {
      return await this.qtsGet('/api/v2/shares');
    } catch {
      return this.qtsGet('/cgi-bin/filemanager/sharedfoldermanager.cgi?func=get_tree');
    }
  }

  async getNetworkInterfaces(): Promise<unknown> {
    try {
      return await this.qtsGet('/api/v2/network/interfaces');
    } catch {
      return this.qtsGet(
        '/cgi-bin/management/manaRequest.cgi?subfunc=net_info'
      );
    }
  }

  async getRunningApps(): Promise<unknown> {
    try {
      return await this.qtsGet('/api/v2/applications');
    } catch {
      return this.qtsGet('/cgi-bin/management/manaRequest.cgi?subfunc=app_info');
    }
  }

  async getSystemLogs(count = 50): Promise<unknown> {
    try {
      return await this.qtsGet(`/api/v2/system/logs?limit=${count}`);
    } catch {
      return this.qtsGet(
        `/cgi-bin/logs/logRequest.cgi?func=get_log&log_type=1&start=0&count=${count}`
      );
    }
  }

  async getResourceUsage(): Promise<unknown> {
    try {
      return await this.qtsGet('/api/v2/system/resource');
    } catch {
      return this.qtsGet(
        '/cgi-bin/management/manaRequest.cgi?subfunc=sysinfo&hdsmart=1&cpu=1&mem=1'
      );
    }
  }

  async executeCommand(command: string): Promise<import('../types.js').CommandResult> {
    // QNAP doesn't have direct command execution via REST
    // Use SSH if available
    return {
      success: false,
      device: this.config.id,
      command,
      output: '',
      error: 'Direct command execution not supported via QNAP REST API. Configure SSH transport for CLI access.',
    };
  }

  async getConfig(section?: string): Promise<string> {
    const info = await this.getSystemInfo();
    return JSON.stringify(info, null, 2);
  }
}
