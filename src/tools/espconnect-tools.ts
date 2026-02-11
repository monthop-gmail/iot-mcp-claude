import { getRegistry } from '../device-registry.js';
import { ESPConnectConnector } from '../connectors/espconnect-connector.js';

function getESPConnect(deviceId: string): ESPConnectConnector {
  const registry = getRegistry();
  const connector = registry.getConnector(deviceId);
  if (connector instanceof ESPConnectConnector) return connector;
  throw new Error(`Device ${deviceId} is not an ESPConnect hub (type: ${connector.deviceType})`);
}

export async function listDevices(args: { device_id: string }) {
  const esp = getESPConnect(args.device_id);
  return esp.listDevices();
}

export async function getDeviceStatus(args: { device_id: string; esp_device_id: string }) {
  const esp = getESPConnect(args.device_id);
  return esp.getDeviceStatus(args.esp_device_id);
}

export async function sendCommand(args: {
  device_id: string;
  esp_device_id: string;
  command: string;
}) {
  const esp = getESPConnect(args.device_id);
  return esp.sendCommand(args.esp_device_id, args.command);
}

export async function otaUpdate(args: {
  device_id: string;
  esp_device_id: string;
  firmware_url: string;
}) {
  const esp = getESPConnect(args.device_id);
  return esp.otaUpdate(args.esp_device_id, args.firmware_url);
}
