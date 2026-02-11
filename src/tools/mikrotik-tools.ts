import { getRegistry } from '../device-registry.js';
import { MikrotikConnector } from '../connectors/mikrotik-connector.js';

function getMikrotik(deviceId: string): MikrotikConnector {
  const registry = getRegistry();
  const connector = registry.getConnector(deviceId);
  if (connector instanceof MikrotikConnector) return connector;
  throw new Error(`Device ${deviceId} is not a Mikrotik (type: ${connector.deviceType})`);
}

export async function getInterfaces(args: { device_id: string }) {
  const mt = getMikrotik(args.device_id);
  const result = await mt.getInterfaces();
  return { device_id: args.device_id, interfaces: result };
}

export async function getRoutes(args: { device_id: string }) {
  const mt = getMikrotik(args.device_id);
  const result = await mt.getRoutes();
  return { device_id: args.device_id, routes: result };
}

export async function getFirewall(args: { device_id: string; chain?: string }) {
  const mt = getMikrotik(args.device_id);
  const filter = await mt.getFirewallFilter(args.chain);
  const nat = await mt.getFirewallNat();
  return { device_id: args.device_id, filter, nat };
}

export async function getDhcpLeases(args: { device_id: string }) {
  const mt = getMikrotik(args.device_id);
  const result = await mt.getDhcpLeases();
  return { device_id: args.device_id, leases: result };
}

export async function getWireless(args: { device_id: string }) {
  const mt = getMikrotik(args.device_id);
  const result = await mt.getWirelessClients();
  return { device_id: args.device_id, clients: result };
}

export async function getQueues(args: { device_id: string }) {
  const mt = getMikrotik(args.device_id);
  const result = await mt.getQueues();
  return { device_id: args.device_id, queues: result };
}

export async function getSystemResources(args: { device_id: string }) {
  const mt = getMikrotik(args.device_id);
  const result = await mt.getSystemResources();
  return { device_id: args.device_id, resources: result };
}

export async function executeCommand(args: { device_id: string; command: string }) {
  const mt = getMikrotik(args.device_id);
  return mt.executeCommand(args.command);
}
