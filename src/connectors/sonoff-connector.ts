import * as crypto from 'crypto';
import { RESTConnector } from './rest-connector.js';
import { DeviceConfig, DeviceStatus } from '../types.js';

export class SonoffConnector extends RESTConnector {
  private appId: string;
  private appSecret: string;
  private accessToken: string | null = null;

  constructor(config: DeviceConfig) {
    super(config);
    this.appId = String(config.extra?.appId || '');
    this.appSecret = String(config.extra?.appSecret || '');
  }

  private ewelinkSign(body: string): string {
    return crypto.createHmac('sha256', this.appSecret)
      .update(body)
      .digest('base64');
  }

  async connect(): Promise<void> {
    // eWeLink API v2 authentication
    const body = JSON.stringify({
      email: this.config.username,
      password: this.config.password,
      countryCode: '+66', // Thailand
    });

    const sign = this.ewelinkSign(body);

    const response = await fetch(`${this.baseUrl}/v2/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CK-Appid': this.appId,
        'Authorization': `Sign ${sign}`,
      },
      body,
    });

    const data = await response.json() as {
      error: number;
      data?: { at: string };
      msg?: string;
    };

    if (data.error !== 0) {
      throw new Error(`eWeLink auth error: ${data.msg || data.error}`);
    }

    this.accessToken = data.data!.at;
    this.headers['Authorization'] = `Bearer ${this.accessToken}`;
    this.headers['X-CK-Appid'] = this.appId;
    this._status = 'connected';
  }

  async disconnect(): Promise<void> {
    this.accessToken = null;
    this._status = 'disconnected';
  }

  private async ensureAuth(): Promise<void> {
    if (!this.accessToken) await this.connect();
  }

  async getStatus(): Promise<DeviceStatus> {
    try {
      await this.ensureAuth();
      return this.buildStatus({ status: 'connected' });
    } catch (error) {
      return this.buildStatus({
        status: 'error',
        details: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  async listDevices(): Promise<unknown> {
    await this.ensureAuth();
    return this.apiGet('/v2/device/thing');
  }

  async getDeviceStatus(sonoffDeviceId: string): Promise<unknown> {
    await this.ensureAuth();
    return this.apiGet(`/v2/device/thing/status?type=1&id=${sonoffDeviceId}`);
  }

  async toggleDevice(sonoffDeviceId: string, state: 'on' | 'off'): Promise<unknown> {
    await this.ensureAuth();
    return this.apiPost('/v2/device/thing/status', {
      type: 1,
      id: sonoffDeviceId,
      params: { switch: state },
    });
  }

  async getPowerUsage(sonoffDeviceId: string): Promise<unknown> {
    await this.ensureAuth();
    return this.apiGet(`/v2/device/thing/status?type=1&id=${sonoffDeviceId}`);
  }
}
