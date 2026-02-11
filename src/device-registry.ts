import { DeviceConfig, DeviceStatus, DeviceType } from './types.js';
import { BaseConnector } from './connectors/base-connector.js';
import { createConnector } from './connectors/index.js';
import { loadDevices } from './config.js';

class DeviceRegistry {
  private connectors = new Map<string, BaseConnector>();
  private configs = new Map<string, DeviceConfig>();

  initialize(): void {
    const devices = loadDevices();
    for (const device of devices) {
      this.configs.set(device.id, device);
      this.connectors.set(device.id, createConnector(device));
    }
    console.error(`Device registry loaded: ${devices.length} device(s)`);
  }

  getConnector(deviceId: string): BaseConnector {
    const conn = this.connectors.get(deviceId);
    if (!conn) throw new Error(`Device not found: ${deviceId}. Available: ${Array.from(this.configs.keys()).join(', ')}`);
    return conn;
  }

  getConfig(deviceId: string): DeviceConfig | undefined {
    return this.configs.get(deviceId);
  }

  listDevices(): DeviceConfig[] {
    return Array.from(this.configs.values());
  }

  getDevicesByType(type: DeviceType): DeviceConfig[] {
    return this.listDevices().filter(d => d.type === type);
  }

  getDevicesByTag(tag: string): DeviceConfig[] {
    return this.listDevices().filter(d => d.tags?.includes(tag));
  }

  searchDevices(filter: string): DeviceConfig[] {
    const lower = filter.toLowerCase();
    return this.listDevices().filter(d =>
      d.id.toLowerCase().includes(lower) ||
      d.name.toLowerCase().includes(lower) ||
      d.type.toLowerCase().includes(lower) ||
      d.tags?.some(t => t.toLowerCase().includes(lower))
    );
  }

  async getDeviceStatus(deviceId: string): Promise<DeviceStatus> {
    const conn = this.getConnector(deviceId);
    return conn.getStatus();
  }

  async getAllStatuses(type?: DeviceType, tag?: string): Promise<DeviceStatus[]> {
    let devices = this.listDevices();
    if (type) devices = devices.filter(d => d.type === type);
    if (tag) devices = devices.filter(d => d.tags?.includes(tag));

    const results: DeviceStatus[] = [];
    for (const device of devices) {
      const conn = this.connectors.get(device.id)!;
      try {
        results.push(await conn.getStatus());
      } catch (error) {
        results.push({
          id: device.id,
          name: device.name,
          type: device.type,
          status: 'error',
          details: { error: error instanceof Error ? error.message : String(error) },
        });
      }
    }
    return results;
  }
}

let instance: DeviceRegistry | null = null;

export function getRegistry(): DeviceRegistry {
  if (!instance) {
    instance = new DeviceRegistry();
    instance.initialize();
  }
  return instance;
}
