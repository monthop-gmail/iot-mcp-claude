import { getRegistry } from '../device-registry.js';
import { HiFlyingConnector } from '../connectors/hiflying-connector.js';

function getHF(deviceId: string): HiFlyingConnector {
  const registry = getRegistry();
  const connector = registry.getConnector(deviceId);
  if (connector instanceof HiFlyingConnector) return connector;
  throw new Error(`Device ${deviceId} is not a Hi-Flying serial server (type: ${connector.deviceType})`);
}

export async function getDeviceInfo(args: { device_id: string }) {
  const hf = getHF(args.device_id);
  return hf.getDeviceInfo();
}

export async function getSerialConfig(args: { device_id: string; port?: number }) {
  const hf = getHF(args.device_id);
  return hf.getSerialConfig(args.port);
}

export async function setSerialConfig(args: {
  device_id: string;
  baud: number;
  data_bits?: number;
  stop_bits?: number;
  parity?: string;
  port?: number;
}) {
  const hf = getHF(args.device_id);
  return hf.setSerialConfig(args.baud, args.data_bits, args.stop_bits, args.parity, args.port);
}

export async function getNetworkConfig(args: { device_id: string }) {
  const hf = getHF(args.device_id);
  return hf.getNetworkConfig();
}

export async function getWifiConfig(args: { device_id: string }) {
  const hf = getHF(args.device_id);
  return hf.getWifiConfig();
}

export async function getTcpStatus(args: { device_id: string }) {
  const hf = getHF(args.device_id);
  return hf.getTcpStatus();
}

export async function atCommand(args: { device_id: string; command: string; timeout?: number }) {
  const hf = getHF(args.device_id);
  return hf.sendAtCommand(args.command, args.timeout);
}

export async function serialSend(args: { device_id: string; data: string; timeout?: number }) {
  const hf = getHF(args.device_id);
  return hf.serialSend(args.data, args.timeout);
}

export async function reboot(args: { device_id: string }) {
  const hf = getHF(args.device_id);
  return hf.reboot();
}
