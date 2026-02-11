import { RESTConnector } from './rest-connector.js';
import { SSHConnector } from './ssh-connector.js';
import { DeviceConfig, DeviceStatus, CommandResult } from '../types.js';

class MikrotikSshHelper extends SSHConnector {
  async getStatus(): Promise<DeviceStatus> {
    const output = await this.sshExec('/system resource print');
    return this.buildStatus({ details: { raw: output } });
  }
}

export class MikrotikConnector extends RESTConnector {
  private sshHelper: MikrotikSshHelper;

  constructor(config: DeviceConfig) {
    super(config);
    this.sshHelper = new MikrotikSshHelper(config);
    // Mikrotik REST API uses basic auth
    if (config.username && config.password) {
      this.headers['Authorization'] = 'Basic ' +
        Buffer.from(`${config.username}:${config.password}`).toString('base64');
    }
  }

  async connect(): Promise<void> {
    try {
      await this.apiGet('/rest/system/resource');
      this._status = 'connected';
    } catch {
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
      const info = await this.apiGet<Record<string, unknown>>('/rest/system/resource');
      return this.buildStatus({
        status: 'connected',
        uptime: String(info.uptime || ''),
        firmware: String(info.version || ''),
        model: String(info['board-name'] || ''),
        details: {
          cpu: info['cpu-load'],
          freeMemory: info['free-memory'],
          totalMemory: info['total-memory'],
        },
      });
    } catch {
      try {
        const result = await this.sshHelper.executeCommand('/system resource print');
        return this.buildStatus({
          status: 'connected',
          details: { raw: result.output },
        });
      } catch (error) {
        return this.buildStatus({
          status: 'error',
          details: { error: error instanceof Error ? error.message : String(error) },
        });
      }
    }
  }

  async getInterfaces(): Promise<unknown> {
    return this.apiGet('/rest/interface');
  }

  async getRoutes(): Promise<unknown> {
    return this.apiGet('/rest/ip/route');
  }

  async getFirewallFilter(chain?: string): Promise<unknown> {
    const path = chain
      ? `/rest/ip/firewall/filter?chain=${chain}`
      : '/rest/ip/firewall/filter';
    return this.apiGet(path);
  }

  async getFirewallNat(): Promise<unknown> {
    return this.apiGet('/rest/ip/firewall/nat');
  }

  async getDhcpLeases(): Promise<unknown> {
    return this.apiGet('/rest/ip/dhcp-server/lease');
  }

  async getWirelessClients(): Promise<unknown> {
    return this.apiGet('/rest/interface/wireless/registration-table');
  }

  async getQueues(): Promise<unknown> {
    return this.apiGet('/rest/queue/simple');
  }

  async getSystemResources(): Promise<unknown> {
    return this.apiGet('/rest/system/resource');
  }

  async executeCommand(command: string): Promise<CommandResult> {
    return this.sshHelper.executeCommand(command);
  }
}
