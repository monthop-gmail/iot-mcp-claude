import { getRegistry } from '../device-registry.js';
import { QnapConnector } from '../connectors/qnap-connector.js';

function getQnap(deviceId: string): QnapConnector {
  const registry = getRegistry();
  const connector = registry.getConnector(deviceId);
  if (connector instanceof QnapConnector) return connector;
  throw new Error(`Device ${deviceId} is not a QNAP NAS (type: ${connector.deviceType})`);
}

export async function getSystemInfo(args: { device_id: string }) {
  const qnap = getQnap(args.device_id);
  return qnap.getSystemInfo();
}

export async function getVolumes(args: { device_id: string }) {
  const qnap = getQnap(args.device_id);
  return qnap.getVolumes();
}

export async function getDisks(args: { device_id: string }) {
  const qnap = getQnap(args.device_id);
  return qnap.getDisks();
}

export async function getSharedFolders(args: { device_id: string }) {
  const qnap = getQnap(args.device_id);
  return qnap.getSharedFolders();
}

export async function getNetworkInterfaces(args: { device_id: string }) {
  const qnap = getQnap(args.device_id);
  return qnap.getNetworkInterfaces();
}

export async function getRunningApps(args: { device_id: string }) {
  const qnap = getQnap(args.device_id);
  return qnap.getRunningApps();
}

export async function getSystemLogs(args: { device_id: string; count?: number }) {
  const qnap = getQnap(args.device_id);
  return qnap.getSystemLogs(args.count);
}

export async function getResourceUsage(args: { device_id: string }) {
  const qnap = getQnap(args.device_id);
  return qnap.getResourceUsage();
}
