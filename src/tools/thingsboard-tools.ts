import { getRegistry } from '../device-registry.js';
import { ThingsBoardConnector } from '../connectors/thingsboard-connector.js';

function getThingsBoard(deviceId: string): ThingsBoardConnector {
  const registry = getRegistry();
  const connector = registry.getConnector(deviceId);
  if (connector instanceof ThingsBoardConnector) return connector;
  throw new Error(`Device ${deviceId} is not a ThingsBoard server (type: ${connector.deviceType})`);
}

export async function listDevices(args: { device_id: string; page?: number; limit?: number }) {
  const tb = getThingsBoard(args.device_id);
  return tb.listDevices(args.page, args.limit);
}

export async function getDeviceTelemetry(args: {
  device_id: string;
  tb_device_id: string;
  keys?: string[];
}) {
  const tb = getThingsBoard(args.device_id);
  return tb.getDeviceTelemetry(args.tb_device_id, args.keys);
}

export async function getDeviceAttributes(args: {
  device_id: string;
  tb_device_id: string;
}) {
  const tb = getThingsBoard(args.device_id);
  return tb.getDeviceAttributes(args.tb_device_id);
}

export async function sendRpc(args: {
  device_id: string;
  tb_device_id: string;
  method: string;
  params?: Record<string, unknown>;
}) {
  const tb = getThingsBoard(args.device_id);
  return tb.sendRpc(args.tb_device_id, args.method, args.params);
}

export async function getAlarms(args: { device_id: string; severity?: string }) {
  const tb = getThingsBoard(args.device_id);
  return tb.getAlarms(args.severity);
}

export async function getDashboards(args: { device_id: string }) {
  const tb = getThingsBoard(args.device_id);
  return tb.getDashboards();
}
