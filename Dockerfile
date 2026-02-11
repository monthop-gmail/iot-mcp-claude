# Build stage
FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY src/ ./src/

RUN npm ci

# Production stage
FROM node:22-slim

WORKDIR /app

# Install system dependencies:
# - libudev-dev: serialport native module
# - wget: health check
# - openvpn: OpenVPN client
# - wireguard-tools: WireGuard client (wg, wg-quick)
# - iproute2: ip command (routing)
# - iptables: firewall rules for VPN
# - curl, gnupg: for Tailscale install
# - procps: process management
RUN apt-get update && apt-get install -y --no-install-recommends \
    libudev-dev wget ca-certificates \
    openvpn \
    wireguard-tools \
    iproute2 iptables \
    curl gnupg procps \
    && rm -rf /var/lib/apt/lists/*

# Install Tailscale
RUN curl -fsSL https://pkgs.tailscale.com/stable/debian/bookworm.noarmor.gpg \
      -o /usr/share/keyrings/tailscale-archive-keyring.gpg \
    && curl -fsSL https://pkgs.tailscale.com/stable/debian/bookworm.tailscale-keyring.list \
      -o /etc/apt/sources.list.d/tailscale.list \
    && apt-get update && apt-get install -y --no-install-recommends tailscale \
    && rm -rf /var/lib/apt/lists/*

# Create directories for VPN state
RUN mkdir -p /var/lib/tailscale /var/run/tailscale /etc/openvpn/client /etc/wireguard

COPY package*.json ./

RUN npm pkg delete scripts.prepare && npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
