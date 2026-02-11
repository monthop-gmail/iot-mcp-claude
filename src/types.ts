export type TransportType = 'ssh' | 'rest' | 'serial';

export type DeviceType =
  | 'cisco'
  | 'hp'
  | 'fortigate'
  | 'mikrotik'
  | 'thingsboard'
  | 'esphome'
  | 'espconnect'
  | 'tuya'
  | 'sonoff'
  | 'qnap'
  | 'synology'
  | 'proxmox'
  | 'esxi'
  | 'dahua-nvr'
  | 'dahua-dss';

export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'unknown';

export interface DeviceConfig {
  id: string;
  name: string;
  type: DeviceType;
  transport: TransportType[];
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  apiKey?: string;
  apiUrl?: string;
  serialPort?: string;
  serialBaud?: number;
  enablePassword?: string;
  vpn?: string;
  tags?: string[];
  extra?: Record<string, unknown>;
}

export interface DeviceStatus {
  id: string;
  name: string;
  type: DeviceType;
  status: ConnectionStatus;
  uptime?: string;
  firmware?: string;
  model?: string;
  serialNumber?: string;
  lastSeen?: string;
  details?: Record<string, unknown>;
}

export interface CommandResult {
  success: boolean;
  device: string;
  command: string;
  output: string;
  error?: string;
  executionTime?: number;
}
