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

# libudev needed by serialport for port enumeration
RUN apt-get update && apt-get install -y --no-install-recommends \
    libudev-dev wget \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm pkg delete scripts.prepare && npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server-sse.js"]
