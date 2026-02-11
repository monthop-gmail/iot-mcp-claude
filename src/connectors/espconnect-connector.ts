import { RESTConnector } from './rest-connector.js';
import { DeviceStatus } from '../types.js';

export class ESPConnectConnector extends RESTConnector {

  async connect(): Promise<void> {
    if (this.config.apiKey) {
      this.headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }
    try {
      await this.apiGet('/api/devices');
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
    return this.apiGet('/api/devices');
  }

  async getDeviceStatus(espDeviceId: string): Promise<unknown> {
    return this.apiGet(`/api/devices/${espDeviceId}`);
  }

  async sendCommand(espDeviceId: string, command: string): Promise<unknown> {
    return this.apiPost(`/api/devices/${espDeviceId}/command`, { command });
  }

  async otaUpdate(espDeviceId: string, firmwareUrl: string): Promise<unknown> {
    return this.apiPost(`/api/devices/${espDeviceId}/ota`, { url: firmwareUrl });
  }
}
