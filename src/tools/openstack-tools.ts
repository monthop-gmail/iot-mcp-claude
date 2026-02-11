import { getRegistry } from '../device-registry.js';
import { OpenStackConnector } from '../connectors/openstack-connector.js';

function getOpenStack(deviceId: string): OpenStackConnector {
  const registry = getRegistry();
  const connector = registry.getConnector(deviceId);
  if (connector instanceof OpenStackConnector) return connector;
  throw new Error(`Device ${deviceId} is not an OpenStack server (type: ${connector.deviceType})`);
}

export async function listServers(args: { device_id: string }) {
  const os = getOpenStack(args.device_id);
  return os.listServers();
}

export async function getServerDetail(args: { device_id: string; server_id: string }) {
  const os = getOpenStack(args.device_id);
  return os.getServerDetail(args.server_id);
}

export async function serverAction(args: { device_id: string; server_id: string; action: string }) {
  const os = getOpenStack(args.device_id);
  return os.serverAction(args.server_id, args.action);
}

export async function listFlavors(args: { device_id: string }) {
  const os = getOpenStack(args.device_id);
  return os.listFlavors();
}

export async function listHypervisors(args: { device_id: string }) {
  const os = getOpenStack(args.device_id);
  return os.listHypervisors();
}

export async function listImages(args: { device_id: string }) {
  const os = getOpenStack(args.device_id);
  return os.listImages();
}

export async function listNetworks(args: { device_id: string }) {
  const os = getOpenStack(args.device_id);
  return os.listNetworks();
}

export async function listSubnets(args: { device_id: string }) {
  const os = getOpenStack(args.device_id);
  return os.listSubnets();
}

export async function listRouters(args: { device_id: string }) {
  const os = getOpenStack(args.device_id);
  return os.listRouters();
}

export async function listFloatingIps(args: { device_id: string }) {
  const os = getOpenStack(args.device_id);
  return os.listFloatingIps();
}

export async function listVolumes(args: { device_id: string }) {
  const os = getOpenStack(args.device_id);
  return os.listVolumes();
}

export async function listProjects(args: { device_id: string }) {
  const os = getOpenStack(args.device_id);
  return os.listProjects();
}
