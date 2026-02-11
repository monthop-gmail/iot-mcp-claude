import { getRegistry } from '../device-registry.js';
import { DahuaDssConnector } from '../connectors/dahua-dss-connector.js';

function getDahuaDss(deviceId: string): DahuaDssConnector {
  const registry = getRegistry();
  const connector = registry.getConnector(deviceId);
  if (connector instanceof DahuaDssConnector) return connector;
  throw new Error(`Device ${deviceId} is not a Dahua DSS server (type: ${connector.deviceType})`);
}

export async function getServerInfo(args: { device_id: string }) {
  const dss = getDahuaDss(args.device_id);
  return dss.getServerInfo();
}

export async function listDevices(args: { device_id: string; page?: number; page_size?: number }) {
  const dss = getDahuaDss(args.device_id);
  return dss.listDevices(args.page, args.page_size);
}

export async function getDeviceInfo(args: { device_id: string; device_code: string }) {
  const dss = getDahuaDss(args.device_id);
  return dss.getDeviceInfo(args.device_code);
}

export async function listChannels(args: { device_id: string; device_code?: string; page?: number; page_size?: number }) {
  const dss = getDahuaDss(args.device_id);
  return dss.listChannels(args.device_code, args.page, args.page_size);
}

export async function getChannelStatus(args: { device_id: string; channel_ids: string[] }) {
  const dss = getDahuaDss(args.device_id);
  return dss.getChannelStatus(args.channel_ids);
}

export async function listAlarms(args: { device_id: string; start_time?: string; end_time?: string; page?: number; page_size?: number }) {
  const dss = getDahuaDss(args.device_id);
  return dss.listAlarms(args.start_time, args.end_time, args.page, args.page_size);
}

export async function listOrganizations(args: { device_id: string }) {
  const dss = getDahuaDss(args.device_id);
  return dss.listOrganizations();
}

export async function getRecordStatus(args: { device_id: string; channel_id: string }) {
  const dss = getDahuaDss(args.device_id);
  return dss.getRecordStatus(args.channel_id);
}

export async function getDeviceOnlineStatus(args: { device_id: string; device_codes: string[] }) {
  const dss = getDahuaDss(args.device_id);
  return dss.getDeviceOnlineStatus(args.device_codes);
}
