import { RESTConnector } from './rest-connector.js';
import { DeviceConfig, DeviceStatus } from '../types.js';

export class DahuaNvrConnector extends RESTConnector {
  private authHeader: string;

  constructor(config: DeviceConfig) {
    super(config);
    // Dahua NVR/DVR/IPC uses Basic or Digest auth via CGI API
    this.authHeader = 'Basic ' + Buffer.from(`${config.username || ''}:${config.password || ''}`).toString('base64');
    this.headers['Authorization'] = this.authHeader;
  }

  private async cgiGet<T = string>(path: string): Promise<T> {
    return this.apiFetch<T>(path, { method: 'GET' });
  }

  private parseCgiResponse(text: string): Record<string, string> {
    // Dahua CGI returns key=value lines
    const result: Record<string, string> = {};
    for (const line of text.split('\n')) {
      const eq = line.indexOf('=');
      if (eq > 0) {
        result[line.substring(0, eq).trim()] = line.substring(eq + 1).trim();
      }
    }
    return result;
  }

  async connect(): Promise<void> {
    // Test connection by getting system info
    await this.cgiGet('/cgi-bin/magicBox.cgi?action=getSystemInfo');
    this._status = 'connected';
  }

  async disconnect(): Promise<void> {
    this._status = 'disconnected';
  }

  async getStatus(): Promise<DeviceStatus> {
    try {
      const info = await this.getSystemInfo();
      return this.buildStatus({
        status: 'connected',
        model: info.deviceType as string | undefined,
        firmware: info.softwareVersion as string | undefined,
        serialNumber: info.serialNumber as string | undefined,
        details: info,
      });
    } catch (error) {
      return this.buildStatus({
        status: 'error',
        details: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  async getSystemInfo(): Promise<Record<string, unknown>> {
    const text = await this.cgiGet<string>('/cgi-bin/magicBox.cgi?action=getSystemInfo');
    return this.parseCgiResponse(String(text));
  }

  async getChannels(): Promise<unknown> {
    try {
      // Try getting channel titles
      const text = await this.cgiGet<string>('/cgi-bin/configManager.cgi?action=getConfig&name=ChannelTitle');
      const parsed = this.parseCgiResponse(String(text));
      const channels: Array<Record<string, string>> = [];
      for (const [key, value] of Object.entries(parsed)) {
        const match = key.match(/table\.ChannelTitle\[(\d+)\]\.Name/);
        if (match) {
          channels.push({ channel: match[1], name: value });
        }
      }
      return channels.length > 0 ? channels : parsed;
    } catch {
      return this.cgiGet('/cgi-bin/devVideoInput.cgi?action=getCollect');
    }
  }

  async getChannelStatus(): Promise<unknown> {
    try {
      const text = await this.cgiGet<string>('/cgi-bin/devVideoInput.cgi?action=getCollect');
      return this.parseCgiResponse(String(text));
    } catch {
      return this.cgiGet('/cgi-bin/configManager.cgi?action=getConfig&name=VideoInOptions');
    }
  }

  async getStorageInfo(): Promise<unknown> {
    try {
      const text = await this.cgiGet<string>('/cgi-bin/storageDevice.cgi?action=factory.getCollect');
      return this.parseCgiResponse(String(text));
    } catch {
      const text = await this.cgiGet<string>('/cgi-bin/configManager.cgi?action=getConfig&name=StorageGlobal');
      return this.parseCgiResponse(String(text));
    }
  }

  async getNetworkConfig(): Promise<unknown> {
    const text = await this.cgiGet<string>('/cgi-bin/configManager.cgi?action=getConfig&name=Network');
    return this.parseCgiResponse(String(text));
  }

  async getAlarms(count = 50): Promise<unknown> {
    try {
      const text = await this.cgiGet<string>(`/cgi-bin/eventManager.cgi?action=getEventIndexes&count=${count}`);
      return this.parseCgiResponse(String(text));
    } catch {
      return { message: 'Event query not supported on this device' };
    }
  }

  async getRecordingStatus(): Promise<unknown> {
    try {
      const text = await this.cgiGet<string>('/cgi-bin/configManager.cgi?action=getConfig&name=RecordMode');
      return this.parseCgiResponse(String(text));
    } catch {
      return this.cgiGet('/cgi-bin/recManager.cgi?action=getState');
    }
  }

  async ptzControl(channel: number, action: string, arg1 = 0, arg2 = 0, arg3 = 0): Promise<unknown> {
    const text = await this.cgiGet<string>(
      `/cgi-bin/ptz.cgi?action=start&channel=${channel}&code=${action}&arg1=${arg1}&arg2=${arg2}&arg3=${arg3}`
    );
    return { success: !String(text).includes('Error'), raw: String(text).trim() };
  }

  async executeCommand(command: string): Promise<import('../types.js').CommandResult> {
    return {
      success: false,
      device: this.config.id,
      command,
      output: '',
      error: 'Direct CLI not supported via Dahua HTTP API.',
    };
  }

  async getConfig(section?: string): Promise<string> {
    const info = await this.getSystemInfo();
    return JSON.stringify(info, null, 2);
  }
}
