import { Tool } from '@modelcontextprotocol/sdk/types.js';
import * as deviceTools from './device-tools.js';
import * as switchTools from './network-switch-tools.js';
import * as firewallTools from './firewall-tools.js';
import * as mikrotikTools from './mikrotik-tools.js';
import * as tbTools from './thingsboard-tools.js';
import * as esphomeTools from './esphome-tools.js';
import * as espconnectTools from './espconnect-tools.js';
import * as tuyaTools from './tuya-tools.js';
import * as sonoffTools from './sonoff-tools.js';
import * as qnapTools from './qnap-tools.js';
import * as synologyTools from './synology-tools.js';
import * as proxmoxTools from './proxmox-tools.js';
import * as esxiTools from './esxi-tools.js';

export const TOOLS: Tool[] = [
  // ============================================================
  // Device Management Tools (cross-device)
  // ============================================================
  {
    name: 'iot_list_devices',
    description: 'List all devices in the inventory. Filter by type, tag, or search text.',
    inputSchema: {
      type: 'object',
      properties: {
        filter: { type: 'string', description: 'Search text to filter by name, id, type, or tag' },
        type: { type: 'string', description: 'Filter by device type: cisco, hp, fortigate, mikrotik, thingsboard, esphome, espconnect, tuya, sonoff' },
        tag: { type: 'string', description: 'Filter by tag (e.g. "network", "iot", "cloud")' },
      },
    },
  },
  {
    name: 'iot_device_status',
    description: 'Get detailed status of a specific device (connects to device to check)',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Device ID from inventory' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'iot_test_connection',
    description: 'Test connectivity to a device without retrieving full status',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Device ID to test' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'iot_all_status',
    description: 'Get status of all devices (health dashboard). Optionally filter by type or tag.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Filter by device type' },
        tag: { type: 'string', description: 'Filter by tag' },
      },
    },
  },
  {
    name: 'iot_execute_command',
    description: 'Execute a CLI command on any SSH-capable device (Cisco, HP, Fortigate, Mikrotik)',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Device ID' },
        command: { type: 'string', description: 'CLI command to execute' },
      },
      required: ['device_id', 'command'],
    },
  },
  {
    name: 'iot_get_config',
    description: 'Retrieve running configuration from a network device',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Device ID' },
        section: { type: 'string', description: 'Config section to retrieve (optional, returns full config if omitted)' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'iot_serial_list_ports',
    description: 'List available serial ports on the system',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'vpn_status',
    description: 'Check status of all VPN connections (OpenVPN, WireGuard, Tailscale, Cloudflare Tunnel, ZeroTier)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ============================================================
  // Network Switch Tools (Cisco + HP)
  // ============================================================
  {
    name: 'switch_show_interfaces',
    description: 'Show interface status/brief on a Cisco or HP switch',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Switch device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'switch_show_vlans',
    description: 'Show VLAN configuration on a switch',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Switch device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'switch_show_mac_table',
    description: 'Show MAC address table on a switch',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Switch device ID' },
        vlan: { type: 'number', description: 'Filter by VLAN ID (optional)' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'switch_show_arp',
    description: 'Show ARP table on a switch',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Switch device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'switch_show_neighbors',
    description: 'Show CDP (Cisco) or LLDP (HP) neighbor discovery on a switch',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Switch device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'switch_show_spanning_tree',
    description: 'Show spanning tree status on a switch',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Switch device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'switch_show_port_security',
    description: 'Show port security status on a switch',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Switch device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'switch_show_logs',
    description: 'Show log buffer on a switch',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Switch device ID' },
        lines: { type: 'number', description: 'Number of log lines to show (optional)' },
      },
      required: ['device_id'],
    },
  },

  // ============================================================
  // Fortigate Firewall Tools
  // ============================================================
  {
    name: 'fortigate_get_policies',
    description: 'Get firewall policies from Fortigate (via REST API)',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Fortigate device ID' },
        policy_id: { type: 'number', description: 'Specific policy ID (optional, lists all if omitted)' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'fortigate_get_routes',
    description: 'Get routing table from Fortigate',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Fortigate device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'fortigate_get_interfaces',
    description: 'Get interface configuration from Fortigate',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Fortigate device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'fortigate_vpn_status',
    description: 'Get IPSec VPN tunnel status from Fortigate',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Fortigate device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'fortigate_system_status',
    description: 'Get system resource usage from Fortigate (CPU, memory, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Fortigate device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'fortigate_get_dhcp_leases',
    description: 'Get DHCP leases from Fortigate',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Fortigate device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'fortigate_get_sessions',
    description: 'Get active sessions/connections from Fortigate',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Fortigate device ID' },
        filter: { type: 'string', description: 'Session filter expression (optional)' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'fortigate_execute_cli',
    description: 'Execute a FortiOS CLI command via SSH',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Fortigate device ID' },
        command: { type: 'string', description: 'FortiOS CLI command' },
      },
      required: ['device_id', 'command'],
    },
  },

  // ============================================================
  // Mikrotik Router Tools
  // ============================================================
  {
    name: 'mikrotik_get_interfaces',
    description: 'List interfaces with traffic stats from Mikrotik (via REST API)',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Mikrotik device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'mikrotik_get_routes',
    description: 'Get IP routing table from Mikrotik',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Mikrotik device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'mikrotik_get_firewall',
    description: 'Get firewall filter and NAT rules from Mikrotik',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Mikrotik device ID' },
        chain: { type: 'string', description: 'Filter by chain name: forward, input, output (optional)' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'mikrotik_get_dhcp_leases',
    description: 'Get DHCP server leases from Mikrotik',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Mikrotik device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'mikrotik_get_wireless',
    description: 'Get wireless client registration table from Mikrotik',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Mikrotik device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'mikrotik_get_queues',
    description: 'Get simple queue/bandwidth rules from Mikrotik',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Mikrotik device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'mikrotik_system_resources',
    description: 'Get system resource usage from Mikrotik (CPU, memory, uptime, version)',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Mikrotik device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'mikrotik_execute_command',
    description: 'Execute a RouterOS command via SSH',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Mikrotik device ID' },
        command: { type: 'string', description: 'RouterOS command (e.g. "/ip address print")' },
      },
      required: ['device_id', 'command'],
    },
  },

  // ============================================================
  // ThingsBoard IoT Platform Tools
  // ============================================================
  {
    name: 'tb_list_devices',
    description: 'List all devices registered in ThingsBoard',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ThingsBoard server device ID from inventory' },
        page: { type: 'number', description: 'Page number (default 0)' },
        limit: { type: 'number', description: 'Devices per page (default 20)' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'tb_device_telemetry',
    description: 'Get latest telemetry data for a ThingsBoard device',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ThingsBoard server device ID' },
        tb_device_id: { type: 'string', description: 'ThingsBoard device UUID' },
        keys: {
          type: 'array',
          items: { type: 'string' },
          description: 'Telemetry keys to retrieve (optional, returns all if omitted)',
        },
      },
      required: ['device_id', 'tb_device_id'],
    },
  },
  {
    name: 'tb_device_attributes',
    description: 'Get device attributes from ThingsBoard',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ThingsBoard server device ID' },
        tb_device_id: { type: 'string', description: 'ThingsBoard device UUID' },
      },
      required: ['device_id', 'tb_device_id'],
    },
  },
  {
    name: 'tb_send_rpc',
    description: 'Send RPC command to a ThingsBoard device',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ThingsBoard server device ID' },
        tb_device_id: { type: 'string', description: 'ThingsBoard device UUID' },
        method: { type: 'string', description: 'RPC method name' },
        params: { type: 'object', description: 'RPC parameters (optional)' },
      },
      required: ['device_id', 'tb_device_id', 'method'],
    },
  },
  {
    name: 'tb_get_alarms',
    description: 'Get active alarms from ThingsBoard',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ThingsBoard server device ID' },
        severity: { type: 'string', description: 'Filter by severity: CRITICAL, MAJOR, MINOR, WARNING, INDETERMINATE' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'tb_get_dashboards',
    description: 'List dashboards from ThingsBoard',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ThingsBoard server device ID' },
      },
      required: ['device_id'],
    },
  },

  // ============================================================
  // ESPHome Tools
  // ============================================================
  {
    name: 'esphome_list_devices',
    description: 'List all ESPHome devices managed by the dashboard',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ESPHome controller device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'esphome_device_info',
    description: 'Get detailed info about an ESPHome device',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ESPHome controller device ID' },
        esphome_device: { type: 'string', description: 'ESPHome device name' },
      },
      required: ['device_id', 'esphome_device'],
    },
  },
  {
    name: 'esphome_get_states',
    description: 'Get all entity states from an ESPHome device',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ESPHome controller device ID' },
        esphome_device: { type: 'string', description: 'ESPHome device name' },
      },
      required: ['device_id', 'esphome_device'],
    },
  },
  {
    name: 'esphome_call_service',
    description: 'Call a service on an ESPHome device (e.g. turn on light, switch relay)',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ESPHome controller device ID' },
        esphome_device: { type: 'string', description: 'ESPHome device name' },
        service: { type: 'string', description: 'Service name to call' },
        data: { type: 'object', description: 'Service data/parameters (optional)' },
      },
      required: ['device_id', 'esphome_device', 'service'],
    },
  },
  {
    name: 'esphome_get_logs',
    description: 'Get logs from an ESPHome device',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ESPHome controller device ID' },
        esphome_device: { type: 'string', description: 'ESPHome device name' },
      },
      required: ['device_id', 'esphome_device'],
    },
  },
  {
    name: 'esphome_compile',
    description: 'Trigger OTA compilation for an ESPHome device',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ESPHome controller device ID' },
        esphome_device: { type: 'string', description: 'ESPHome device name' },
      },
      required: ['device_id', 'esphome_device'],
    },
  },

  // ============================================================
  // ESPConnect Tools
  // ============================================================
  {
    name: 'espconnect_list_devices',
    description: 'List all ESPConnect devices',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ESPConnect hub device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'espconnect_device_status',
    description: 'Get status of an ESPConnect device',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ESPConnect hub device ID' },
        esp_device_id: { type: 'string', description: 'ESPConnect device identifier' },
      },
      required: ['device_id', 'esp_device_id'],
    },
  },
  {
    name: 'espconnect_send_command',
    description: 'Send a command to an ESPConnect device',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ESPConnect hub device ID' },
        esp_device_id: { type: 'string', description: 'ESPConnect device identifier' },
        command: { type: 'string', description: 'Command to send' },
      },
      required: ['device_id', 'esp_device_id', 'command'],
    },
  },
  {
    name: 'espconnect_ota_update',
    description: 'Trigger OTA firmware update on an ESPConnect device',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ESPConnect hub device ID' },
        esp_device_id: { type: 'string', description: 'ESPConnect device identifier' },
        firmware_url: { type: 'string', description: 'URL of firmware binary to flash' },
      },
      required: ['device_id', 'esp_device_id', 'firmware_url'],
    },
  },

  // ============================================================
  // Tuya Cloud Tools
  // ============================================================
  {
    name: 'tuya_list_devices',
    description: 'List all Tuya cloud devices',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Tuya cloud account device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'tuya_device_status',
    description: 'Get status/properties of a Tuya device',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Tuya cloud account device ID' },
        tuya_device_id: { type: 'string', description: 'Tuya device ID' },
      },
      required: ['device_id', 'tuya_device_id'],
    },
  },
  {
    name: 'tuya_send_commands',
    description: 'Send control commands to a Tuya device',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Tuya cloud account device ID' },
        tuya_device_id: { type: 'string', description: 'Tuya device ID' },
        commands: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string', description: 'Command code (e.g. "switch_led")' },
              value: { description: 'Command value (e.g. true, 255, "white")' },
            },
            required: ['code', 'value'],
          },
          description: 'Array of commands to send',
        },
      },
      required: ['device_id', 'tuya_device_id', 'commands'],
    },
  },
  {
    name: 'tuya_get_scenes',
    description: 'List smart scenes/automations from Tuya',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Tuya cloud account device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'tuya_trigger_scene',
    description: 'Trigger a Tuya smart scene',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Tuya cloud account device ID' },
        scene_id: { type: 'string', description: 'Scene ID to trigger' },
      },
      required: ['device_id', 'scene_id'],
    },
  },

  // ============================================================
  // Sonoff/eWeLink Cloud Tools
  // ============================================================
  {
    name: 'sonoff_list_devices',
    description: 'List all Sonoff/eWeLink devices',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Sonoff/eWeLink cloud account device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'sonoff_device_status',
    description: 'Get status of a Sonoff device',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Sonoff cloud account device ID' },
        sonoff_device_id: { type: 'string', description: 'Sonoff device ID' },
      },
      required: ['device_id', 'sonoff_device_id'],
    },
  },
  {
    name: 'sonoff_toggle',
    description: 'Toggle a Sonoff device on or off',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Sonoff cloud account device ID' },
        sonoff_device_id: { type: 'string', description: 'Sonoff device ID' },
        state: { type: 'string', enum: ['on', 'off'], description: 'Desired state: "on" or "off"' },
      },
      required: ['device_id', 'sonoff_device_id', 'state'],
    },
  },
  {
    name: 'sonoff_get_power_usage',
    description: 'Get power consumption data from a Sonoff power monitoring device',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Sonoff cloud account device ID' },
        sonoff_device_id: { type: 'string', description: 'Sonoff device ID' },
      },
      required: ['device_id', 'sonoff_device_id'],
    },
  },

  // ============================================================
  // QNAP NAS Tools
  // ============================================================
  {
    name: 'qnap_system_info',
    description: 'Get QNAP NAS system information (model, firmware, uptime)',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'QNAP NAS device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'qnap_get_volumes',
    description: 'Get storage volumes/pools info from QNAP NAS (RAID, capacity, usage)',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'QNAP NAS device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'qnap_get_disks',
    description: 'Get physical disk info from QNAP NAS (SMART, health, temperature)',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'QNAP NAS device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'qnap_get_shared_folders',
    description: 'List shared folders on QNAP NAS',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'QNAP NAS device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'qnap_get_network',
    description: 'Get network interface configuration from QNAP NAS',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'QNAP NAS device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'qnap_get_apps',
    description: 'List running applications/packages on QNAP NAS',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'QNAP NAS device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'qnap_get_logs',
    description: 'Get system logs from QNAP NAS',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'QNAP NAS device ID' },
        count: { type: 'number', description: 'Number of log entries (default 50)' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'qnap_resource_usage',
    description: 'Get CPU, memory, and disk usage from QNAP NAS',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'QNAP NAS device ID' },
      },
      required: ['device_id'],
    },
  },

  // ============================================================
  // Synology NAS Tools
  // ============================================================
  {
    name: 'synology_system_info',
    description: 'Get Synology NAS system information (model, DSM version, uptime)',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Synology NAS device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'synology_get_storage',
    description: 'Get storage volumes/pools info from Synology NAS (RAID, capacity, usage)',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Synology NAS device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'synology_get_disks',
    description: 'Get physical disk info from Synology NAS (SMART, health, temperature)',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Synology NAS device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'synology_get_shared_folders',
    description: 'List shared folders on Synology NAS',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Synology NAS device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'synology_get_network',
    description: 'Get network interface configuration from Synology NAS',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Synology NAS device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'synology_get_packages',
    description: 'List installed packages on Synology NAS',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Synology NAS device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'synology_system_utilization',
    description: 'Get CPU, memory, network, and disk utilization from Synology NAS',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Synology NAS device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'synology_get_logs',
    description: 'Get system logs from Synology NAS',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Synology NAS device ID' },
        count: { type: 'number', description: 'Number of log entries (default 50)' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'synology_get_docker',
    description: 'List Docker containers running on Synology NAS',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Synology NAS device ID' },
      },
      required: ['device_id'],
    },
  },

  // ============================================================
  // Proxmox VE Tools
  // ============================================================
  {
    name: 'proxmox_get_nodes',
    description: 'List all nodes in the Proxmox cluster',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Proxmox server device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'proxmox_node_status',
    description: 'Get detailed status of a Proxmox node (CPU, memory, uptime)',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Proxmox server device ID' },
        node: { type: 'string', description: 'Node name (e.g. "pve")' },
      },
      required: ['device_id', 'node'],
    },
  },
  {
    name: 'proxmox_list_vms',
    description: 'List QEMU virtual machines on a Proxmox node',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Proxmox server device ID' },
        node: { type: 'string', description: 'Node name' },
      },
      required: ['device_id', 'node'],
    },
  },
  {
    name: 'proxmox_vm_status',
    description: 'Get status of a specific VM on Proxmox',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Proxmox server device ID' },
        node: { type: 'string', description: 'Node name' },
        vmid: { type: 'number', description: 'VM ID (e.g. 100)' },
      },
      required: ['device_id', 'node', 'vmid'],
    },
  },
  {
    name: 'proxmox_list_containers',
    description: 'List LXC containers on a Proxmox node',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Proxmox server device ID' },
        node: { type: 'string', description: 'Node name' },
      },
      required: ['device_id', 'node'],
    },
  },
  {
    name: 'proxmox_container_status',
    description: 'Get status of a specific LXC container on Proxmox',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Proxmox server device ID' },
        node: { type: 'string', description: 'Node name' },
        vmid: { type: 'number', description: 'Container ID (e.g. 200)' },
      },
      required: ['device_id', 'node', 'vmid'],
    },
  },
  {
    name: 'proxmox_get_storage',
    description: 'List storage pools on a Proxmox node',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Proxmox server device ID' },
        node: { type: 'string', description: 'Node name' },
      },
      required: ['device_id', 'node'],
    },
  },
  {
    name: 'proxmox_get_network',
    description: 'Get network configuration of a Proxmox node',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Proxmox server device ID' },
        node: { type: 'string', description: 'Node name' },
      },
      required: ['device_id', 'node'],
    },
  },
  {
    name: 'proxmox_cluster_resources',
    description: 'Get cluster-wide resource overview from Proxmox (all VMs, containers, storage, nodes)',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Proxmox server device ID' },
        type: { type: 'string', description: 'Filter by type: vm, storage, node (optional, returns all if omitted)' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'proxmox_get_tasks',
    description: 'Get recent tasks/operations from a Proxmox node',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'Proxmox server device ID' },
        node: { type: 'string', description: 'Node name' },
        limit: { type: 'number', description: 'Number of tasks (default 50)' },
      },
      required: ['device_id', 'node'],
    },
  },

  // ============================================================
  // ESXi / vSphere Tools
  // ============================================================
  {
    name: 'esxi_list_vms',
    description: 'List all VMs on an ESXi host with power state',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ESXi host device ID' },
        filter: { type: 'string', description: 'Filter by VM name or power state (optional)' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'esxi_get_vm',
    description: 'Get detailed information about a specific VM on ESXi',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ESXi host device ID' },
        vm_id: { type: 'string', description: 'VM identifier (e.g. vm-1)' },
        vm_name: { type: 'string', description: 'VM name (alternative to vm_id)' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'esxi_power_on',
    description: 'Power on a VM on ESXi',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ESXi host device ID' },
        vm_id: { type: 'string', description: 'VM identifier' },
      },
      required: ['device_id', 'vm_id'],
    },
  },
  {
    name: 'esxi_power_off',
    description: 'Power off a VM on ESXi. Tries graceful shutdown first, falls back to force',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ESXi host device ID' },
        vm_id: { type: 'string', description: 'VM identifier' },
        force: { type: 'boolean', description: 'Force power off without graceful shutdown (default: false)' },
      },
      required: ['device_id', 'vm_id'],
    },
  },
  {
    name: 'esxi_restart_vm',
    description: 'Restart a VM on ESXi',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ESXi host device ID' },
        vm_id: { type: 'string', description: 'VM identifier' },
        graceful: { type: 'boolean', description: 'Use graceful reboot via VMware Tools (default: false)' },
      },
      required: ['device_id', 'vm_id'],
    },
  },
  {
    name: 'esxi_suspend_vm',
    description: 'Suspend a VM on ESXi',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ESXi host device ID' },
        vm_id: { type: 'string', description: 'VM identifier' },
      },
      required: ['device_id', 'vm_id'],
    },
  },
  {
    name: 'esxi_host_info',
    description: 'Get ESXi host information (CPU, memory, version)',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ESXi host device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'esxi_list_datastores',
    description: 'List all datastores on ESXi with capacity and usage',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ESXi host device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'esxi_list_networks',
    description: 'List all networks and port groups on ESXi',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ESXi host device ID' },
      },
      required: ['device_id'],
    },
  },
  {
    name: 'esxi_list_snapshots',
    description: 'List all snapshots of a VM on ESXi',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ESXi host device ID' },
        vm_id: { type: 'string', description: 'VM identifier' },
      },
      required: ['device_id', 'vm_id'],
    },
  },
  {
    name: 'esxi_create_snapshot',
    description: 'Create a snapshot of a VM on ESXi',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ESXi host device ID' },
        vm_id: { type: 'string', description: 'VM identifier' },
        name: { type: 'string', description: 'Snapshot name' },
        description: { type: 'string', description: 'Snapshot description (optional)' },
        memory: { type: 'boolean', description: 'Include memory state (default: false)' },
      },
      required: ['device_id', 'vm_id', 'name'],
    },
  },
  {
    name: 'esxi_delete_snapshot',
    description: 'Delete a snapshot from a VM on ESXi',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ESXi host device ID' },
        vm_id: { type: 'string', description: 'VM identifier' },
        snapshot_id: { type: 'string', description: 'Snapshot identifier' },
      },
      required: ['device_id', 'vm_id', 'snapshot_id'],
    },
  },
  {
    name: 'esxi_revert_snapshot',
    description: 'Revert a VM to a specific snapshot on ESXi',
    inputSchema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', description: 'ESXi host device ID' },
        vm_id: { type: 'string', description: 'VM identifier' },
        snapshot_id: { type: 'string', description: 'Snapshot identifier to revert to' },
      },
      required: ['device_id', 'vm_id', 'snapshot_id'],
    },
  },
];

export type ToolArguments = Record<string, unknown>;

export async function handleToolCall(
  name: string,
  args: ToolArguments
): Promise<unknown> {
  switch (name) {
    // Device Management
    case 'iot_list_devices':
      return deviceTools.listDevices(args as Parameters<typeof deviceTools.listDevices>[0]);
    case 'iot_device_status':
      return deviceTools.deviceStatus(args as Parameters<typeof deviceTools.deviceStatus>[0]);
    case 'iot_test_connection':
      return deviceTools.testConnection(args as Parameters<typeof deviceTools.testConnection>[0]);
    case 'iot_all_status':
      return deviceTools.allStatus(args as Parameters<typeof deviceTools.allStatus>[0]);
    case 'iot_execute_command':
      return deviceTools.executeCommand(args as Parameters<typeof deviceTools.executeCommand>[0]);
    case 'iot_get_config':
      return deviceTools.getConfig(args as Parameters<typeof deviceTools.getConfig>[0]);
    case 'iot_serial_list_ports':
      return deviceTools.listSerialPorts();
    case 'vpn_status':
      return deviceTools.vpnStatus();

    // Network Switch
    case 'switch_show_interfaces':
      return switchTools.showInterfaces(args as Parameters<typeof switchTools.showInterfaces>[0]);
    case 'switch_show_vlans':
      return switchTools.showVlans(args as Parameters<typeof switchTools.showVlans>[0]);
    case 'switch_show_mac_table':
      return switchTools.showMacTable(args as Parameters<typeof switchTools.showMacTable>[0]);
    case 'switch_show_arp':
      return switchTools.showArp(args as Parameters<typeof switchTools.showArp>[0]);
    case 'switch_show_neighbors':
      return switchTools.showNeighbors(args as Parameters<typeof switchTools.showNeighbors>[0]);
    case 'switch_show_spanning_tree':
      return switchTools.showSpanningTree(args as Parameters<typeof switchTools.showSpanningTree>[0]);
    case 'switch_show_port_security':
      return switchTools.showPortSecurity(args as Parameters<typeof switchTools.showPortSecurity>[0]);
    case 'switch_show_logs':
      return switchTools.showLogs(args as Parameters<typeof switchTools.showLogs>[0]);

    // Fortigate
    case 'fortigate_get_policies':
      return firewallTools.getPolicies(args as Parameters<typeof firewallTools.getPolicies>[0]);
    case 'fortigate_get_routes':
      return firewallTools.getRoutes(args as Parameters<typeof firewallTools.getRoutes>[0]);
    case 'fortigate_get_interfaces':
      return firewallTools.getInterfaces(args as Parameters<typeof firewallTools.getInterfaces>[0]);
    case 'fortigate_vpn_status':
      return firewallTools.getVpnStatus(args as Parameters<typeof firewallTools.getVpnStatus>[0]);
    case 'fortigate_system_status':
      return firewallTools.getSystemStatus(args as Parameters<typeof firewallTools.getSystemStatus>[0]);
    case 'fortigate_get_dhcp_leases':
      return firewallTools.getDhcpLeases(args as Parameters<typeof firewallTools.getDhcpLeases>[0]);
    case 'fortigate_get_sessions':
      return firewallTools.getSessions(args as Parameters<typeof firewallTools.getSessions>[0]);
    case 'fortigate_execute_cli':
      return firewallTools.executeCli(args as Parameters<typeof firewallTools.executeCli>[0]);

    // Mikrotik
    case 'mikrotik_get_interfaces':
      return mikrotikTools.getInterfaces(args as Parameters<typeof mikrotikTools.getInterfaces>[0]);
    case 'mikrotik_get_routes':
      return mikrotikTools.getRoutes(args as Parameters<typeof mikrotikTools.getRoutes>[0]);
    case 'mikrotik_get_firewall':
      return mikrotikTools.getFirewall(args as Parameters<typeof mikrotikTools.getFirewall>[0]);
    case 'mikrotik_get_dhcp_leases':
      return mikrotikTools.getDhcpLeases(args as Parameters<typeof mikrotikTools.getDhcpLeases>[0]);
    case 'mikrotik_get_wireless':
      return mikrotikTools.getWireless(args as Parameters<typeof mikrotikTools.getWireless>[0]);
    case 'mikrotik_get_queues':
      return mikrotikTools.getQueues(args as Parameters<typeof mikrotikTools.getQueues>[0]);
    case 'mikrotik_system_resources':
      return mikrotikTools.getSystemResources(args as Parameters<typeof mikrotikTools.getSystemResources>[0]);
    case 'mikrotik_execute_command':
      return mikrotikTools.executeCommand(args as Parameters<typeof mikrotikTools.executeCommand>[0]);

    // ThingsBoard
    case 'tb_list_devices':
      return tbTools.listDevices(args as Parameters<typeof tbTools.listDevices>[0]);
    case 'tb_device_telemetry':
      return tbTools.getDeviceTelemetry(args as Parameters<typeof tbTools.getDeviceTelemetry>[0]);
    case 'tb_device_attributes':
      return tbTools.getDeviceAttributes(args as Parameters<typeof tbTools.getDeviceAttributes>[0]);
    case 'tb_send_rpc':
      return tbTools.sendRpc(args as Parameters<typeof tbTools.sendRpc>[0]);
    case 'tb_get_alarms':
      return tbTools.getAlarms(args as Parameters<typeof tbTools.getAlarms>[0]);
    case 'tb_get_dashboards':
      return tbTools.getDashboards(args as Parameters<typeof tbTools.getDashboards>[0]);

    // ESPHome
    case 'esphome_list_devices':
      return esphomeTools.listDevices(args as Parameters<typeof esphomeTools.listDevices>[0]);
    case 'esphome_device_info':
      return esphomeTools.getDeviceInfo(args as Parameters<typeof esphomeTools.getDeviceInfo>[0]);
    case 'esphome_get_states':
      return esphomeTools.getStates(args as Parameters<typeof esphomeTools.getStates>[0]);
    case 'esphome_call_service':
      return esphomeTools.callService(args as Parameters<typeof esphomeTools.callService>[0]);
    case 'esphome_get_logs':
      return esphomeTools.getLogs(args as Parameters<typeof esphomeTools.getLogs>[0]);
    case 'esphome_compile':
      return esphomeTools.compile(args as Parameters<typeof esphomeTools.compile>[0]);

    // ESPConnect
    case 'espconnect_list_devices':
      return espconnectTools.listDevices(args as Parameters<typeof espconnectTools.listDevices>[0]);
    case 'espconnect_device_status':
      return espconnectTools.getDeviceStatus(args as Parameters<typeof espconnectTools.getDeviceStatus>[0]);
    case 'espconnect_send_command':
      return espconnectTools.sendCommand(args as Parameters<typeof espconnectTools.sendCommand>[0]);
    case 'espconnect_ota_update':
      return espconnectTools.otaUpdate(args as Parameters<typeof espconnectTools.otaUpdate>[0]);

    // Tuya
    case 'tuya_list_devices':
      return tuyaTools.listDevices(args as Parameters<typeof tuyaTools.listDevices>[0]);
    case 'tuya_device_status':
      return tuyaTools.getDeviceStatus(args as Parameters<typeof tuyaTools.getDeviceStatus>[0]);
    case 'tuya_send_commands':
      return tuyaTools.sendCommands(args as Parameters<typeof tuyaTools.sendCommands>[0]);
    case 'tuya_get_scenes':
      return tuyaTools.getScenes(args as Parameters<typeof tuyaTools.getScenes>[0]);
    case 'tuya_trigger_scene':
      return tuyaTools.triggerScene(args as Parameters<typeof tuyaTools.triggerScene>[0]);

    // Sonoff
    case 'sonoff_list_devices':
      return sonoffTools.listDevices(args as Parameters<typeof sonoffTools.listDevices>[0]);
    case 'sonoff_device_status':
      return sonoffTools.getDeviceStatus(args as Parameters<typeof sonoffTools.getDeviceStatus>[0]);
    case 'sonoff_toggle':
      return sonoffTools.toggleDevice(args as Parameters<typeof sonoffTools.toggleDevice>[0]);
    case 'sonoff_get_power_usage':
      return sonoffTools.getPowerUsage(args as Parameters<typeof sonoffTools.getPowerUsage>[0]);

    // QNAP
    case 'qnap_system_info':
      return qnapTools.getSystemInfo(args as Parameters<typeof qnapTools.getSystemInfo>[0]);
    case 'qnap_get_volumes':
      return qnapTools.getVolumes(args as Parameters<typeof qnapTools.getVolumes>[0]);
    case 'qnap_get_disks':
      return qnapTools.getDisks(args as Parameters<typeof qnapTools.getDisks>[0]);
    case 'qnap_get_shared_folders':
      return qnapTools.getSharedFolders(args as Parameters<typeof qnapTools.getSharedFolders>[0]);
    case 'qnap_get_network':
      return qnapTools.getNetworkInterfaces(args as Parameters<typeof qnapTools.getNetworkInterfaces>[0]);
    case 'qnap_get_apps':
      return qnapTools.getRunningApps(args as Parameters<typeof qnapTools.getRunningApps>[0]);
    case 'qnap_get_logs':
      return qnapTools.getSystemLogs(args as Parameters<typeof qnapTools.getSystemLogs>[0]);
    case 'qnap_resource_usage':
      return qnapTools.getResourceUsage(args as Parameters<typeof qnapTools.getResourceUsage>[0]);

    // Synology
    case 'synology_system_info':
      return synologyTools.getSystemInfo(args as Parameters<typeof synologyTools.getSystemInfo>[0]);
    case 'synology_get_storage':
      return synologyTools.getStorageInfo(args as Parameters<typeof synologyTools.getStorageInfo>[0]);
    case 'synology_get_disks':
      return synologyTools.getDisks(args as Parameters<typeof synologyTools.getDisks>[0]);
    case 'synology_get_shared_folders':
      return synologyTools.getSharedFolders(args as Parameters<typeof synologyTools.getSharedFolders>[0]);
    case 'synology_get_network':
      return synologyTools.getNetworkInterfaces(args as Parameters<typeof synologyTools.getNetworkInterfaces>[0]);
    case 'synology_get_packages':
      return synologyTools.getInstalledPackages(args as Parameters<typeof synologyTools.getInstalledPackages>[0]);
    case 'synology_system_utilization':
      return synologyTools.getSystemUtilization(args as Parameters<typeof synologyTools.getSystemUtilization>[0]);
    case 'synology_get_logs':
      return synologyTools.getSystemLogs(args as Parameters<typeof synologyTools.getSystemLogs>[0]);
    case 'synology_get_docker':
      return synologyTools.getDockerContainers(args as Parameters<typeof synologyTools.getDockerContainers>[0]);

    // Proxmox
    case 'proxmox_get_nodes':
      return proxmoxTools.getNodes(args as Parameters<typeof proxmoxTools.getNodes>[0]);
    case 'proxmox_node_status':
      return proxmoxTools.getNodeStatus(args as Parameters<typeof proxmoxTools.getNodeStatus>[0]);
    case 'proxmox_list_vms':
      return proxmoxTools.listVMs(args as Parameters<typeof proxmoxTools.listVMs>[0]);
    case 'proxmox_vm_status':
      return proxmoxTools.getVMStatus(args as Parameters<typeof proxmoxTools.getVMStatus>[0]);
    case 'proxmox_list_containers':
      return proxmoxTools.listContainers(args as Parameters<typeof proxmoxTools.listContainers>[0]);
    case 'proxmox_container_status':
      return proxmoxTools.getContainerStatus(args as Parameters<typeof proxmoxTools.getContainerStatus>[0]);
    case 'proxmox_get_storage':
      return proxmoxTools.getStorage(args as Parameters<typeof proxmoxTools.getStorage>[0]);
    case 'proxmox_get_network':
      return proxmoxTools.getNetwork(args as Parameters<typeof proxmoxTools.getNetwork>[0]);
    case 'proxmox_cluster_resources':
      return proxmoxTools.getClusterResources(args as Parameters<typeof proxmoxTools.getClusterResources>[0]);
    case 'proxmox_get_tasks':
      return proxmoxTools.getTasks(args as Parameters<typeof proxmoxTools.getTasks>[0]);

    // ESXi
    case 'esxi_list_vms':
      return esxiTools.listVMs(args as Parameters<typeof esxiTools.listVMs>[0]);
    case 'esxi_get_vm':
      return esxiTools.getVM(args as Parameters<typeof esxiTools.getVM>[0]);
    case 'esxi_power_on':
      return esxiTools.powerOn(args as Parameters<typeof esxiTools.powerOn>[0]);
    case 'esxi_power_off':
      return esxiTools.powerOff(args as Parameters<typeof esxiTools.powerOff>[0]);
    case 'esxi_restart_vm':
      return esxiTools.restartVM(args as Parameters<typeof esxiTools.restartVM>[0]);
    case 'esxi_suspend_vm':
      return esxiTools.suspendVM(args as Parameters<typeof esxiTools.suspendVM>[0]);
    case 'esxi_host_info':
      return esxiTools.getHostInfo(args as Parameters<typeof esxiTools.getHostInfo>[0]);
    case 'esxi_list_datastores':
      return esxiTools.listDatastores(args as Parameters<typeof esxiTools.listDatastores>[0]);
    case 'esxi_list_networks':
      return esxiTools.listNetworks(args as Parameters<typeof esxiTools.listNetworks>[0]);
    case 'esxi_list_snapshots':
      return esxiTools.listSnapshots(args as Parameters<typeof esxiTools.listSnapshots>[0]);
    case 'esxi_create_snapshot':
      return esxiTools.createSnapshot(args as Parameters<typeof esxiTools.createSnapshot>[0]);
    case 'esxi_delete_snapshot':
      return esxiTools.deleteSnapshot(args as Parameters<typeof esxiTools.deleteSnapshot>[0]);
    case 'esxi_revert_snapshot':
      return esxiTools.revertSnapshot(args as Parameters<typeof esxiTools.revertSnapshot>[0]);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
