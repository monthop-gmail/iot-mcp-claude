import { BaseConnector } from './base-connector.js';
import { CommandResult } from '../types.js';

// Dynamic import for serialport (may not be available in all environments)
let SerialPort: typeof import('serialport').SerialPort | null = null;
let ReadlineParser: typeof import('serialport').ReadlineParser | null = null;

async function loadSerialPort() {
  try {
    const mod = await import('serialport');
    SerialPort = mod.SerialPort;
    ReadlineParser = mod.ReadlineParser;
  } catch {
    console.warn('serialport module not available - serial features disabled');
  }
}

// Load on module init
loadSerialPort();

export abstract class SerialConnector extends BaseConnector {
  protected port: InstanceType<typeof import('serialport').SerialPort> | null = null;

  async connect(): Promise<void> {
    if (!SerialPort) throw new Error('serialport module not available');
    if (this.port?.isOpen) return;

    return new Promise((resolve, reject) => {
      this.port = new SerialPort!({
        path: this.config.serialPort!,
        baudRate: this.config.serialBaud || 9600,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
      });

      this.port.on('open', () => {
        this._status = 'connected';
        resolve();
      });

      this.port.on('error', (err) => {
        this._status = 'error';
        reject(err);
      });

      this.port.on('close', () => {
        this._status = 'disconnected';
      });
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.port?.isOpen) {
        this.port.close(() => {
          this._status = 'disconnected';
          this.port = null;
          resolve();
        });
      } else {
        this._status = 'disconnected';
        this.port = null;
        resolve();
      }
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      await this.disconnect();
      return true;
    } catch {
      return false;
    }
  }

  protected async serialSend(data: string, waitMs = 2000): Promise<string> {
    if (!this.port?.isOpen) await this.connect();
    if (!ReadlineParser) throw new Error('serialport module not available');

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        resolve(output);
      }, waitMs);

      let output = '';
      const parser = this.port!.pipe(new ReadlineParser!({ delimiter: '\r\n' }));

      parser.on('data', (line: string) => {
        output += line + '\n';
      });

      this.port!.write(data + '\r\n', (err) => {
        if (err) {
          clearTimeout(timer);
          reject(err);
        }
      });
    });
  }

  async executeCommand(command: string): Promise<CommandResult> {
    const start = Date.now();
    try {
      const output = await this.serialSend(command);
      return {
        success: true,
        device: this.deviceId,
        command,
        output: output.trim(),
        executionTime: Date.now() - start,
      };
    } catch (error) {
      return {
        success: false,
        device: this.deviceId,
        command,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - start,
      };
    }
  }

  static async listPorts(): Promise<Array<{ path: string; manufacturer?: string }>> {
    if (!SerialPort) {
      await loadSerialPort();
      if (!SerialPort) return [];
    }
    return SerialPort.list();
  }
}
