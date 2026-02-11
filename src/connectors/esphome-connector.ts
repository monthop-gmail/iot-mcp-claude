import { RESTConnector } from './rest-connector.js';
import { DeviceStatus } from '../types.js';

export class ESPHomeConnector extends RESTConnector {

  async connect(): Promise<void> {
    // ESPHome dashboard doesn't require auth for basic access
    // but API key may be needed for some operations
    if (this.config.apiKey) {
      this.headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }
    try {
      await this.apiGet('/devices');
      this._status = 'connected';
    } catch (error) {
      this._status = 'error';
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this._status = 'disconnected';
  }

  async getStatus(): Promise<DeviceStatus> {
    try {
      if (this._status !== 'connected') await this.connect();
      return this.buildStatus({ status: 'connected' });
    } catch (error) {
      return this.buildStatus({
        status: 'error',
        details: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  async listDevices(): Promise<unknown> {
    return this.apiGet('/devices');
  }

  async getDeviceInfo(deviceName: string): Promise<unknown> {
    return this.apiGet(`/devices/${deviceName}`);
  }

  async getStates(deviceName: string): Promise<unknown> {
    // ESPHome native API states endpoint
    return this.apiGet(`/devices/${deviceName}/states`);
  }

  async callService(deviceName: string, service: string, data?: Record<string, unknown>): Promise<unknown> {
    return this.apiPost(`/devices/${deviceName}/services/${service}`, data);
  }

  async getLogs(deviceName: string): Promise<unknown> {
    return this.apiGet(`/devices/${deviceName}/logs`);
  }

  async compile(deviceName: string): Promise<unknown> {
    return this.apiPost(`/devices/${deviceName}/compile`);
  }
}
