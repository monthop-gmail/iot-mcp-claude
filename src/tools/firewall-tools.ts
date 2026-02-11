import { getRegistry } from '../device-registry.js';
import { FortigateConnector } from '../connectors/fortigate-connector.js';

function getFortigate(deviceId: string): FortigateConnector {
  const registry = getRegistry();
  const connector = registry.getConnector(deviceId);
  if (connector instanceof FortigateConnector) return connector;
  throw new Error(`Device ${deviceId} is not a Fortigate (type: ${connector.deviceType})`);
}

export async function getPolicies(args: { device_id: string; policy_id?: number }) {
  const fg = getFortigate(args.device_id);
  const result = await fg.getFirewallPolicies(args.policy_id);
  return { device_id: args.device_id, policies: result };
}

export async function getRoutes(args: { device_id: string }) {
  const fg = getFortigate(args.device_id);
  const result = await fg.getRoutes();
  return { device_id: args.device_id, routes: result };
}

export async function getInterfaces(args: { device_id: string }) {
  const fg = getFortigate(args.device_id);
  const result = await fg.getInterfaces();
  return { device_id: args.device_id, interfaces: result };
}

export async function getVpnStatus(args: { device_id: string }) {
  const fg = getFortigate(args.device_id);
  const result = await fg.getVpnStatus();
  return { device_id: args.device_id, vpn: result };
}

export async function getSystemStatus(args: { device_id: string }) {
  const fg = getFortigate(args.device_id);
  const result = await fg.getSystemStatus();
  return { device_id: args.device_id, system: result };
}

export async function getDhcpLeases(args: { device_id: string }) {
  const fg = getFortigate(args.device_id);
  const result = await fg.getDhcpLeases();
  return { device_id: args.device_id, leases: result };
}

export async function getSessions(args: { device_id: string; filter?: string }) {
  const fg = getFortigate(args.device_id);
  const result = await fg.getSessions(args.filter);
  return { device_id: args.device_id, sessions: result };
}

export async function executeCli(args: { device_id: string; command: string }) {
  const fg = getFortigate(args.device_id);
  return fg.executeCommand(args.command);
}
