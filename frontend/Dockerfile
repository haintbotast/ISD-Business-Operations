# ── Stage 1: Dev (Vite dev server with hot-reload) ───────────────────────────
FROM node:20-alpine AS dev

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# ── Stage 3: Production runner (nginx serving static SPA) ─────────────────────
FROM nginx:1.27-alpine AS runner

# Copy custom nginx config for SPA routing (client-side React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built SPA from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
