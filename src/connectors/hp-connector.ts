import { SSHConnector } from './ssh-connector.js';
import { DeviceStatus } from '../types.js';

export class HPConnector extends SSHConnector {

  async getStatus(): Promise<DeviceStatus> {
    try {
      const output = await this.sshExec('show system');
      return this.buildStatus({
        status: 'connected',
        uptime: this.parseUptime(output),
        firmware: this.parseFirmware(output),
        model: this.parseModel(output),
        serialNumber: this.parseSerial(output),
      });
    } catch (error) {
      return this.buildStatus({
        status: 'error',
        details: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  async getInterfaces(): Promise<string> {
    return this.sshExec('show interfaces brief');
  }

  async getVlans(): Promise<string> {
    return this.sshExec('show vlans');
  }

  async getMacTable(vlan?: number): Promise<string> {
    const cmd = vlan ? `show mac-address vlan ${vlan}` : 'show mac-address';
    return this.sshExec(cmd);
  }

  async getArpTable(): Promise<string> {
    return this.sshExec('show arp');
  }

  async getLldpNeighbors(): Promise<string> {
    return this.sshExec('show lldp info remote-device');
  }

  async getSpanningTree(): Promise<string> {
    return this.sshExec('show spanning-tree');
  }

  async getPortSecurity(): Promise<string> {
    return this.sshExec('show port-security');
  }

  async getLogs(lines?: number): Promise<string> {
    const cmd = lines ? `show logging -r -n ${lines}` : 'show logging -r';
    return this.sshExec(cmd);
  }

  async getRunningConfig(section?: string): Promise<string> {
    return this.sshExec('show running-config');
  }

  private parseUptime(output: string): string {
    const match = output.match(/Up Time\s*:\s*(.+)/i);
    return match?.[1]?.trim() || 'unknown';
  }

  private parseFirmware(output: string): string {
    const match = output.match(/Firmware revision\s*:\s*(\S+)/i)
      || output.match(/Software revision\s*:\s*(\S+)/i);
    return match?.[1] || 'unknown';
  }

  private parseModel(output: string): string {
    const match = output.match(/System Description\s*:\s*(.+)/i);
    return match?.[1]?.trim() || 'unknown';
  }

  private parseSerial(output: string): string {
    const match = output.match(/Serial Number\s*:\s*(\S+)/i);
    return match?.[1] || 'unknown';
  }
}
