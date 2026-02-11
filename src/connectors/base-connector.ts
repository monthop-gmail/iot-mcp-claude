import { DeviceConfig, DeviceStatus, CommandResult, ConnectionStatus } from '../types.js';

export abstract class BaseConnector {
  protected config: DeviceConfig;
  protected _status: ConnectionStatus = 'disconnected';

  constructor(config: DeviceConfig) {
    this.config = config;
  }

  get deviceId(): string { return this.config.id; }
  get deviceName(): string { return this.config.name; }
  get deviceType(): string { return this.config.type; }
  get status(): ConnectionStatus { return this._status; }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract testConnection(): Promise<boolean>;
  abstract getStatus(): Promise<DeviceStatus>;

  async executeCommand(_command: string): Promise<CommandResult> {
    throw new Error(`executeCommand not supported for device type: ${this.config.type}`);
  }

  async getConfig(_section?: string): Promise<string> {
    throw new Error(`getConfig not supported for device type: ${this.config.type}`);
  }

  protected buildStatus(extra: Partial<DeviceStatus> = {}): DeviceStatus {
    return {
      id: this.config.id,
      name: this.config.name,
      type: this.config.type,
      status: this._status,
      lastSeen: new Date().toISOString(),
      ...extra,
    };
  }
}
