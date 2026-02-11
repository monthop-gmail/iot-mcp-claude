import { getRegistry } from '../device-registry.js';
import { SynologyConnector } from '../connectors/synology-connector.js';

function getSynology(deviceId: string): SynologyConnector {
  const registry = getRegistry();
  const connector = registry.getConnector(deviceId);
  if (connector instanceof SynologyConnector) return connector;
  throw new Error(`Device ${deviceId} is not a Synology NAS (type: ${connector.deviceType})`);
}

export async function getSystemInfo(args: { device_id: string }) {
  const nas = getSynology(args.device_id);
  return nas.getSystemInfo();
}

export async function getStorageInfo(args: { device_id: string }) {
  const nas = getSynology(args.device_id);
  return nas.getStorageInfo();
}

export async function getDisks(args: { device_id: string }) {
  const nas = getSynology(args.device_id);
  return nas.getDisks();
}

export async function getSharedFolders(args: { device_id: string }) {
  const nas = getSynology(args.device_id);
  return nas.getSharedFolders();
}

export async function getNetworkInterfaces(args: { device_id: string }) {
  const nas = getSynology(args.device_id);
  return nas.getNetworkInterfaces();
}

export async function getInstalledPackages(args: { device_id: string }) {
  const nas = getSynology(args.device_id);
  return nas.getInstalledPackages();
}

export async function getSystemUtilization(args: { device_id: string }) {
  const nas = getSynology(args.device_id);
  return nas.getSystemUtilization();
}

export async function getSystemLogs(args: { device_id: string; count?: number }) {
  const nas = getSynology(args.device_id);
  return nas.getSystemLogs(args.count);
}

export async function getDockerContainers(args: { device_id: string }) {
  const nas = getSynology(args.device_id);
  return nas.getDockerContainers();
}
