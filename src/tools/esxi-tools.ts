import { getRegistry } from '../device-registry.js';
import { ESXiConnector } from '../connectors/esxi-connector.js';

function getESXi(deviceId: string): ESXiConnector {
  const registry = getRegistry();
  const connector = registry.getConnector(deviceId);
  if (connector instanceof ESXiConnector) return connector;
  throw new Error(`Device ${deviceId} is not an ESXi host (type: ${connector.deviceType})`);
}

// VM Tools
export async function listVMs(args: { device_id: string; filter?: string }) {
  const esxi = getESXi(args.device_id);
  const vms = await esxi.listVMs() as Array<Record<string, unknown>>;
  if (args.filter) {
    const f = args.filter.toLowerCase();
    return vms.filter(vm =>
      (vm.name as string).toLowerCase().includes(f) ||
      (vm.power_state as string).toLowerCase().includes(f)
    );
  }
  return vms;
}

export async function getVM(args: { device_id: string; vm_id?: string; vm_name?: string }) {
  const esxi = getESXi(args.device_id);
  let vmId = args.vm_id;
  if (!vmId && args.vm_name) {
    const vm = await esxi.findVMByName(args.vm_name);
    if (!vm) throw new Error(`VM not found: ${args.vm_name}`);
    vmId = vm.vm as string;
  }
  if (!vmId) throw new Error('Either vm_id or vm_name is required');
  const detail = await esxi.getVM(vmId);
  const powerState = await esxi.getVMPowerState(vmId);
  return { ...(detail as Record<string, unknown>), power_state: powerState };
}

export async function powerOn(args: { device_id: string; vm_id: string }) {
  const esxi = getESXi(args.device_id);
  await esxi.powerOn(args.vm_id);
  return { success: true, message: `VM ${args.vm_id} powered on` };
}

export async function powerOff(args: { device_id: string; vm_id: string; force?: boolean }) {
  const esxi = getESXi(args.device_id);
  if (args.force) {
    await esxi.powerOff(args.vm_id);
  } else {
    try {
      await esxi.guestShutdown(args.vm_id);
    } catch {
      await esxi.powerOff(args.vm_id);
    }
  }
  return { success: true, message: `VM ${args.vm_id} powered off` };
}

export async function restartVM(args: { device_id: string; vm_id: string; graceful?: boolean }) {
  const esxi = getESXi(args.device_id);
  if (args.graceful) {
    try {
      await esxi.guestReboot(args.vm_id);
    } catch {
      await esxi.restart(args.vm_id);
    }
  } else {
    await esxi.restart(args.vm_id);
  }
  return { success: true, message: `VM ${args.vm_id} restarted` };
}

export async function suspendVM(args: { device_id: string; vm_id: string }) {
  const esxi = getESXi(args.device_id);
  await esxi.suspend(args.vm_id);
  return { success: true, message: `VM ${args.vm_id} suspended` };
}

// Host Tools
export async function getHostInfo(args: { device_id: string }) {
  const esxi = getESXi(args.device_id);
  return esxi.getHostInfo();
}

export async function listDatastores(args: { device_id: string }) {
  const esxi = getESXi(args.device_id);
  return esxi.listDatastores();
}

export async function listNetworks(args: { device_id: string }) {
  const esxi = getESXi(args.device_id);
  return esxi.listNetworks();
}

// Snapshot Tools
export async function listSnapshots(args: { device_id: string; vm_id: string }) {
  const esxi = getESXi(args.device_id);
  return esxi.listSnapshots(args.vm_id);
}

export async function createSnapshot(args: { device_id: string; vm_id: string; name: string; description?: string; memory?: boolean }) {
  const esxi = getESXi(args.device_id);
  const snapshotId = await esxi.createSnapshot(args.vm_id, args.name, args.description, args.memory);
  return { success: true, snapshot_id: snapshotId, message: `Snapshot "${args.name}" created for VM ${args.vm_id}` };
}

export async function deleteSnapshot(args: { device_id: string; vm_id: string; snapshot_id: string }) {
  const esxi = getESXi(args.device_id);
  await esxi.deleteSnapshot(args.vm_id, args.snapshot_id);
  return { success: true, message: `Snapshot ${args.snapshot_id} deleted from VM ${args.vm_id}` };
}

export async function revertSnapshot(args: { device_id: string; vm_id: string; snapshot_id: string }) {
  const esxi = getESXi(args.device_id);
  await esxi.revertSnapshot(args.vm_id, args.snapshot_id);
  return { success: true, message: `VM ${args.vm_id} reverted to snapshot ${args.snapshot_id}` };
}
