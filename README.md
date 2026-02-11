# IoT MCP Server

MCP (Model Context Protocol) Server สำหรับจัดการอุปกรณ์ IoT และ Network ผ่าน Claude AI

รองรับ **65 tools** สำหรับ **10 ประเภทอุปกรณ์** ผ่าน 3 protocols: SSH, REST API, Serial

## Supported Devices

| Device | Protocol | Tools |
|--------|----------|-------|
| **Cisco Switch** | SSH CLI | 8 tools - interfaces, VLANs, MAC table, ARP, CDP, spanning-tree |
| **HP Switch** | SSH CLI | 8 tools - interfaces, VLANs, MAC table, ARP, LLDP, spanning-tree |
| **Fortigate** | REST API + SSH | 8 tools - firewall policies, routes, VPN, DHCP, sessions |
| **Mikrotik** | REST API + SSH | 8 tools - interfaces, routes, firewall, DHCP, wireless, queues |
| **ThingsBoard** | REST API (JWT) | 6 tools - devices, telemetry, attributes, RPC, alarms, dashboards |
| **ESPHome** | REST API | 6 tools - devices, states, services, logs, compile |
| **ESPConnect** | REST API | 4 tools - devices, status, command, OTA |
| **Tuya** | Cloud API (HMAC) | 5 tools - devices, status, commands, scenes |
| **Sonoff/eWeLink** | Cloud API (v2) | 4 tools - devices, toggle, power usage |
| **QNAP NAS** | REST API (QTS) | 8 tools - system info, volumes, disks, shared folders, apps, logs |

Plus **7 cross-device tools**: list devices, status, test connection, execute command, get config, serial ports

## Architecture

```
src/
├── index.ts                    # stdio transport
├── server-sse.ts               # SSE HTTP transport
├── config.ts                   # env + devices.json loader
├── types.ts                    # shared interfaces
├── device-registry.ts          # singleton device registry
├── connectors/
│   ├── base-connector.ts       # abstract base class
│   ├── ssh-connector.ts        # SSH base (ssh2)
│   ├── rest-connector.ts       # REST base (native fetch)
│   ├── serial-connector.ts     # Serial base (serialport)
│   ├── cisco-connector.ts      # Cisco Switch
│   ├── hp-connector.ts         # HP Switch
│   ├── fortigate-connector.ts  # Fortigate (REST + SSH)
│   ├── mikrotik-connector.ts   # Mikrotik (REST + SSH)
│   ├── thingsboard-connector.ts
│   ├── esphome-connector.ts
│   ├── espconnect-connector.ts
│   ├── tuya-connector.ts       # Tuya Cloud (HMAC signing)
│   ├── sonoff-connector.ts     # eWeLink API v2
│   ├── qnap-connector.ts      # QNAP QTS API
│   └── index.ts                # connector factory
└── tools/
    ├── index.ts                # 56 tool definitions + dispatcher
    ├── device-tools.ts         # cross-device operations
    ├── network-switch-tools.ts # Cisco + HP
    ├── firewall-tools.ts       # Fortigate
    ├── mikrotik-tools.ts       # Mikrotik
    ├── thingsboard-tools.ts    # ThingsBoard
    ├── esphome-tools.ts        # ESPHome
    ├── espconnect-tools.ts     # ESPConnect
    ├── tuya-tools.ts           # Tuya
    ├── sonoff-tools.ts         # Sonoff
    └── qnap-tools.ts          # QNAP
```

### Connector Pattern

```
BaseConnector (abstract)
├── SSHConnector (ssh2 with legacy algo support)
│   ├── CiscoConnector
│   └── HPConnector
├── RESTConnector (native fetch)
│   ├── FortigateConnector (+SSH helper)
│   ├── MikrotikConnector (+SSH helper)
│   ├── ThingsBoardConnector (JWT auth)
│   ├── ESPHomeConnector
│   ├── ESPConnectConnector
│   ├── TuyaConnector (HMAC-SHA256 signing)
│   ├── SonoffConnector (eWeLink v2)
│   └── QnapConnector (QTS API)
└── SerialConnector (serialport)
```

## Quick Start

### 1. Configure devices

```bash
cp devices.json.example devices.json
cp .env.example .env
```

Edit `devices.json` with your device inventory. Passwords use `${ENV_VAR}` references resolved from `.env`:

```json
{
  "devices": [
    {
      "id": "cisco-sw-core",
      "name": "Cisco Core Switch",
      "type": "cisco",
      "transport": ["ssh"],
      "host": "192.168.1.1",
      "port": 22,
      "username": "admin",
      "password": "${CISCO_PASSWORD}",
      "tags": ["core", "network"]
    }
  ]
}
```

### 2. Docker (Recommended)

```bash
docker compose up -d
```

Server runs at `http://localhost:3300` (SSE endpoint: `/sse`, health: `/health`)

### 3. Standalone

```bash
npm install
npm run build
npm run start:sse   # SSE HTTP mode (port 3000)
npm start           # stdio mode (for Claude Desktop)
```

### 4. Connect to Claude Code

`.mcp.json` is pre-configured:

```json
{
  "mcpServers": {
    "iot": {
      "url": "http://localhost:3300/sse"
    }
  }
}
```

## MCP Tools Reference

### Device Management (`iot_*`)
| Tool | Description |
|------|-------------|
| `iot_list_devices` | List all devices (filter by type/tag/search) |
| `iot_device_status` | Get device status (connects to check) |
| `iot_test_connection` | Test connectivity |
| `iot_all_status` | Health dashboard - all devices |
| `iot_execute_command` | Execute CLI command on SSH device |
| `iot_get_config` | Retrieve running config |
| `iot_serial_list_ports` | List available serial ports |

### Network Switch (`switch_*`)
| Tool | Description |
|------|-------------|
| `switch_show_interfaces` | Interface status/brief |
| `switch_show_vlans` | VLAN configuration |
| `switch_show_mac_table` | MAC address table (filter by VLAN) |
| `switch_show_arp` | ARP table |
| `switch_show_neighbors` | CDP (Cisco) / LLDP (HP) |
| `switch_show_spanning_tree` | Spanning tree status |
| `switch_show_port_security` | Port security |
| `switch_show_logs` | Log buffer |

### Fortigate Firewall (`fortigate_*`)
| Tool | Description |
|------|-------------|
| `fortigate_get_policies` | Firewall policies |
| `fortigate_get_routes` | Routing table |
| `fortigate_get_interfaces` | Interface config |
| `fortigate_vpn_status` | IPSec VPN tunnels |
| `fortigate_system_status` | CPU/memory/resource usage |
| `fortigate_get_dhcp_leases` | DHCP leases |
| `fortigate_get_sessions` | Active sessions |
| `fortigate_execute_cli` | FortiOS CLI via SSH |

### Mikrotik Router (`mikrotik_*`)
| Tool | Description |
|------|-------------|
| `mikrotik_get_interfaces` | Interfaces with traffic stats |
| `mikrotik_get_routes` | IP routing table |
| `mikrotik_get_firewall` | Filter + NAT rules |
| `mikrotik_get_dhcp_leases` | DHCP leases |
| `mikrotik_get_wireless` | Wireless clients |
| `mikrotik_get_queues` | Bandwidth queues |
| `mikrotik_system_resources` | CPU/memory/uptime |
| `mikrotik_execute_command` | RouterOS command via SSH |

### ThingsBoard (`tb_*`)
| Tool | Description |
|------|-------------|
| `tb_list_devices` | List registered devices |
| `tb_device_telemetry` | Latest telemetry data |
| `tb_device_attributes` | Device attributes |
| `tb_send_rpc` | Send RPC command |
| `tb_get_alarms` | Active alarms |
| `tb_get_dashboards` | List dashboards |

### ESPHome (`esphome_*`)
| Tool | Description |
|------|-------------|
| `esphome_list_devices` | List managed devices |
| `esphome_device_info` | Device details |
| `esphome_get_states` | Entity states |
| `esphome_call_service` | Call service (turn on/off, etc.) |
| `esphome_get_logs` | Device logs |
| `esphome_compile` | Trigger OTA compile |

### ESPConnect (`espconnect_*`)
| Tool | Description |
|------|-------------|
| `espconnect_list_devices` | List devices |
| `espconnect_device_status` | Device status |
| `espconnect_send_command` | Send command |
| `espconnect_ota_update` | OTA firmware update |

### Tuya Cloud (`tuya_*`)
| Tool | Description |
|------|-------------|
| `tuya_list_devices` | List cloud devices |
| `tuya_device_status` | Device properties |
| `tuya_send_commands` | Control commands |
| `tuya_get_scenes` | Smart scenes |
| `tuya_trigger_scene` | Trigger scene |

### Sonoff/eWeLink (`sonoff_*`)
| Tool | Description |
|------|-------------|
| `sonoff_list_devices` | List devices |
| `sonoff_device_status` | Device status |
| `sonoff_toggle` | On/off control |
| `sonoff_get_power_usage` | Power monitoring |

### QNAP NAS (`qnap_*`)
| Tool | Description |
|------|-------------|
| `qnap_system_info` | System info (model, firmware, uptime) |
| `qnap_get_volumes` | Storage volumes/pools (RAID, capacity) |
| `qnap_get_disks` | Physical disks (SMART, health, temp) |
| `qnap_get_shared_folders` | Shared folders |
| `qnap_get_network` | Network interfaces |
| `qnap_get_apps` | Running applications/packages |
| `qnap_get_logs` | System logs |
| `qnap_resource_usage` | CPU/memory/disk usage |

## VPN Support

Container รองรับ 5 VPN protocols เพื่อเข้าถึงอุปกรณ์ที่อยู่หลัง VPN:

| VPN | Config Location | Auto-connect |
|-----|----------------|--------------|
| **OpenVPN** | `vpn/openvpn/*.ovpn` | ทุก .ovpn file |
| **WireGuard** | `vpn/wireguard/*.conf` | ทุก .conf file |
| **Tailscale** | `TS_AUTHKEY` in `.env` | เมื่อมี authkey |
| **Cloudflare Tunnel** | `CF_TUNNEL_TOKEN` in `.env` | เมื่อมี token |
| **ZeroTier** | `ZT_NETWORKS` in `.env` | เมื่อมี network IDs |

### Setup OpenVPN

วาง `.ovpn` config files ไว้ใน `vpn/openvpn/`:

```bash
cp your-vpn-config.ovpn vpn/openvpn/
```

### Setup WireGuard

วาง WireGuard config ไว้ใน `vpn/wireguard/`:

```bash
cp wg0.conf vpn/wireguard/
```

### Setup Tailscale

สร้าง auth key จาก https://login.tailscale.com/admin/settings/keys แล้วใส่ใน `.env`:

```
TS_AUTHKEY=tskey-auth-xxxxxxxxxxxxx
```

### Setup ZeroTier

สร้าง network ที่ [my.zerotier.com](https://my.zerotier.com/) แล้วใส่ network ID ใน `.env` (หลาย network คั่นด้วย comma):

```
ZT_NETWORKS=af78bf9436abcdef
```

อย่าลืม authorize member ใน ZeroTier Central หลัง container join แล้ว

### Setup Cloudflare Tunnel

สร้าง Tunnel จาก [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/) -> Networks -> Tunnels แล้วคัดลอก token ใส่ `.env`:

```
CF_TUNNEL_TOKEN=eyJhIjoixxxxxxx...
```

กำหนด Private Network routes ใน Cloudflare Dashboard เพื่อให้ tunnel route traffic ไปยัง subnet ของอุปกรณ์

### Device VPN Annotation

ระบุ VPN ที่อุปกรณ์ใช้ใน `devices.json` ด้วย field `vpn` (optional, ช่วยให้ Claude รู้ว่าอุปกรณ์อยู่หลัง VPN ไหน):

```json
{
  "id": "cisco-remote",
  "name": "Cisco Remote Switch",
  "type": "cisco",
  "host": "10.8.0.100",
  "vpn": "openvpn",
  "tags": ["remote"]
}
```

### Check VPN Status

ใช้ tool `vpn_status` เพื่อดูสถานะ VPN interfaces ทั้งหมด

## Configuration

### Device Types

| Type | Required Fields |
|------|----------------|
| `cisco`, `hp` | `host`, `username`, `password` |
| `fortigate` | `host`, `apiUrl`, `apiKey` (REST) + `username`, `password` (SSH) |
| `mikrotik` | `host`, `apiUrl`, `username`, `password` |
| `thingsboard` | `apiUrl`, `username`, `password` |
| `esphome` | `apiUrl`, optional `apiKey` |
| `espconnect` | `apiUrl`, optional `apiKey` |
| `tuya` | `apiUrl`, `extra.clientId`, `extra.clientSecret` |
| `sonoff` | `apiUrl`, `extra.appId`, `extra.appSecret`, `username`, `password` |
| `qnap` | `apiUrl`, `username`, `password` |

### Docker Serial Port

Uncomment in `docker-compose.yml` for serial device access:

```yaml
devices:
  - "/dev/ttyUSB0:/dev/ttyUSB0"
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SSE_HOST` | `0.0.0.0` | SSE server bind address |
| `SSE_PORT` | `3000` | SSE server port (internal) |
| `DEVICES_FILE` | `./devices.json` | Path to device inventory |
| `NODE_TLS_REJECT_UNAUTHORIZED` | - | Set to `0` for self-signed certs |
| `TS_AUTHKEY` | - | Tailscale auth key (auto-connect) |
| `CF_TUNNEL_TOKEN` | - | Cloudflare Tunnel token (auto-connect) |
| `ZT_NETWORKS` | - | ZeroTier network IDs (comma-separated) |

## Tech Stack

- **Runtime**: Node.js 22 (ES2022)
- **Language**: TypeScript (NodeNext modules)
- **MCP SDK**: @modelcontextprotocol/sdk ^1.0.0
- **SSH**: ssh2 (pure JS, legacy algorithm support)
- **Serial**: serialport (native bindings)
- **HTTP**: Native fetch (Node 22 built-in)
- **Docker**: node:22-slim multi-stage build
- **VPN**: OpenVPN, WireGuard, Tailscale, Cloudflare Tunnel, ZeroTier (built into container)
