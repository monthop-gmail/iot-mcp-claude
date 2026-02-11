import { getRegistry } from '../device-registry.js';
import { DeviceType } from '../types.js';
import { SerialConnector } from '../connectors/serial-connector.js';

export async function listDevices(args: {
  filter?: string;
  type?: DeviceType;
  tag?: string;
}) {
  const registry = getRegistry();
  let devices = registry.listDevices();

  if (args.type) {
    devices = devices.filter(d => d.type === args.type);
  }
  if (args.tag) {
    devices = devices.filter(d => d.tags?.includes(args.tag!));
  }
  if (args.filter) {
    devices = registry.searchDevices(args.filter);
  }

  return {
    total: devices.length,
    devices: devices.map(d => ({
      id: d.id,
      name: d.name,
      type: d.type,
      transport: d.transport,
      host: d.host,
      tags: d.tags,
    })),
  };
}

export async function deviceStatus(args: { device_id: string }) {
  const registry = getRegistry();
  return registry.getDeviceStatus(args.device_id);
}

export async function testConnection(args: { device_id: string }) {
  const registry = getRegistry();
  const connector = registry.getConnector(args.device_id);
  const result = await connector.testConnection();
  return {
    device_id: args.device_id,
    reachable: result,
    tested_at: new Date().toISOString(),
  };
}

export async function allStatus(args: { type?: DeviceType; tag?: string }) {
  const registry = getRegistry();
  const statuses = await registry.getAllStatuses(args.type, args.tag);
  return {
    total: statuses.length,
    connected: statuses.filter(s => s.status === 'connected').length,
    errors: statuses.filter(s => s.status === 'error').length,
    devices: statuses,
  };
}

export async function executeCommand(args: { device_id: string; command: string }) {
  const registry = getRegistry();
  const connector = registry.getConnector(args.device_id);
  return connector.executeCommand(args.command);
}

export async function getConfig(args: { device_id: string; section?: string }) {
  const registry = getRegistry();
  const connector = registry.getConnector(args.device_id);
  const config = await connector.getConfig(args.section);
  return {
    device_id: args.device_id,
    section: args.section || 'full',
    config,
  };
}

export async function listSerialPorts() {
  const ports = await SerialConnector.listPorts();
  return { ports };
}
