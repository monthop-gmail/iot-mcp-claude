import { RESTConnector } from './rest-connector.js';
import { DeviceConfig, DeviceStatus } from '../types.js';

export class SynologyConnector extends RESTConnector {
  private sid: string | null = null;

  constructor(config: DeviceConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    // DSM API login - returns session ID (sid)
    const params = new URLSearchParams({
      api: 'SYNO.API.Auth',
      version: '6',
      method: 'login',
      account: this.config.username || '',
      passwd: this.config.password || '',
      session: 'MCP',
      format: 'sid',
    });
    const response = await this.apiFetch<{ success: boolean; data?: { sid: string }; error?: { code: number } }>(
      `/webapi/auth.cgi?${params}`,
      { method: 'GET' }
    );
    if (!response.success || !response.data?.sid) {
      throw new Error(`Synology authentication failed (error code: ${response.error?.code || 'unknown'})`);
    }
    this.sid = response.data.sid;
    this._status = 'connected';
  }

  async disconnect(): Promise<void> {
    if (this.sid) {
      try {
        await this.apiFetch(
          `/webapi/auth.cgi?api=SYNO.API.Auth&version=6&method=logout&session=MCP&_sid=${this.sid}`,
          { method: 'GET' }
        );
      } catch { /* ignore */ }
    }
    this.sid = null;
    this._status = 'disconnected';
  }

  private async dsmGet<T = unknown>(api: string, method: string, version = '1', extra: Record<string, string> = {}): Promise<T> {
    if (!this.sid) await this.connect();
    const params = new URLSearchParams({
      api,
      version,
      method,
      _sid: this.sid!,
      ...extra,
    });
    const response = await this.apiFetch<{ success: boolean; data?: T; error?: { code: number } }>(
      `/webapi/entry.cgi?${params}`,
      { method: 'GET' }
    );
    if (!response.success) {
      throw new Error(`Synology API error: ${api} ${method} (code: ${response.error?.code || 'unknown'})`);
    }
    return response.data as T;
  }

  async getStatus(): Promise<DeviceStatus> {
    try {
      const info = await this.getSystemInfo();
      return this.buildStatus({
        status: 'connected',
        model: (info as Record<string, unknown>).model as string | undefined,
        firmware: (info as Record<string, unknown>).version_string as string | undefined,
        uptime: (info as Record<string, unknown>).up_time as string | undefined,
        details: info as Record<string, unknown>,
      });
    } catch (error) {
      return this.buildStatus({
        status: 'error',
        details: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  async getSystemInfo(): Promise<unknown> {
    return this.dsmGet('SYNO.DSM.Info', 'getinfo', '2');
  }

  async getStorageInfo(): Promise<unknown> {
    try {
      return await this.dsmGet('SYNO.Storage.CGI.Storage', 'load_info', '1');
    } catch {
      return this.dsmGet('SYNO.Core.Storage.Volume', 'list', '1');
    }
  }

  async getDisks(): Promise<unknown> {
    try {
      return await this.dsmGet('SYNO.Storage.CGI.Storage', 'load_info', '1');
    } catch {
      return this.dsmGet('SYNO.Core.Storage.Disk', 'list', '1');
    }
  }

  async getSharedFolders(): Promise<unknown> {
    return this.dsmGet('SYNO.FileStation.List', 'list_share', '2', {
      additional: '["real_path","size","owner","time","volume_status"]',
    });
  }

  async getNetworkInterfaces(): Promise<unknown> {
    return this.dsmGet('SYNO.DSM.Network', 'list', '2');
  }

  async getInstalledPackages(): Promise<unknown> {
    return this.dsmGet('SYNO.Core.Package', 'list', '2', {
      additional: '["description","size","status"]',
    });
  }

  async getSystemUtilization(): Promise<unknown> {
    return this.dsmGet('SYNO.Core.System.Utilization', 'get', '1');
  }

  async getSystemLogs(count = 50): Promise<unknown> {
    try {
      return await this.dsmGet('SYNO.Core.SyslogClient.Log', 'list', '1', {
        limit: String(count),
        offset: '0',
      });
    } catch {
      return this.dsmGet('SYNO.Core.SyslogClient.Status', 'latestlog_get', '1');
    }
  }

  async getDockerContainers(): Promise<unknown> {
    return this.dsmGet('SYNO.Docker.Container', 'list', '1', {
      limit: '100',
      offset: '0',
    });
  }

  async executeCommand(command: string): Promise<import('../types.js').CommandResult> {
    return {
      success: false,
      device: this.config.id,
      command,
      output: '',
      error: 'Direct command execution not supported via Synology REST API. Configure SSH transport for CLI access.',
    };
  }

  async getConfig(section?: string): Promise<string> {
    const info = await this.getSystemInfo();
    return JSON.stringify(info, null, 2);
  }
}
