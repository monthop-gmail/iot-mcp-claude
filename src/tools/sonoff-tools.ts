import { getRegistry } from '../device-registry.js';
import { SonoffConnector } from '../connectors/sonoff-connector.js';

function getSonoff(deviceId: string): SonoffConnector {
  const registry = getRegistry();
  const connector = registry.getConnector(deviceId);
  if (connector instanceof SonoffConnector) return connector;
  throw new Error(`Device ${deviceId} is not a Sonoff/eWeLink account (type: ${connector.deviceType})`);
}

export async function listDevices(args: { device_id: string }) {
  const sonoff = getSonoff(args.device_id);
  return sonoff.listDevices();
}

export async function getDeviceStatus(args: { device_id: string; sonoff_device_id: string }) {
  const sonoff = getSonoff(args.device_id);
  return sonoff.getDeviceStatus(args.sonoff_device_id);
}

export async function toggleDevice(args: {
  device_id: string;
  sonoff_device_id: string;
  state: 'on' | 'off';
}) {
  const sonoff = getSonoff(args.device_id);
  return sonoff.toggleDevice(args.sonoff_device_id, args.state);
}

export async function getPowerUsage(args: { device_id: string; sonoff_device_id: string }) {
  const sonoff = getSonoff(args.device_id);
  return sonoff.getPowerUsage(args.sonoff_device_id);
}
