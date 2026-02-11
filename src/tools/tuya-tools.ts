import { getRegistry } from '../device-registry.js';
import { TuyaConnector } from '../connectors/tuya-connector.js';

function getTuya(deviceId: string): TuyaConnector {
  const registry = getRegistry();
  const connector = registry.getConnector(deviceId);
  if (connector instanceof TuyaConnector) return connector;
  throw new Error(`Device ${deviceId} is not a Tuya account (type: ${connector.deviceType})`);
}

export async function listDevices(args: { device_id: string }) {
  const tuya = getTuya(args.device_id);
  return tuya.listDevices();
}

export async function getDeviceStatus(args: { device_id: string; tuya_device_id: string }) {
  const tuya = getTuya(args.device_id);
  return tuya.getDeviceStatus(args.tuya_device_id);
}

export async function sendCommands(args: {
  device_id: string;
  tuya_device_id: string;
  commands: Array<{ code: string; value: unknown }>;
}) {
  const tuya = getTuya(args.device_id);
  return tuya.sendCommands(args.tuya_device_id, args.commands);
}

export async function getScenes(args: { device_id: string }) {
  const tuya = getTuya(args.device_id);
  return tuya.getScenes();
}

export async function triggerScene(args: { device_id: string; scene_id: string }) {
  const tuya = getTuya(args.device_id);
  return tuya.triggerScene(args.scene_id);
}
