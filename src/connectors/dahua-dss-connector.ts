import { RESTConnector } from './rest-connector.js';
import { DeviceConfig, DeviceStatus } from '../types.js';

export class DahuaDssConnector extends RESTConnector {
  private accessToken: string | null = null;

  constructor(config: DeviceConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    // DSS Pro/Express login
    const response = await this.apiFetch<{ success: boolean; data?: { token: string }; code?: string }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        userName: this.config.username,
        password: this.config.password,
        clientType: 'winpc',
      }),
    });
    if (!response.success || !response.data?.token) {
      throw new Error(`DSS login failed: ${response.code || 'unknown'}`);
    }
    this.accessToken = response.data.token;
    this.headers['X-Subject-Token'] = this.accessToken;
    this._status = 'connected';
  }

  async disconnect(): Promise<void> {
    if (this.accessToken) {
      try {
        await this.apiFetch('/admin/logout', { method: 'POST' });
      } catch { /* ignore */ }
    }
    this.accessToken = null;
    delete this.headers['X-Subject-Token'];
    this._status = 'disconnected';
  }

  private async dssPost<T = unknown>(path: string, body?: unknown): Promise<T> {
    if (!this.accessToken) await this.connect();
    const response = await this.apiFetch<{ success: boolean; data?: T; code?: string }>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : JSON.stringify({}),
    });
    if (!response.success) {
      // Token expired, retry
      if (response.code === '1013') {
        this.accessToken = null;
        await this.connect();
        return this.dssPost<T>(path, body);
      }
      throw new Error(`DSS API error: ${path} (code: ${response.code || 'unknown'})`);
    }
    return response.data as T;
  }

  async getStatus(): Promise<DeviceStatus> {
    try {
      await this.connect();
      const info = await this.getServerInfo();
      return this.buildStatus({
        status: 'connected',
        details: info as Record<string, unknown>,
      });
    } catch (error) {
      return this.buildStatus({
        status: 'error',
        details: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  async getServerInfo(): Promise<unknown> {
    return this.dssPost('/admin/serverInfo/getServerInfo');
  }

  async listDevices(pageNum = 1, pageSize = 50): Promise<unknown> {
    return this.dssPost('/device/list', { pageNum, pageSize });
  }

  async getDeviceInfo(deviceCode: string): Promise<unknown> {
    return this.dssPost('/device/info', { deviceCode });
  }

  async listChannels(deviceCode?: string, pageNum = 1, pageSize = 100): Promise<unknown> {
    const body: Record<string, unknown> = { pageNum, pageSize };
    if (deviceCode) body.deviceCode = deviceCode;
    return this.dssPost('/device/channel/list', body);
  }

  async getChannelStatus(channelIds: string[]): Promise<unknown> {
    return this.dssPost('/device/channel/status', { channelIds });
  }

  async listAlarms(startTime?: string, endTime?: string, pageNum = 1, pageSize = 50): Promise<unknown> {
    const body: Record<string, unknown> = { pageNum, pageSize };
    if (startTime) body.startTime = startTime;
    if (endTime) body.endTime = endTime;
    return this.dssPost('/alarm/list', body);
  }

  async listOrganizations(): Promise<unknown> {
    return this.dssPost('/org/list');
  }

  async getRecordStatus(channelId: string): Promise<unknown> {
    return this.dssPost('/record/status', { channelId });
  }

  async getDeviceOnlineStatus(deviceCodes: string[]): Promise<unknown> {
    return this.dssPost('/device/onlineStatus', { deviceCodes });
  }

  async executeCommand(command: string): Promise<import('../types.js').CommandResult> {
    return {
      success: false,
      device: this.config.id,
      command,
      output: '',
      error: 'Direct CLI not supported via Dahua DSS API.',
    };
  }

  async getConfig(section?: string): Promise<string> {
    const info = await this.getServerInfo();
    return JSON.stringify(info, null, 2);
  }
}
