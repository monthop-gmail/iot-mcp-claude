import { getRegistry } from '../device-registry.js';
import { CiscoConnector } from '../connectors/cisco-connector.js';
import { HPConnector } from '../connectors/hp-connector.js';

function getSwitchConnector(deviceId: string): CiscoConnector | HPConnector {
  const registry = getRegistry();
  const connector = registry.getConnector(deviceId);
  if (connector instanceof CiscoConnector || connector instanceof HPConnector) {
    return connector;
  }
  throw new Error(`Device ${deviceId} is not a switch (type: ${connector.deviceType})`);
}

export async function showInterfaces(args: { device_id: string }) {
  const sw = getSwitchConnector(args.device_id);
  const output = await sw.getInterfaces();
  return { device_id: args.device_id, output };
}

export async function showVlans(args: { device_id: string }) {
  const sw = getSwitchConnector(args.device_id);
  const output = await sw.getVlans();
  return { device_id: args.device_id, output };
}

export async function showMacTable(args: { device_id: string; vlan?: number }) {
  const sw = getSwitchConnector(args.device_id);
  const output = await sw.getMacTable(args.vlan);
  return { device_id: args.device_id, output };
}

export async function showArp(args: { device_id: string }) {
  const sw = getSwitchConnector(args.device_id);
  const output = await sw.getArpTable();
  return { device_id: args.device_id, output };
}

export async function showNeighbors(args: { device_id: string }) {
  const sw = getSwitchConnector(args.device_id);
  let output: string;
  if (sw instanceof CiscoConnector) {
    output = await sw.getCdpNeighbors();
  } else {
    output = await sw.getLldpNeighbors();
  }
  return { device_id: args.device_id, output };
}

export async function showSpanningTree(args: { device_id: string }) {
  const sw = getSwitchConnector(args.device_id);
  const output = await sw.getSpanningTree();
  return { device_id: args.device_id, output };
}

export async function showPortSecurity(args: { device_id: string }) {
  const sw = getSwitchConnector(args.device_id);
  const output = await sw.getPortSecurity();
  return { device_id: args.device_id, output };
}

export async function showLogs(args: { device_id: string; lines?: number }) {
  const sw = getSwitchConnector(args.device_id);
  const output = await sw.getLogs(args.lines);
  return { device_id: args.device_id, output };
}
