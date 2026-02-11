import { SSHConnector } from './ssh-connector.js';
import { DeviceStatus } from '../types.js';

export class CiscoConnector extends SSHConnector {

  async getStatus(): Promise<DeviceStatus> {
    try {
      const output = await this.sshExec('show version');
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
    return this.sshExec('show ip interface brief');
  }

  async getVlans(): Promise<string> {
    return this.sshExec('show vlan brief');
  }

  async getMacTable(vlan?: number): Promise<string> {
    const cmd = vlan ? `show mac address-table vlan ${vlan}` : 'show mac address-table';
    return this.sshExec(cmd);
  }

  async getArpTable(): Promise<string> {
    return this.sshExec('show arp');
  }

  async getCdpNeighbors(): Promise<string> {
    return this.sshExec('show cdp neighbors detail');
  }

  async getSpanningTree(): Promise<string> {
    return this.sshExec('show spanning-tree brief');
  }

  async getPortSecurity(): Promise<string> {
    return this.sshExec('show port-security');
  }

  async getLogs(lines?: number): Promise<string> {
    const cmd = lines ? `show logging | tail ${lines}` : 'show logging';
    return this.sshExec(cmd);
  }

  async getRunningConfig(section?: string): Promise<string> {
    const cmd = section
      ? `show running-config | section ${section}`
      : 'show running-config';
    return this.sshExec(cmd);
  }

  private parseUptime(output: string): string {
    const match = output.match(/uptime is (.+)/i);
    return match?.[1]?.trim() || 'unknown';
  }

  private parseFirmware(output: string): string {
    const match = output.match(/Version ([^\s,]+)/i);
    return match?.[1] || 'unknown';
  }

  private parseModel(output: string): string {
    const match = output.match(/(?:cisco|Model number)\s*:\s*(.+)/i)
      || output.match(/^cisco\s+(\S+)/im);
    return match?.[1]?.trim() || 'unknown';
  }

  private parseSerial(output: string): string {
    const match = output.match(/(?:System serial number|Processor board ID)\s*:\s*(\S+)/i);
    return match?.[1] || 'unknown';
  }
}
