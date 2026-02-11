import { RESTConnector } from './rest-connector.js';
import { SSHConnector } from './ssh-connector.js';
import { DeviceConfig, DeviceStatus, CommandResult } from '../types.js';

class FortigateSshHelper extends SSHConnector {
  async getStatus(): Promise<DeviceStatus> {
    const output = await this.sshExec('get system status');
    return this.buildStatus({ details: { raw: output } });
  }
}

export class FortigateConnector extends RESTConnector {
  private sshHelper: FortigateSshHelper;

  constructor(config: DeviceConfig) {
    super(config);
    this.sshHelper = new FortigateSshHelper(config);
    // Fortigate uses API key in URL param or Bearer token
    if (config.apiKey) {
      this.headers['Authorization'] = `Bearer ${config.apiKey}`;
    }
  }

  async connect(): Promise<void> {
    // Test REST API connectivity
    try {
      await this.apiGet('/api/v2/monitor/system/status');
      this._status = 'connected';
    } catch {
      // Fallback: try SSH
      try {
        await this.sshHelper.connect();
        this._status = 'connected';
      } catch (error) {
        this._status = 'error';
        throw error;
      }
    }
  }

  async disconnect(): Promise<void> {
    await this.sshHelper.disconnect();
    this._status = 'disconnected';
  }

  async getStatus(): Promise<DeviceStatus> {
    try {
      const info = await this.apiGet<{ results: Record<string, unknown> }>(
        '/api/v2/monitor/system/status'
      );
      const r = info.results || info;
      return this.buildStatus({
        status: 'connected',
        firmware: String(r.version || ''),
        model: String(r.model || ''),
        uptime: String(r.uptime || ''),
        serialNumber: String(r.serial || ''),
      });
    } catch {
      // Fallback SSH
      try {
        const output = await this.sshHelper.executeCommand('get system status');
        return this.buildStatus({
          status: 'connected',
          details: { raw: output.output },
        });
      } catch (error) {
        return this.buildStatus({
          status: 'error',
          details: { error: error instanceof Error ? error.message : String(error) },
        });
      }
    }
  }

  async getFirewallPolicies(policyId?: number): Promise<unknown> {
    const path = policyId
      ? `/api/v2/cmdb/firewall/policy/${policyId}`
      : '/api/v2/cmdb/firewall/policy';
    return this.apiGet(path);
  }

  async getRoutes(): Promise<unknown> {
    return this.apiGet('/api/v2/monitor/router/ipv4');
  }

  async getInterfaces(): Promise<unknown> {
    return this.apiGet('/api/v2/cmdb/system/interface');
  }

  async getVpnStatus(): Promise<unknown> {
    return this.apiGet('/api/v2/monitor/vpn/ipsec');
  }

  async getSystemStatus(): Promise<unknown> {
    return this.apiGet('/api/v2/monitor/system/resource/usage');
  }

  async getDhcpLeases(): Promise<unknown> {
    return this.apiGet('/api/v2/monitor/system/dhcp');
  }

  async getSessions(filter?: string): Promise<unknown> {
    const path = filter
      ? `/api/v2/monitor/firewall/session?filter=${encodeURIComponent(filter)}`
      : '/api/v2/monitor/firewall/session';
    return this.apiGet(path);
  }

  async executeCommand(command: string): Promise<CommandResult> {
    return this.sshHelper.executeCommand(command);
  }
}
