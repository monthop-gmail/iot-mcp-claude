import { getRegistry } from '../device-registry.js';
import { ProxmoxConnector } from '../connectors/proxmox-connector.js';

function getProxmox(deviceId: string): ProxmoxConnector {
  const registry = getRegistry();
  const connector = registry.getConnector(deviceId);
  if (connector instanceof ProxmoxConnector) return connector;
  throw new Error(`Device ${deviceId} is not a Proxmox server (type: ${connector.deviceType})`);
}

export async function getNodes(args: { device_id: string }) {
  const pve = getProxmox(args.device_id);
  return pve.getNodes();
}

export async function getNodeStatus(args: { device_id: string; node: string }) {
  const pve = getProxmox(args.device_id);
  return pve.getNodeStatus(args.node);
}

export async function listVMs(args: { device_id: string; node: string }) {
  const pve = getProxmox(args.device_id);
  return pve.listVMs(args.node);
}

export async function getVMStatus(args: { device_id: string; node: string; vmid: number }) {
  const pve = getProxmox(args.device_id);
  return pve.getVMStatus(args.node, args.vmid);
}

export async function listContainers(args: { device_id: string; node: string }) {
  const pve = getProxmox(args.device_id);
  return pve.listContainers(args.node);
}

export async function getContainerStatus(args: { device_id: string; node: string; vmid: number }) {
  const pve = getProxmox(args.device_id);
  return pve.getContainerStatus(args.node, args.vmid);
}

export async function getStorage(args: { device_id: string; node: string }) {
  const pve = getProxmox(args.device_id);
  return pve.getStorage(args.node);
}

export async function getNetwork(args: { device_id: string; node: string }) {
  const pve = getProxmox(args.device_id);
  return pve.getNetwork(args.node);
}

export async function getClusterResources(args: { device_id: string; type?: string }) {
  const pve = getProxmox(args.device_id);
  return pve.getClusterResources(args.type);
}

export async function getTasks(args: { device_id: string; node: string; limit?: number }) {
  const pve = getProxmox(args.device_id);
  return pve.getTasks(args.node, args.limit);
}
