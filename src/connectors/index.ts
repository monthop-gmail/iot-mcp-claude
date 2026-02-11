import { DeviceConfig, DeviceType } from '../types.js';
import { BaseConnector } from './base-connector.js';
import { CiscoConnector } from './cisco-connector.js';
import { HPConnector } from './hp-connector.js';
import { FortigateConnector } from './fortigate-connector.js';
import { MikrotikConnector } from './mikrotik-connector.js';
import { ThingsBoardConnector } from './thingsboard-connector.js';
import { ESPHomeConnector } from './esphome-connector.js';
import { ESPConnectConnector } from './espconnect-connector.js';
import { TuyaConnector } from './tuya-connector.js';
import { SonoffConnector } from './sonoff-connector.js';
import { QnapConnector } from './qnap-connector.js';

const factories: Record<DeviceType, (c: DeviceConfig) => BaseConnector> = {
  cisco:       (c) => new CiscoConnector(c),
  hp:          (c) => new HPConnector(c),
  fortigate:   (c) => new FortigateConnector(c),
  mikrotik:    (c) => new MikrotikConnector(c),
  thingsboard: (c) => new ThingsBoardConnector(c),
  esphome:     (c) => new ESPHomeConnector(c),
  espconnect:  (c) => new ESPConnectConnector(c),
  tuya:        (c) => new TuyaConnector(c),
  sonoff:      (c) => new SonoffConnector(c),
  qnap:        (c) => new QnapConnector(c),
};

export function createConnector(config: DeviceConfig): BaseConnector {
  const factory = factories[config.type];
  if (!factory) throw new Error(`Unknown device type: ${config.type}`);
  return factory(config);
}

export { BaseConnector } from './base-connector.js';
export { SSHConnector } from './ssh-connector.js';
export { RESTConnector } from './rest-connector.js';
export { SerialConnector } from './serial-connector.js';
export { CiscoConnector } from './cisco-connector.js';
export { HPConnector } from './hp-connector.js';
export { FortigateConnector } from './fortigate-connector.js';
export { MikrotikConnector } from './mikrotik-connector.js';
export { ThingsBoardConnector } from './thingsboard-connector.js';
export { ESPHomeConnector } from './esphome-connector.js';
export { ESPConnectConnector } from './espconnect-connector.js';
export { TuyaConnector } from './tuya-connector.js';
export { SonoffConnector } from './sonoff-connector.js';
export { QnapConnector } from './qnap-connector.js';
