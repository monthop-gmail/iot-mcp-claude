#!/bin/bash
set -e

echo "=== IoT MCP Server - Starting ==="

# -------------------------------------------------------
# OpenVPN: connect all .ovpn files in /etc/openvpn/client/
# -------------------------------------------------------
if ls /etc/openvpn/client/*.ovpn 1>/dev/null 2>&1; then
  mkdir -p /dev/net
  [ ! -c /dev/net/tun ] && mknod /dev/net/tun c 10 200
  for ovpn in /etc/openvpn/client/*.ovpn; do
    name=$(basename "$ovpn" .ovpn)
    echo "[VPN] Starting OpenVPN: $name"
    openvpn --config "$ovpn" --daemon "ovpn-$name" --log "/tmp/openvpn-$name.log"
  done
  sleep 3
  echo "[VPN] OpenVPN interfaces:"
  ip addr show | grep -E "tun[0-9]" | head -5 || echo "  (waiting for tunnel...)"
fi

# -------------------------------------------------------
# WireGuard: bring up all .conf files in /etc/wireguard/
# -------------------------------------------------------
if ls /etc/wireguard/*.conf 1>/dev/null 2>&1; then
  for conf in /etc/wireguard/*.conf; do
    name=$(basename "$conf" .conf)
    echo "[VPN] Starting WireGuard: $name"
    wg-quick up "$name" 2>/dev/null || echo "  Warning: $name failed to start"
  done
  echo "[VPN] WireGuard interfaces:"
  wg show 2>/dev/null | head -10 || echo "  (no active interfaces)"
fi

# -------------------------------------------------------
# Tailscale: start if TS_AUTHKEY is set
# -------------------------------------------------------
if [ -n "$TS_AUTHKEY" ]; then
  echo "[VPN] Starting Tailscale daemon..."
  tailscaled --state=/var/lib/tailscale/tailscaled.state --socket=/var/run/tailscale/tailscaled.sock &
  sleep 2
  echo "[VPN] Connecting Tailscale..."
  tailscale up --authkey="$TS_AUTHKEY" --accept-routes ${TS_EXTRA_ARGS:-} 2>/dev/null || echo "  Warning: Tailscale connect failed"
  echo "[VPN] Tailscale status:"
  tailscale status 2>/dev/null | head -10 || echo "  (not connected)"
fi

# -------------------------------------------------------
# ZeroTier: join networks if ZT_NETWORKS is set
# -------------------------------------------------------
if [ -n "$ZT_NETWORKS" ]; then
  echo "[VPN] Starting ZeroTier daemon..."
  zerotier-one -d 2>/dev/null
  sleep 2
  for net in $(echo "$ZT_NETWORKS" | tr ',' ' '); do
    echo "[VPN] Joining ZeroTier network: $net"
    zerotier-cli join "$net" 2>/dev/null || echo "  Warning: failed to join $net"
  done
  echo "[VPN] ZeroTier status:"
  zerotier-cli info 2>/dev/null || echo "  (not running)"
fi

# -------------------------------------------------------
# Cloudflare Tunnel: start if CF_TUNNEL_TOKEN is set
# -------------------------------------------------------
if [ -n "$CF_TUNNEL_TOKEN" ]; then
  echo "[VPN] Starting Cloudflare Tunnel..."
  cloudflared tunnel --no-autoupdate run --token "$CF_TUNNEL_TOKEN" \
    > /tmp/cloudflared.log 2>&1 &
  sleep 3
  echo "[VPN] Cloudflare Tunnel status:"
  if pgrep -x cloudflared > /dev/null; then
    echo "  cloudflared running (PID $(pgrep -x cloudflared))"
  else
    echo "  Warning: cloudflared not running, check /tmp/cloudflared.log"
  fi
fi

echo "=== VPN setup complete ==="
echo ""

# -------------------------------------------------------
# Cleanup on exit
# -------------------------------------------------------
cleanup() {
  echo ""
  echo "=== Shutting down ==="
  # Stop WireGuard
  if ls /etc/wireguard/*.conf 1>/dev/null 2>&1; then
    for conf in /etc/wireguard/*.conf; do
      name=$(basename "$conf" .conf)
      wg-quick down "$name" 2>/dev/null || true
    done
  fi
  # Stop Tailscale
  if [ -n "$TS_AUTHKEY" ]; then
    tailscale down 2>/dev/null || true
    kill $(cat /var/run/tailscale/tailscaled.pid 2>/dev/null) 2>/dev/null || true
  fi
  # Stop ZeroTier
  killall zerotier-one 2>/dev/null || true
  # Stop Cloudflare Tunnel
  killall cloudflared 2>/dev/null || true
  # Stop OpenVPN
  killall openvpn 2>/dev/null || true
  exit 0
}
trap cleanup SIGTERM SIGINT

# -------------------------------------------------------
# Start MCP Server
# -------------------------------------------------------
echo "=== Starting MCP Server ==="
exec node dist/server-sse.js
