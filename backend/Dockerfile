# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source and config
COPY tsconfig.json ./
COPY prisma ./prisma/
COPY src ./src/

# Generate Prisma client
RUN npx prisma generate

# Compile TypeScript → dist/
RUN npm run build

# ── Stage 2: Dev (hot-reload via ts-node-dev) ────────────────────────────────
FROM node:20-alpine AS dev

WORKDIR /app

# Install Chromium for Puppeteer (needed even in dev for PDF tests)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=development

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma ./prisma/
COPY src ./src/

RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "run", "dev"]

# ── Stage 3: Production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Install Chromium and fonts for Puppeteer PDF generation
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

WORKDIR /app

# Copy production node_modules + compiled output from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

# /data and /backups are mounted as Docker volumes — dirs created here for fallback
RUN mkdir -p /data /backups

EXPOSE 3001

# Run Prisma migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
