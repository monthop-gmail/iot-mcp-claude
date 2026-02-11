import { RESTConnector } from './rest-connector.js';
import { DeviceConfig, DeviceStatus } from '../types.js';

export class ThingsBoardConnector extends RESTConnector {
  private refreshToken: string | null = null;

  constructor(config: DeviceConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    // ThingsBoard JWT authentication
    const response = await this.apiFetch<{ token: string; refreshToken: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({
          username: this.config.username,
          password: this.config.password,
        }),
      }
    );
    this.token = response.token;
    this.refreshToken = response.refreshToken;
    this.headers['X-Authorization'] = `Bearer ${this.token}`;
    this._status = 'connected';
  }

  async disconnect(): Promise<void> {
    this.token = null;
    this.refreshToken = null;
    delete this.headers['X-Authorization'];
    this._status = 'disconnected';
  }

  async getStatus(): Promise<DeviceStatus> {
    try {
      if (!this.token) await this.connect();
      // Simple check: get tenant info
      const info = await this.apiGet<Record<string, unknown>>('/api/auth/user');
      return this.buildStatus({
        status: 'connected',
        details: {
          email: info.email,
          authority: info.authority,
        },
      });
    } catch (error) {
      return this.buildStatus({
        status: 'error',
        details: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  async listDevices(page = 0, limit = 20): Promise<unknown> {
    if (!this.token) await this.connect();
    return this.apiGet(`/api/tenant/devices?pageSize=${limit}&page=${page}`);
  }

  async getDeviceTelemetry(tbDeviceId: string, keys?: string[]): Promise<unknown> {
    if (!this.token) await this.connect();
    const keysParam = keys?.length ? `?keys=${keys.join(',')}` : '';
    return this.apiGet(`/api/plugins/telemetry/DEVICE/${tbDeviceId}/values/timeseries${keysParam}`);
  }

  async getDeviceAttributes(tbDeviceId: string): Promise<unknown> {
    if (!this.token) await this.connect();
    return this.apiGet(`/api/plugins/telemetry/DEVICE/${tbDeviceId}/values/attributes`);
  }

  async sendRpc(tbDeviceId: string, method: string, params?: Record<string, unknown>): Promise<unknown> {
    if (!this.token) await this.connect();
    return this.apiPost(`/api/rpc/twoway/${tbDeviceId}`, { method, params: params || {} });
  }

  async getAlarms(severity?: string): Promise<unknown> {
    if (!this.token) await this.connect();
    const severityParam = severity ? `&severity=${severity}` : '';
    return this.apiGet(`/api/alarm/TENANT?pageSize=50&page=0${severityParam}`);
  }

  async getDashboards(): Promise<unknown> {
    if (!this.token) await this.connect();
    return this.apiGet('/api/tenant/dashboards?pageSize=50&page=0');
  }
}
