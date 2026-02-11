import { execSync } from 'child_process';
import { getRegistry } from '../device-registry.js';
import { DeviceType } from '../types.js';
import { SerialConnector } from '../connectors/serial-connector.js';

export async function listDevices(args: {
  filter?: string;
  type?: DeviceType;
  tag?: string;
}) {
  const registry = getRegistry();
  let devices = registry.listDevices();

  if (args.type) {
    devices = devices.filter(d => d.type === args.type);
  }
  if (args.tag) {
    devices = devices.filter(d => d.tags?.includes(args.tag!));
  }
  if (args.filter) {
    devices = registry.searchDevices(args.filter);
  }

  return {
    total: devices.length,
    devices: devices.map(d => ({
      id: d.id,
      name: d.name,
      type: d.type,
      transport: d.transport,
      host: d.host,
      vpn: d.vpn,
      tags: d.tags,
    })),
  };
}

export async function deviceStatus(args: { device_id: string }) {
  const registry = getRegistry();
  return registry.getDeviceStatus(args.device_id);
}

export async function testConnection(args: { device_id: string }) {
  const registry = getRegistry();
  const connector = registry.getConnector(args.device_id);
  const result = await connector.testConnection();
  return {
    device_id: args.device_id,
    reachable: result,
    tested_at: new Date().toISOString(),
  };
}

export async function allStatus(args: { type?: DeviceType; tag?: string }) {
  const registry = getRegistry();
  const statuses = await registry.getAllStatuses(args.type, args.tag);
  return {
    total: statuses.length,
    connected: statuses.filter(s => s.status === 'connected').length,
    errors: statuses.filter(s => s.status === 'error').length,
    devices: statuses,
  };
}

export async function executeCommand(args: { device_id: string; command: string }) {
  const registry = getRegistry();
  const connector = registry.getConnector(args.device_id);
  return connector.executeCommand(args.command);
}

export async function getConfig(args: { device_id: string; section?: string }) {
  const registry = getRegistry();
  const connector = registry.getConnector(args.device_id);
  const config = await connector.getConfig(args.section);
  return {
    device_id: args.device_id,
    section: args.section || 'full',
    config,
  };
}

export async function listSerialPorts() {
  const ports = await SerialConnector.listPorts();
  return { ports };
}

export async function vpnStatus() {
  const result: {
    openvpn: Array<{ name: string; status: string; ip?: string }>;
    wireguard: Array<{ name: string; status: string; peers?: number }>;
    tailscale: { status: string; ip?: string; hostname?: string };
    interfaces: string;
  } = {
    openvpn: [],
    wireguard: [],
    tailscale: { status: 'not running' },
    interfaces: '',
  };

  // Check OpenVPN tunnels
  try {
    const tuns = execSync('ip -o link show type tun 2>/dev/null || true', { encoding: 'utf-8' }).trim();
    if (tuns) {
      for (const line of tuns.split('\n')) {
        const match = line.match(/\d+:\s+(\S+?)[@:]/);
        if (match) {
          const name = match[1];
          let ip: string | undefined;
          try {
            const addrOut = execSync(`ip -4 addr show ${name} 2>/dev/null`, { encoding: 'utf-8' });
            const ipMatch = addrOut.match(/inet\s+([\d.]+)/);
            ip = ipMatch?.[1];
          } catch { /* ignore */ }
          result.openvpn.push({ name, status: 'up', ip });
        }
      }
    }
  } catch { /* ignore */ }

  // Check WireGuard interfaces
  try {
    const wgOut = execSync('wg show 2>/dev/null || true', { encoding: 'utf-8' }).trim();
    if (wgOut) {
      const ifaces = wgOut.split(/(?=interface:)/);
      for (const iface of ifaces) {
        const nameMatch = iface.match(/interface:\s+(\S+)/);
        if (nameMatch) {
          const peers = (iface.match(/peer:/g) || []).length;
          result.wireguard.push({ name: nameMatch[1], status: 'up', peers });
        }
      }
    }
  } catch { /* ignore */ }

  // Check Tailscale
  try {
    const tsOut = execSync('tailscale status --json 2>/dev/null || true', { encoding: 'utf-8' }).trim();
    if (tsOut && tsOut.startsWith('{')) {
      const ts = JSON.parse(tsOut);
      result.tailscale = {
        status: ts.BackendState || 'unknown',
        ip: ts.TailscaleIPs?.[0],
        hostname: ts.Self?.HostName,
      };
    }
  } catch { /* ignore */ }

  // All network interfaces summary
  try {
    result.interfaces = execSync('ip -brief addr show 2>/dev/null || true', { encoding: 'utf-8' }).trim();
  } catch { /* ignore */ }

  return result;
}
