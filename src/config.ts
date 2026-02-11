import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { DeviceConfig } from './types.js';

dotenv.config();

export const config = {
  sse: {
    host: process.env.SSE_HOST || '0.0.0.0',
    port: parseInt(process.env.SSE_PORT || '3000', 10),
  },
  devicesFile: process.env.DEVICES_FILE || './devices.json',
};

function resolveEnvVars(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return obj.replace(/\$\{(\w+)\}/g, (_, key) => process.env[key] || '');
  }
  if (Array.isArray(obj)) return obj.map(resolveEnvVars);
  if (obj && typeof obj === 'object') {
    const resolved: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      resolved[k] = resolveEnvVars(v);
    }
    return resolved;
  }
  return obj;
}

export function loadDevices(): DeviceConfig[] {
  const filePath = config.devicesFile;
  if (!existsSync(filePath)) {
    console.warn(`Devices file not found: ${filePath}`);
    return [];
  }
  const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
  return resolveEnvVars(raw.devices) as DeviceConfig[];
}

export function validateConfig(): void {
  if (!existsSync(config.devicesFile)) {
    console.warn(`Devices file not found: ${config.devicesFile}. Server will start with no devices.`);
  }
}
