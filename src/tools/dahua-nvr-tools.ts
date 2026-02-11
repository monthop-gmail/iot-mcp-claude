import { getRegistry } from '../device-registry.js';
import { DahuaNvrConnector } from '../connectors/dahua-nvr-connector.js';

function getDahuaNvr(deviceId: string): DahuaNvrConnector {
  const registry = getRegistry();
  const connector = registry.getConnector(deviceId);
  if (connector instanceof DahuaNvrConnector) return connector;
  throw new Error(`Device ${deviceId} is not a Dahua NVR (type: ${connector.deviceType})`);
}

export async function getSystemInfo(args: { device_id: string }) {
  const nvr = getDahuaNvr(args.device_id);
  return nvr.getSystemInfo();
}

export async function getChannels(args: { device_id: string }) {
  const nvr = getDahuaNvr(args.device_id);
  return nvr.getChannels();
}

export async function getChannelStatus(args: { device_id: string }) {
  const nvr = getDahuaNvr(args.device_id);
  return nvr.getChannelStatus();
}

export async function getStorageInfo(args: { device_id: string }) {
  const nvr = getDahuaNvr(args.device_id);
  return nvr.getStorageInfo();
}

export async function getNetworkConfig(args: { device_id: string }) {
  const nvr = getDahuaNvr(args.device_id);
  return nvr.getNetworkConfig();
}

export async function getAlarms(args: { device_id: string; count?: number }) {
  const nvr = getDahuaNvr(args.device_id);
  return nvr.getAlarms(args.count);
}

export async function getRecordingStatus(args: { device_id: string }) {
  const nvr = getDahuaNvr(args.device_id);
  return nvr.getRecordingStatus();
}

export async function ptzControl(args: { device_id: string; channel: number; action: string; arg1?: number; arg2?: number; arg3?: number }) {
  const nvr = getDahuaNvr(args.device_id);
  return nvr.ptzControl(args.channel, args.action, args.arg1, args.arg2, args.arg3);
}
