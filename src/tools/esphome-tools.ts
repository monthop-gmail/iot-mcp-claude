import { getRegistry } from '../device-registry.js';
import { ESPHomeConnector } from '../connectors/esphome-connector.js';

function getESPHome(deviceId: string): ESPHomeConnector {
  const registry = getRegistry();
  const connector = registry.getConnector(deviceId);
  if (connector instanceof ESPHomeConnector) return connector;
  throw new Error(`Device ${deviceId} is not an ESPHome controller (type: ${connector.deviceType})`);
}

export async function listDevices(args: { device_id: string }) {
  const esp = getESPHome(args.device_id);
  return esp.listDevices();
}

export async function getDeviceInfo(args: { device_id: string; esphome_device: string }) {
  const esp = getESPHome(args.device_id);
  return esp.getDeviceInfo(args.esphome_device);
}

export async function getStates(args: { device_id: string; esphome_device: string }) {
  const esp = getESPHome(args.device_id);
  return esp.getStates(args.esphome_device);
}

export async function callService(args: {
  device_id: string;
  esphome_device: string;
  service: string;
  data?: Record<string, unknown>;
}) {
  const esp = getESPHome(args.device_id);
  return esp.callService(args.esphome_device, args.service, args.data);
}

export async function getLogs(args: { device_id: string; esphome_device: string }) {
  const esp = getESPHome(args.device_id);
  return esp.getLogs(args.esphome_device);
}

export async function compile(args: { device_id: string; esphome_device: string }) {
  const esp = getESPHome(args.device_id);
  return esp.compile(args.esphome_device);
}
