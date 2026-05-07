# ─── Stage 1: Build ───────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (cache layer)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# ─── Stage 2: Production ──────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copy deps from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port (Render/Docker จะ override ด้วย PORT env var)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-3000}/ || exit 1

CMD ["node", "server.js"]
