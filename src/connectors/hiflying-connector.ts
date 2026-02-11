import { Socket } from 'node:net';
import { RESTConnector } from './rest-connector.js';
import { DeviceConfig, DeviceStatus, CommandResult } from '../types.js';

export class HiFlyingConnector extends RESTConnector {
  private atPort: number;
  private serialTcpPort: number;
  private deviceHost: string;

  constructor(config: DeviceConfig) {
    super(config);
    this.atPort = (config.extra?.atPort as number) || 49000;
    this.serialTcpPort = (config.extra?.serialPort as number) || 8899;
    this.deviceHost = config.host || new URL(this.baseUrl).hostname;
  }

  async connect(): Promise<void> {
    try {
      const result = await this.sendAtCommand('AT');
      if (result.includes('ok') || result.includes('OK') || result === '') {
        this._status = 'connected';
        return;
      }
    } catch {
      // AT failed, try HTTP
    }

    try {
      const response = await fetch(`${this.baseUrl}/`, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok || response.status < 500) {
        this._status = 'connected';
        return;
      }
    } catch {
      // HTTP also failed
    }

    throw new Error(`Cannot connect to Hi-Flying device at ${this.deviceHost} (AT port ${this.atPort} / HTTP)`);
  }

  async disconnect(): Promise<void> {
    this._status = 'disconnected';
  }

  // ── AT Command Interface ──

  sendAtCommand(command: string, timeout: number = 3000): Promise<string> {
    return new Promise((resolve, reject) => {
      const socket = new Socket();
      let data = '';

      const timer = setTimeout(() => {
        socket.destroy();
        if (data) {
          resolve(this.parseAtResponse(data));
        } else {
          reject(new Error(`AT command timeout (${timeout}ms): ${command}`));
        }
      }, timeout);

      socket.connect(this.atPort, this.deviceHost, () => {
        socket.write(`${command}\r\n`);
      });

      socket.on('data', (chunk) => {
        data += chunk.toString();
        // Response complete when we get +ok, +ERR, OK, or ERROR
        if (/\+ok[=\r\n]|^\+ok$/m.test(data) ||
            /\+ERR/i.test(data) ||
            /\r\nOK\r\n/.test(data) ||
            /\r\nERROR\r\n/.test(data)) {
          clearTimeout(timer);
          socket.destroy();
          resolve(this.parseAtResponse(data));
        }
      });

      socket.on('error', (err) => {
        clearTimeout(timer);
        socket.destroy();
        reject(new Error(`AT command error: ${err.message}`));
      });
    });
  }

  private parseAtResponse(raw: string): string {
    const trimmed = raw.trim();
    // Handle +ok=value format
    const okMatch = trimmed.match(/\+ok=(.*)/i);
    if (okMatch) return okMatch[1].trim();
    // Handle +ok (no value)
    if (/^\+ok$/im.test(trimmed)) return 'OK';
    // Handle +ERR=message
    const errMatch = trimmed.match(/\+ERR=(.*)/i);
    if (errMatch) throw new Error(`AT error: ${errMatch[1].trim()}`);
    // Return raw if no pattern matched
    return trimmed;
  }

  // ── TCP Transparent Serial ──

  serialSend(data: string | Buffer, timeout: number = 3000): Promise<string> {
    return new Promise((resolve, reject) => {
      const socket = new Socket();
      let received = '';

      const timer = setTimeout(() => {
        socket.destroy();
        resolve(received || '(no response within timeout)');
      }, timeout);

      socket.connect(this.serialTcpPort, this.deviceHost, () => {
        if (typeof data === 'string') {
          // Support hex string: "01 03 00 00 00 01 84 0A"
          if (/^[0-9a-fA-F\s]+$/.test(data) && data.includes(' ')) {
            const hexBuf = Buffer.from(data.replace(/\s+/g, ''), 'hex');
            socket.write(hexBuf);
          } else {
            socket.write(data);
          }
        } else {
          socket.write(data);
        }
      });

      socket.on('data', (chunk) => {
        received += chunk.toString('hex').replace(/(.{2})/g, '$1 ').trim();
        // For most serial protocols, we get a complete response quickly
        // Reset timer on each chunk to allow for multi-packet responses
        clearTimeout(timer);
        const newTimer = setTimeout(() => {
          socket.destroy();
          resolve(received);
        }, 500); // 500ms silence = response complete
        // Store reference (not ideal but practical)
        (socket as unknown as Record<string, NodeJS.Timeout>).__timer = newTimer;
      });

      socket.on('error', (err) => {
        clearTimeout(timer);
        socket.destroy();
        reject(new Error(`Serial TCP error: ${err.message}`));
      });

      socket.on('close', () => {
        clearTimeout(timer);
        const extraTimer = (socket as unknown as Record<string, NodeJS.Timeout>).__timer;
        if (extraTimer) clearTimeout(extraTimer);
      });
    });
  }

  // ── Device Info Methods ──

  async getDeviceInfo(): Promise<Record<string, string>> {
    const info: Record<string, string> = {};
    try { info.firmware = await this.sendAtCommand('AT+VER'); } catch { info.firmware = 'N/A'; }
    try { info.mac = await this.sendAtCommand('AT+MAC'); } catch { info.mac = 'N/A'; }
    try {
      const mid = await this.sendAtCommand('AT+MID');
      info.moduleId = mid;
    } catch { /* optional */ }
    return info;
  }

  async getSerialConfig(port?: number): Promise<string> {
    const cmd = port !== undefined ? `AT+UART${port}` : 'AT+UART';
    return this.sendAtCommand(cmd);
  }

  async setSerialConfig(baud: number, dataBits?: number, stopBits?: number, parity?: string, port?: number): Promise<string> {
    const db = dataBits || 8;
    const sb = stopBits || 1;
    const pa = parity || 'NONE';
    const cmd = port !== undefined
      ? `AT+UART${port}=${baud},${db},${sb},${pa},NFC`
      : `AT+UART=${baud},${db},${sb},${pa},NFC`;
    return this.sendAtCommand(cmd);
  }

  async getNetworkConfig(): Promise<Record<string, string>> {
    const config: Record<string, string> = {};
    try { config.wan = await this.sendAtCommand('AT+WANN'); } catch { config.wan = 'N/A'; }
    try { config.tcpPort = await this.sendAtCommand('AT+NETP'); } catch { config.tcpPort = 'N/A'; }
    try { config.dns = await this.sendAtCommand('AT+DNS'); } catch { /* optional */ }
    return config;
  }

  async getWifiConfig(): Promise<Record<string, string>> {
    const config: Record<string, string> = {};
    try { config.ssid = await this.sendAtCommand('AT+WSSSID'); } catch { config.ssid = 'N/A'; }
    try { config.security = await this.sendAtCommand('AT+WSKEY'); } catch { config.security = 'N/A'; }
    try { config.mode = await this.sendAtCommand('AT+WMODE'); } catch { /* optional */ }
    return config;
  }

  async getTcpStatus(): Promise<string> {
    return this.sendAtCommand('AT+TCPLK');
  }

  async reboot(): Promise<string> {
    try {
      return await this.sendAtCommand('AT+Z', 2000);
    } catch {
      return 'Reboot command sent (device disconnected)';
    }
  }

  // ── Required overrides ──

  async getStatus(): Promise<DeviceStatus> {
    try {
      const info = await this.getDeviceInfo();
      return this.buildStatus({
        status: 'connected',
        firmware: info.firmware,
        details: {
          mac: info.mac,
          moduleId: info.moduleId,
          atPort: this.atPort,
          serialPort: this.serialTcpPort,
        },
      });
    } catch (error) {
      return this.buildStatus({
        status: 'error',
        details: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  async executeCommand(command: string): Promise<CommandResult> {
    const start = Date.now();
    try {
      const output = await this.sendAtCommand(command);
      return {
        success: true,
        device: this.config.id,
        command,
        output,
        executionTime: Date.now() - start,
      };
    } catch (error) {
      return {
        success: false,
        device: this.config.id,
        command,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - start,
      };
    }
  }

  async getConfig(): Promise<string> {
    const [info, serial, network] = await Promise.all([
      this.getDeviceInfo(),
      this.getSerialConfig().catch(() => 'N/A'),
      this.getNetworkConfig(),
    ]);
    return JSON.stringify({ device: info, serial, network }, null, 2);
  }
}
