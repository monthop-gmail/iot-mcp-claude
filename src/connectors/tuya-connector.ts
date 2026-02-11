import * as crypto from 'crypto';
import { RESTConnector } from './rest-connector.js';
import { DeviceConfig, DeviceStatus } from '../types.js';

export class TuyaConnector extends RESTConnector {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry = 0;

  constructor(config: DeviceConfig) {
    super(config);
    this.clientId = String(config.extra?.clientId || '');
    this.clientSecret = String(config.extra?.clientSecret || '');
  }

  private sign(method: string, path: string, timestamp: string, body = ''): string {
    const contentHash = crypto.createHash('sha256').update(body).digest('hex');
    const stringToSign = [method, contentHash, '', path].join('\n');
    const signStr = this.clientId + (this.accessToken || '') + timestamp + stringToSign;
    return crypto.createHmac('sha256', this.clientSecret)
      .update(signStr)
      .digest('hex')
      .toUpperCase();
  }

  private async tuyaFetch<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
    const timestamp = Date.now().toString();
    const bodyStr = body ? JSON.stringify(body) : '';
    const sign = this.sign(method, path, timestamp, bodyStr);

    const headers: Record<string, string> = {
      'client_id': this.clientId,
      'sign': sign,
      'sign_method': 'HMAC-SHA256',
      't': timestamp,
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['access_token'] = this.accessToken;
    }

    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method,
      headers,
      body: bodyStr || undefined,
    });

    const data = await response.json() as { success: boolean; result: T; msg?: string };
    if (!data.success) {
      throw new Error(`Tuya API error: ${data.msg || 'Unknown error'}`);
    }
    return data.result;
  }

  async connect(): Promise<void> {
    const result = await this.tuyaFetch<{ access_token: string; expire_time: number }>(
      'GET', '/v1.0/token?grant_type=1'
    );
    this.accessToken = result.access_token;
    this.tokenExpiry = Date.now() + (result.expire_time * 1000);
    this._status = 'connected';
  }

  async disconnect(): Promise<void> {
    this.accessToken = null;
    this._status = 'disconnected';
  }

  private async ensureToken(): Promise<void> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.connect();
    }
  }

  async getStatus(): Promise<DeviceStatus> {
    try {
      await this.ensureToken();
      return this.buildStatus({ status: 'connected' });
    } catch (error) {
      return this.buildStatus({
        status: 'error',
        details: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  async listDevices(): Promise<unknown> {
    await this.ensureToken();
    return this.tuyaFetch('GET', '/v1.0/iot-01/associated-users/devices');
  }

  async getDeviceStatus(tuyaDeviceId: string): Promise<unknown> {
    await this.ensureToken();
    return this.tuyaFetch('GET', `/v1.0/devices/${tuyaDeviceId}/status`);
  }

  async sendCommands(tuyaDeviceId: string, commands: Array<{ code: string; value: unknown }>): Promise<unknown> {
    await this.ensureToken();
    return this.tuyaFetch('POST', `/v1.0/devices/${tuyaDeviceId}/commands`, { commands });
  }

  async getScenes(): Promise<unknown> {
    await this.ensureToken();
    return this.tuyaFetch('GET', '/v1.0/homes/scenes');
  }

  async triggerScene(sceneId: string): Promise<unknown> {
    await this.ensureToken();
    return this.tuyaFetch('POST', `/v1.0/homes/scenes/${sceneId}/trigger`);
  }
}
