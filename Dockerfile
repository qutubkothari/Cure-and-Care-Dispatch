# Multi-stage build for React + Vite app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
WORKDIR /app/client
RUN npm ci

WORKDIR /app/server
RUN npm ci

# Copy source code
WORKDIR /app
COPY client/ ./client/
COPY server/ ./server/

# Build frontend
WORKDIR /app/client
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy server dependencies and code
COPY server/package*.json ./
RUN npm ci --only=production

COPY server/ ./
COPY --from=builder /app/client/dist ./public

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Start server
CMD ["node", "src/index.js"]
