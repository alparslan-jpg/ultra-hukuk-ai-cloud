# ============================================
# ULTRA HUKUK AI — Cloud Run Production Dockerfile
# Multi-stage build: Build frontend → Run server
# ============================================

# Stage 1: Build frontend (React + Vite)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies for build)
# Remove electron and electron-builder as they're not needed in cloud
RUN npm install --ignore-scripts --no-optional 2>/dev/null || \
    npm install --legacy-peer-deps --ignore-scripts --no-optional

# Copy source code
COPY . .

# Build the Vite frontend
RUN npx vite build

# Stage 2: Production runtime
FROM node:20-alpine AS production

WORKDIR /app

# Install only production dependencies + tsx for TypeScript runtime
COPY package.json package-lock.json ./

# Create a cloud-optimized package.json without electron
RUN node -e " \
  const pkg = JSON.parse(require('fs').readFileSync('package.json','utf8')); \
  delete pkg.dependencies.electron; \
  delete pkg.devDependencies['electron-builder']; \
  require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

RUN npm install --omit=dev --ignore-scripts --no-optional 2>/dev/null || \
    npm install --omit=dev --legacy-peer-deps --ignore-scripts --no-optional

# Install tsx globally for TypeScript execution
RUN npm install -g tsx

# Copy server source code (TypeScript files needed at runtime)
COPY server.ts ./
COPY src/services/ ./src/services/

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy public assets
COPY public/ ./public/
COPY UltraHukuk.ico ./

# Create data directory for persistent storage
RUN mkdir -p /app/data

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Cloud Run uses port 8080 by default
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Start server with tsx
CMD ["tsx", "server.ts"]
