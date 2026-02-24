# IMPLEMENTATION PLAN
# ISD Operations Management System (ISD-OMS)

---

| **Phiên bản** | **Ngày** | **Tác giả** | **Ghi chú** |
|---------------|----------|-------------|-------------|
| v1.0 | 23/02/2026 | ISD Team | Initial release |

---

## MỤC LỤC

1. [Project Structure](#1-project-structure)
2. [Sprint Plan](#2-sprint-plan)
3. [Docker Setup](#3-docker-setup)
4. [Seed Data Script](#4-seed-data-script)
5. [Development Guidelines](#5-development-guidelines)
6. [Testing Strategy](#6-testing-strategy)
7. [Deployment Checklist](#7-deployment-checklist)

---

## 1. PROJECT STRUCTURE

### 1.1 Target Directory Tree (Planned)

> Lưu ý: Cây thư mục dưới đây là **mục tiêu implementation**, không phải trạng thái hiện tại của repository tài liệu.

```
isd-oms/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── docker/
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── default.conf
│   └── Dockerfile.backend
│   └── Dockerfile.frontend
├── data/                          # SQLite database files (gitignored)
│   └── isd_oms.db                 # Single DB: events, audit_log, users, categories
│   # Kế hoạch v2.0: tách thành master.db + events_YYYY.db theo năm
├── backups/                       # Database backups tự động (gitignored)
├── frontend/
│   ├── public/
│   │   ├── favicon.ico
│   │   └── logo.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                    # Shadcn components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── toast.tsx
│   │   │   │   └── ...
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── MainLayout.tsx
│   │   │   │   └── AuthLayout.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── KpiCard.tsx
│   │   │   │   ├── KpiCardSkeleton.tsx
│   │   │   │   ├── TrendChart.tsx
│   │   │   │   ├── StatusDistribution.tsx
│   │   │   │   ├── DetailTable.tsx
│   │   │   │   └── WeekSelector.tsx
│   │   │   ├── events/
│   │   │   │   ├── EventForm.tsx
│   │   │   │   ├── EventList.tsx
│   │   │   │   ├── EventFilters.tsx
│   │   │   │   └── EventTable.tsx
│   │   │   ├── reports/
│   │   │   │   ├── WeeklyMatrix.tsx
│   │   │   │   ├── MatrixCell.tsx
│   │   │   │   ├── KpiTrendTable.tsx
│   │   │   │   └── ExportButton.tsx
│   │   │   └── import/
│   │   │       ├── FileUpload.tsx
│   │   │       ├── ColumnMapping.tsx
│   │   │       ├── DataPreview.tsx
│   │   │       └── ImportProgress.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── EventsPage.tsx
│   │   │   ├── EventCreatePage.tsx
│   │   │   ├── EventEditPage.tsx
│   │   │   ├── WeeklyReportPage.tsx
│   │   │   ├── KpiTrendPage.tsx
│   │   │   ├── ImportPage.tsx
│   │   │   ├── CategoriesPage.tsx
│   │   │   └── UsersPage.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useEvents.ts
│   │   │   ├── useDashboard.ts
│   │   │   ├── useCategories.ts
│   │   │   └── useWeekSelector.ts
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── auth.ts
│   │   │   ├── events.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── categories.ts
│   │   │   └── export.ts
│   │   ├── lib/
│   │   │   ├── utils.ts
│   │   │   ├── constants.ts
│   │   │   ├── colors.ts
│   │   │   └── date.ts
│   │   ├── types/
│   │   │   ├── event.ts
│   │   │   ├── category.ts
│   │   │   ├── user.ts
│   │   │   ├── dashboard.ts
│   │   │   └── api.ts
│   │   ├── i18n/
│   │   │   ├── vi.json
│   │   │   └── en.json
│   │   ├── store/
│   │   │   ├── authStore.ts
│   │   │   └── uiStore.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── postcss.config.js
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── eventController.ts
│   │   │   ├── dashboardController.ts
│   │   │   ├── categoryController.ts
│   │   │   ├── importController.ts
│   │   │   └── exportController.ts
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── eventService.ts
│   │   │   ├── dashboardService.ts
│   │   │   ├── categoryService.ts
│   │   │   ├── importService.ts
│   │   │   ├── exportService.ts
│   │   │   └── auditService.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── validate.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── rateLimiter.ts
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── event.routes.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   ├── category.routes.ts
│   │   │   └── export.routes.ts
│   │   ├── validators/
│   │   │   ├── eventValidator.ts
│   │   │   ├── authValidator.ts
│   │   │   └── categoryValidator.ts
│   │   ├── utils/
│   │   │   ├── jwt.ts
│   │   │   ├── password.ts
│   │   │   ├── weekUtils.ts
│   │   │   ├── excelParser.ts
│   │   │   └── pdfGenerator.ts
│   │   ├── types/
│   │   │   ├── express.d.ts
│   │   │   └── index.ts
│   │   ├── config/
│   │   │   ├── index.ts
│   │   │   └── database.ts
│   │   └── app.ts
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   ├── integration/
│   │   │   ├── auth.test.ts
│   │   │   └── events.test.ts
│   │   └── setup.ts
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.js
├── docs/
│   ├── 01_BRD_Business_Requirements_Document.md
│   ├── 02_PRD_Product_Requirements_Document.md
│   ├── 03_SRS_Software_Requirements_Specification.md
│   ├── 04_Implementation_Plan.md
│   ├── images/
│   │   └── tableau_reference_dashboard.png
│   └── api/
│       └── openapi.yaml
├── scripts/
│   ├── seed-data.ts
│   ├── import-excel.ts
│   └── backup-db.sh               # Copy SQLite file, không cần pg_dump
├── docker-compose.yml
├── docker-compose.prod.yml
├── .gitignore
├── .env.example
└── README.md
```

### 1.2 Key Files Description

| File/Folder | Purpose |
|-------------|---------|
| `frontend/src/components/ui/` | Shadcn UI components |
| `frontend/src/components/dashboard/` | Dashboard-specific components (ECharts) |
| `frontend/src/lib/colors.ts` | Color constants matching PRD |
| `frontend/src/hooks/useEventStream.ts` | SSE subscription + TanStack Query invalidation |
| `frontend/src/i18n/vi.json` | Tiếng Việt strings (mặc định) |
| `frontend/src/i18n/en.json` | English strings (tùy chọn) |
| `backend/prisma/schema.prisma` | Database schema definition (SQLite provider, `version` field cho OCC) |
| `backend/src/config/database.ts` | SQLite PRAGMA initialization (WAL mode, foreign keys) |
| `backend/src/services/` | Business logic layer |
| `backend/src/utils/excelParser.ts` | Excel import/export logic |
| `backend/src/utils/pdfGenerator.ts` | Puppeteer PDF generation (headless Chrome) |
| `data/isd_oms.db` | SQLite database file (tự tạo khi migrate) |
| `docker-compose.yml` | Development environment (không cần DB service riêng) |
| `docker-compose.prod.yml` | Production environment |

---

## 2. SPRINT PLAN

### 2.1 Overview

| Sprint | Duration | Focus | Key Deliverables |
|--------|----------|-------|------------------|
| Sprint 1 | 2 weeks | Foundation | DB schema, Auth, CRUD API, Event Log UI |
| Sprint 2 | 2 weeks | Dashboard | KPI cards, Charts, Week selector |
| Sprint 3 | 2 weeks | Reports | Weekly matrix, KPI trend table, Exports |
| Sprint 4 | 2 weeks | Polish | Import wizard, Admin UI, Testing, Deploy |

---

### 2.2 Sprint 1: Foundation (Week 1-2)

#### Goals
- Database schema implemented and seeded
- Authentication working (login/logout)
- Event CRUD API complete
- Event list UI with basic filter

#### Sprint Backlog

| Task ID | Task | Story Points | Assignee |
|---------|------|--------------|----------|
| S1-001 | Setup project structure (monorepo) | 2 | Dev |
| S1-002 | Setup Docker compose dev environment (2 services: backend + frontend, không có DB service) | 2 | Dev |
| S1-003 | Implement Prisma schema (provider = sqlite, WAL PRAGMA config) | 3 | Dev |
| S1-004 | Write database migrations (SQLite file tự tạo) | 2 | Dev |
| S1-005 | Implement seed data script | 3 | Dev |
| S1-006 | Implement auth API (login/logout/me) | 5 | Dev |
| S1-007 | Implement JWT middleware | 3 | Dev |
| S1-008 | Implement Event CRUD API | 5 | Dev |
| S1-009 | Implement event validation | 3 | Dev |
| S1-010 | Setup React project with Vite | 2 | Dev |
| S1-011 | Install and configure Shadcn/ui | 2 | Dev |
| S1-012 | Implement login page | 3 | Dev |
| S1-013 | Implement main layout (sidebar, header) | 5 | Dev |
| S1-014 | Implement event list page with table | 5 | Dev |
| S1-015 | Implement event create/edit form | 5 | Dev |
| S1-016 | Implement event filters | 3 | Dev |
| S1-017 | Implement Good/Bad classification | 2 | Dev |
| S1-018 | Unit tests for auth service | 3 | Dev |
| S1-019 | Setup TanStack Query (QueryClient, QueryClientProvider, devtools) | 2 | Dev |
| S1-020 | Setup React Hook Form + Zod (schemas cho EventForm, LoginForm) | 2 | Dev |
| S1-021 | Setup react-i18next (vi.json strings, i18n.ts config, useTranslation hook) | 2 | Dev |
| S1-022 | Implement server-side draft API (`POST/GET /api/v1/events/draft`) + `event_drafts` table | 3 | Dev |

**Total: 68 Story Points**

#### Acceptance Criteria - Sprint 1

- [ ] `mkdir -p data backups && docker-compose up` starts all services (2 containers, không có PostgreSQL)
- [ ] SQLite file `./data/isd_oms.db` được tạo tự động khi backend khởi động
- [ ] User can login with admin/admin123
- [ ] User can create new event with all fields
- [ ] Event list shows with pagination
- [ ] Filter by week/location/status works
- [ ] Logout clears session

---

### 2.3 Sprint 2: Dashboard (Week 3-4)

#### Goals
- Dashboard layout matching Tableau reference
- All 5 KPI cards with sparklines
- Stacked bar chart working
- Status distribution panel
- Week selector driving all views

#### Sprint Backlog

| Task ID | Task | Story Points | Assignee |
|---------|------|--------------|----------|
| S2-001 | Dashboard API - summary endpoint | 5 | Dev |
| S2-002 | Dashboard API - chart data endpoint | 3 | Dev |
| S2-003 | Implement KpiCard component | 5 | Dev |
| S2-004 | Implement sparkline (ECharts canvas-based — mini line chart) | 3 | Dev |
| S2-005 | Implement delta badge calculation | 2 | Dev |
| S2-006 | Implement TrendChart (ECharts stacked bar — gradient fill, animation) | 8 | Dev |
| S2-007 | Configure chart colors per category | 2 | Dev |
| S2-008 | Implement StatusDistribution panel | 5 | Dev |
| S2-009 | Implement TimeRangeSelector component (granularity: tuần/tháng/quý/năm + presets) | 5 | Dev |
| S2-010 | Implement DetailTable component | 5 | Dev |
| S2-011 | Dashboard page layout (grid) | 5 | Dev |
| S2-012 | Connect week selector to all components | 3 | Dev |
| S2-013 | Implement KPI card click drill-down | 3 | Dev |
| S2-014 | Add loading skeletons | 2 | Dev |
| S2-015 | Performance optimization (< 500ms) | 3 | Dev |
| S2-016 | Dashboard API integration tests | 3 | Dev |

**Total: 60 Story Points**

#### Acceptance Criteria - Sprint 2

- [ ] Dashboard displays 5 KPI cards with sparklines
- [ ] Stacked bar chart shows events by week × category
- [ ] Status distribution shows breakdown by severity
- [ ] Week selector changes update all panels
- [ ] Click KPI card filters detail table
- [ ] Charts render in < 500ms

---

### 2.4 Sprint 3: Reports (Week 5-6)

#### Goals
- Weekly matrix report matching 04_BAO_CAO_TUAN
- KPI trend table matching 99_KPI_TUAN
- PDF export (A3 landscape)
- Excel export

#### Sprint Backlog

| Task ID | Task | Story Points | Assignee |
|---------|------|--------------|----------|
| S3-001 | Weekly matrix API endpoint | 5 | Dev |
| S3-002 | Implement WeeklyMatrix component | 8 | Dev |
| S3-003 | Implement MatrixCell with bullets | 3 | Dev |
| S3-004 | Apply color coding to headers | 2 | Dev |
| S3-005 | KPI trend API endpoint | 3 | Dev |
| S3-006 | Implement KpiTrendTable component | 5 | Dev |
| S3-007 | Add conditional formatting | 2 | Dev |
| S3-008 | Implement PDF generator (Puppeteer headless Chrome — server-side) | 8 | Dev |
| S3-009 | Design PDF HTML template (A3 landscape — Handlebars/EJS, rendered by Puppeteer) | 3 | Dev |
| S3-010 | Implement Excel export (xlsx) | 5 | Dev |
| S3-011 | Match Excel columns to 02_NHAT_KY | 2 | Dev |
| S3-012 | Export API endpoints | 3 | Dev |
| S3-013 | Export button components | 2 | Dev |
| S3-014 | Test PDF output quality | 2 | Dev |
| S3-015 | Test Excel column mapping | 2 | Dev |
| S3-016 | Reports integration tests | 3 | Dev |

**Total: 58 Story Points**

#### Acceptance Criteria - Sprint 3

- [ ] Weekly matrix shows rows=locations, cols=categories
- [ ] Matrix cells show bullet list of descriptions
- [ ] Bad category headers are red, good are green
- [ ] KPI trend table shows W01-W53
- [ ] Current week highlighted in trend table
- [ ] PDF export produces A3 landscape document
- [ ] Excel export matches 02_NHAT_KY format

---

### 2.5 Sprint 4: Polish (Week 7-8)

#### Goals
- Excel import wizard
- Admin UI (categories, users)
- Full testing
- Production deployment

#### Sprint Backlog

| Task ID | Task | Story Points | Assignee |
|---------|------|--------------|----------|
| S4-001 | Excel parser utility | 5 | Dev |
| S4-002 | Import API endpoint | 5 | Dev |
| S4-003 | FileUpload component | 2 | Dev |
| S4-004 | ColumnMapping component | 5 | Dev |
| S4-005 | DataPreview component | 3 | Dev |
| S4-006 | ImportProgress component | 2 | Dev |
| S4-007 | Duplicate detection logic | 3 | Dev |
| S4-008 | Category management API | 3 | Dev |
| S4-009 | Category management UI | 3 | Dev |
| S4-010 | User management API | 3 | Dev |
| S4-011 | User management UI | 3 | Dev |
| S4-012 | Audit log API | 2 | Dev |
| S4-022 | SQLite WAL checkpoint timer (WAL_CHECKPOINT_INTERVAL_MS) | 1 | Dev |
| S4-025 | OCC: thêm `version` field vào Prisma schema + cập nhật PUT handler (HTTP 409 khi conflict) | 3 | Dev |
| S4-026 | SSE endpoint `/events/stream` + `useEventStream` hook (TanStack Query invalidation) | 3 | Dev |
| S4-013 | E2E tests (Playwright) | 5 | Dev |
| S4-014 | Security review | 3 | Dev |
| S4-015 | Production Docker setup | 3 | Dev |
| S4-016 | Nginx production config | 2 | Dev |
| S4-017 | Documentation (README) | 2 | Dev |
| S4-018 | Deployment to server | 3 | Dev |
| S4-019 | User acceptance testing | 5 | Dev |

**Total: 60 Story Points**

#### Acceptance Criteria - Sprint 4

- [ ] Import wizard uploads and parses Excel
- [ ] Column mapping auto-detects headers
- [ ] Preview shows 20 sample rows
- [ ] Duplicates detected and user can skip/replace
- [ ] Admin can manage categories
- [ ] Admin can manage users
- [ ] OCC: concurrent edit conflict returns HTTP 409 + user sees warning toast
- [ ] SSE: event change in one tab reflects in other tabs within < 2 giây
- [ ] `GET /api/v1/health` returns `{"status":"ok"}` in production
- [ ] All tests pass (> 60% coverage)
- [ ] Production deployment successful
- [ ] Users can access from internal network

---

### 2.6 V1.1 Backlog (Defer từ v1.0)

Các tính năng sau đây đã được thiết kế nhưng **KHÔNG** implement trong v1.0 để đảm bảo go-live đúng tiến độ:

| Task ID | Feature | Story Points | Notes |
|---------|---------|--------------|-------|
| S5-001 | Field definitions API (CRUD + deactivate) — FR-011 | 3 | Sau khi v1.0 stable |
| S5-002 | Field definitions Admin UI (form builder) — US-018 | 5 | Phụ thuộc S5-001 |
| S5-003 | Dynamic custom fields trong EventForm | 3 | Phụ thuộc S5-001 |
| S5-004 | Custom fields trong Export Excel/PDF | 3 | Phụ thuộc S5-001 |

> **Ghi chú thiết kế:** Schema DB đã chuẩn bị sẵn (`extra_fields TEXT` column trong events, `field_definitions` table) nhưng không seeded và UI không render. Việc implement v1.1 chỉ cần thêm API + UI mà không cần migrate DB.

---

## 3. DOCKER SETUP

### 3.1 docker-compose.yml (Development)

```yaml
version: '3.8'

services:
  # Backend API (SQLite DB nằm trong volume mount — không cần DB service riêng)
  backend:
    build:
      context: ./backend
      dockerfile: ../docker/Dockerfile.backend
    container_name: isd-oms-api
    environment:
      NODE_ENV: development
      DATABASE_URL: file:/app/data/isd_oms.db
      JWT_SECRET: dev-jwt-secret-change-in-production
      JWT_EXPIRES_IN: 8h
      PORT: 3001
      WAL_CHECKPOINT_INTERVAL_MS: 30000   # WAL checkpoint mỗi 30s (0 = dùng auto-checkpoint)
    ports:
      - "3001:3001"
    volumes:
      - ./backend/src:/app/src
      - ./backend/prisma:/app/prisma
      - ./data:/app/data          # SQLite database files (persist trên host — ngoài container)
      - /app/node_modules
    command: npm run dev
    networks:
      - isd-network

  # Frontend (Vite dev server)
  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/Dockerfile.frontend
      target: development
    container_name: isd-oms-web
    environment:
      VITE_API_URL: http://localhost:3001/api/v1
    ports:
      - "3000:3000"
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
      - /app/node_modules
    depends_on:
      - backend
    command: npm run dev -- --host
    networks:
      - isd-network

networks:
  isd-network:
    driver: bridge
```

### 3.2 docker-compose.prod.yml (Production)

```yaml
version: '3.8'

services:
  # Backend API (SQLite DB nằm trong volume mount — không cần DB service riêng)
  backend:
    build:
      context: ./backend
      dockerfile: ../docker/Dockerfile.backend
      target: production
    container_name: isd-oms-api-prod
    environment:
      NODE_ENV: production
      DATABASE_URL: file:/app/data/isd_oms.db
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 8h
      PORT: 3001
      WAL_CHECKPOINT_INTERVAL_MS: ${WAL_CHECKPOINT_INTERVAL_MS:-30000}  # Default 30s, configurable
    volumes:
      - ./data:/app/data          # SQLite DB files — mount ra ngoài container (persist khi restart)
      - ./backups:/app/backups    # Backup directory
    networks:
      - isd-network-prod
    restart: unless-stopped

  # Frontend (Nginx serving static files)
  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/Dockerfile.frontend
      target: production
      args:
        VITE_API_URL: /api/v1
    container_name: isd-oms-web-prod
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    networks:
      - isd-network-prod
    restart: unless-stopped

networks:
  isd-network-prod:
    driver: bridge
```

### 3.3 Dockerfile.backend

> **Lưu ý Puppeteer:** Puppeteer dùng headless Chromium để generate PDF. Cần install Chromium system package trong Docker image. Dùng `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` để tránh download Chromium riêng, và dùng `/usr/bin/chromium-browser` từ Alpine apk.

```dockerfile
# Backend Dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# Install Chromium for Puppeteer PDF generation
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto \
    font-noto-cjk

# Tell Puppeteer to use installed Chromium (không download riêng)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./
RUN npm ci

# Development stage
FROM base AS development
COPY . .
RUN npx prisma generate
EXPOSE 3001
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder
COPY . .
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Chromium cho Puppeteer (production cũng cần)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto \
    font-noto-cjk

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
EXPOSE 3001
CMD ["npm", "run", "start:prod"]
```

### 3.4 Dockerfile.frontend

```dockerfile
# Frontend Dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Development stage
FROM base AS development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host"]

# Build stage
FROM base AS builder
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY . .
RUN npm run build

# Production stage (Nginx)
FROM nginx:1.25-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3.5 Nginx Configuration (default.conf)

```nginx
upstream backend {
    server backend:3001;
}

server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # API proxy
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # SSE endpoint — cần disable buffering để SSE hoạt động
    location /api/v1/events/stream {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Tắt buffering cho SSE (Server-Sent Events)
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 600s;    # Long-lived connection cho SSE
        add_header X-Accel-Buffering no;
        add_header Cache-Control no-cache;
    }

    # Static files
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

---

## 4. SEED DATA SCRIPT

### 4.1 Prisma Seed Script (prisma/seed.ts)

```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as xlsx from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

// Category taxonomy from 03_DANH_MUC
const categoryData = [
  // Ổn định hệ thống
  { mainGroup: 'Ổn định hệ thống', category: 'Sự cố/Lỗi', classification: 'bad_news', sortOrder: 1 },
  { mainGroup: 'Ổn định hệ thống', category: 'Downtime', classification: 'bad_news', sortOrder: 2 },
  { mainGroup: 'Ổn định hệ thống', category: 'Cải thiện', classification: 'good_news', sortOrder: 3 },
  { mainGroup: 'Ổn định hệ thống', category: 'Bảo trì', classification: 'neutral', sortOrder: 4 },

  // An toàn thông tin
  { mainGroup: 'An toàn thông tin', category: 'Mối đe dọa', classification: 'bad_news', sortOrder: 5 },
  { mainGroup: 'An toàn thông tin', category: 'Cải thiện bảo mật', classification: 'good_news', sortOrder: 6 },
  { mainGroup: 'An toàn thông tin', category: 'Audit/Compliance', classification: 'neutral', sortOrder: 7 },

  // Tối ưu hóa
  { mainGroup: 'Tối ưu hóa', category: 'Automation', classification: 'good_news', sortOrder: 8 },
  { mainGroup: 'Tối ưu hóa', category: 'Performance tuning', classification: 'good_news', sortOrder: 9 },
  { mainGroup: 'Tối ưu hóa', category: 'Cost optimization', classification: 'good_news', sortOrder: 10 },

  // Biến động nhân sự
  { mainGroup: 'Biến động nhân sự', category: 'Onboarding', classification: 'neutral', sortOrder: 11 },
  { mainGroup: 'Biến động nhân sự', category: 'Offboarding', classification: 'neutral', sortOrder: 12 },
  { mainGroup: 'Biến động nhân sự', category: 'Training', classification: 'good_news', sortOrder: 13 },

  // Dự án
  { mainGroup: 'Dự án', category: 'Triển khai mới/Mở rộng', classification: 'good_news', sortOrder: 14 },
  { mainGroup: 'Dự án', category: 'POC/Pilot', classification: 'neutral', sortOrder: 15 },
  { mainGroup: 'Dự án', category: 'Project milestone', classification: 'good_news', sortOrder: 16 },
] as const;

// Generate week references for a year
function generateWeekReferences(year: number) {
  const weeks = [];
  // ISO week 1 of 2026 starts on Monday 2025-12-29
  const firstMonday = new Date(year - 1, 11, 29);

  // Find the actual first Monday of ISO week 1
  const jan1 = new Date(year, 0, 1);
  const dayOfWeek = jan1.getDay();
  const daysToMonday = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek);
  const isoWeek1Start = new Date(jan1);
  isoWeek1Start.setDate(jan1.getDate() - jan1.getDay() + (jan1.getDay() === 0 ? -6 : 1));
  if (isoWeek1Start.getDate() > 4) {
    isoWeek1Start.setDate(isoWeek1Start.getDate() - 7);
  }

  for (let i = 1; i <= 53; i++) {
    const startDate = new Date(isoWeek1Start);
    startDate.setDate(isoWeek1Start.getDate() + (i - 1) * 7);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    weeks.push({
      weekCode: `W${String(i).padStart(2, '0')}`,
      year,
      startDate,
      endDate,
    });
  }

  return weeks;
}

// Excel column mapping (matches 02_NHAT_KY)
const excelColumnMapping = {
  B: 'week',
  C: 'date',
  D: 'location',
  E: 'mainGroup',
  F: 'category',
  G: 'systemComponent',
  H: 'customerTenant',
  I: 'severity',
  J: 'status',
  K: 'assignee',
  L: 'openprojectId',
  M: 'description',
  N: 'downtimeMinutes',
  O: 'classification',
};

async function importFromExcel(filePath: string, userId: string) {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets['02_NHAT_KY'];

  if (!sheet) {
    console.log('Sheet 02_NHAT_KY not found');
    return;
  }

  const data = xlsx.utils.sheet_to_json(sheet, { header: 'A' });

  // Skip header row
  const rows = data.slice(1);

  for (const row of rows as any[]) {
    if (!row.B || !row.M) continue; // Skip if no week or description

    try {
      await prisma.event.create({
        data: {
          week: row.B,
          date: new Date(row.C),
          location: row.D,
          mainGroup: row.E,
          category: row.F,
          systemComponent: row.G || null,
          customerTenant: row.H || null,
          severity: row.I || 'Thấp',
          status: row.J || 'Mở',
          assignee: row.K || null,
          openprojectId: row.L || null,
          description: row.M,
          downtimeMinutes: parseInt(row.N) || 0,
          classification: row.O || 'neutral',
          createdById: userId,
        },
      });
    } catch (error) {
      console.error(`Error importing row: ${row.M}`, error);
    }
  }
}

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Seed category_master
  console.log('📁 Seeding categories...');
  for (const cat of categoryData) {
    await prisma.categoryMaster.upsert({
      where: {
        mainGroup_category: {
          mainGroup: cat.mainGroup,
          category: cat.category,
        },
      },
      update: {},
      create: {
        mainGroup: cat.mainGroup,
        category: cat.category,
        classificationDefault: cat.classification,
        sortOrder: cat.sortOrder,
      },
    });
  }
  console.log(`  ✅ ${categoryData.length} categories seeded`);

  // 2. Seed week_references for 2025, 2026, 2027
  console.log('📅 Seeding week references...');
  for (const year of [2025, 2026, 2027]) {
    const weeks = generateWeekReferences(year);
    for (const week of weeks) {
      await prisma.weekReference.upsert({
        where: {
          year_weekCode: {
            year: week.year,
            weekCode: week.weekCode,
          },
        },
        update: {},
        create: week,
      });
    }
    console.log(`  ✅ ${weeks.length} weeks for ${year}`);
  }

  // 3. Seed default admin user
  console.log('👤 Seeding admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: hashedPassword,
      fullName: 'System Administrator',
      role: 'Admin',
    },
  });
  console.log('  ✅ Admin user created (admin/admin123)');

  // 4. Create sample Editor and Viewer users
  console.log('👥 Seeding sample users...');
  const editorPassword = await bcrypt.hash('editor123', 12);
  await prisma.user.upsert({
    where: { username: 'editor' },
    update: {},
    create: {
      username: 'editor',
      passwordHash: editorPassword,
      fullName: 'Operations Editor',
      role: 'Editor',
    },
  });

  const viewerPassword = await bcrypt.hash('viewer123', 12);
  await prisma.user.upsert({
    where: { username: 'viewer' },
    update: {},
    create: {
      username: 'viewer',
      passwordHash: viewerPassword,
      fullName: 'Dashboard Viewer',
      role: 'Viewer',
    },
  });
  console.log('  ✅ Sample users created (editor/editor123, viewer/viewer123)');

  // 5. Import from Excel if file exists
  const excelPath = path.join(__dirname, '../../BS24_ISD_Operations_Template_2026.xlsx');
  try {
    await importFromExcel(excelPath, admin.id);
    console.log('  ✅ Excel data imported');
  } catch {
    console.log('  ⚠️ Excel file not found, skipping import');
  }

  // 6. Create sample events for demo (if no Excel data)
  const eventCount = await prisma.event.count();
  if (eventCount === 0) {
    console.log('📝 Creating sample events...');
    const sampleEvents = [
      {
        week: 'W03',
        date: new Date('2026-01-15'),
        location: 'KDAMB',
        mainGroup: 'Ổn định hệ thống',
        category: 'Sự cố/Lỗi',
        systemComponent: 'Database Server',
        customerTenant: 'Client A',
        severity: 'Cao',
        status: 'Đã đóng',
        assignee: 'Nguyễn Văn A',
        description: 'Database connection pool exhausted causing service interruption',
        downtimeMinutes: 30,
        classification: 'bad_news',
        createdById: admin.id,
      },
      {
        week: 'W03',
        date: new Date('2026-01-16'),
        location: 'KDAMN',
        mainGroup: 'Tối ưu hóa',
        category: 'Automation',
        systemComponent: 'CI/CD Pipeline',
        customerTenant: null,
        severity: 'Thấp',
        status: 'Đã đóng',
        assignee: 'Trần Thị B',
        description: 'Implemented automated deployment pipeline reducing deployment time by 60%',
        downtimeMinutes: 0,
        classification: 'good_news',
        createdById: admin.id,
      },
      {
        week: 'W03',
        date: new Date('2026-01-17'),
        location: 'HO',
        mainGroup: 'An toàn thông tin',
        category: 'Cải thiện bảo mật',
        systemComponent: 'Firewall',
        customerTenant: null,
        severity: 'Trung bình',
        status: 'Đã đóng',
        assignee: 'Lê Văn C',
        description: 'Updated firewall rules to block suspicious IP ranges',
        downtimeMinutes: 0,
        classification: 'good_news',
        createdById: admin.id,
      },
      {
        week: 'W04',
        date: new Date('2026-01-20'),
        location: 'Offshore',
        mainGroup: 'Dự án',
        category: 'Triển khai mới/Mở rộng',
        systemComponent: 'Web Application',
        customerTenant: 'Client B',
        severity: 'Thấp',
        status: 'Đang xử lý',
        assignee: 'Phạm Văn D',
        description: 'Deploying new customer portal with enhanced reporting features',
        downtimeMinutes: 0,
        classification: 'good_news',
        createdById: admin.id,
      },
      {
        week: 'W04',
        date: new Date('2026-01-21'),
        location: 'KDAMB',
        mainGroup: 'Ổn định hệ thống',
        category: 'Downtime',
        systemComponent: 'Load Balancer',
        customerTenant: 'All',
        severity: 'Nghiêm trọng',
        status: 'Mở',
        assignee: 'Nguyễn Văn A',
        description: 'Scheduled maintenance for load balancer firmware upgrade',
        downtimeMinutes: 60,
        classification: 'bad_news',
        createdById: admin.id,
      },
    ];

    for (const event of sampleEvents) {
      await prisma.event.create({ data: event });
    }
    console.log(`  ✅ ${sampleEvents.length} sample events created`);
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 4.2 Run Seed Command

```bash
# Development
cd backend
npx prisma db seed

# Or via npm script (add to package.json)
npm run seed
```

**package.json addition:**
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

---

## 5. DEVELOPMENT GUIDELINES

### 5.1 Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb config with TypeScript
- **Prettier**: Default config
- **Naming**: camelCase for variables/functions, PascalCase for components/types

### 5.2 Git Workflow

```
main
  └── develop
        ├── feature/S1-001-project-setup
        ├── feature/S1-005-seed-data
        └── bugfix/S2-dashboard-loading
```

**Commit message format:**
```
[S1-001] Setup project structure

- Initialize monorepo with frontend and backend
- Configure Docker compose for development
- Add base configuration files
```

### 5.3 API Response Format

```typescript
// Success
{
  success: true,
  data: { ... },
  message?: "Optional success message"
}

// Error
{
  success: false,
  code: "ERROR_CODE",
  message: "Human readable message",
  details?: { ... }
}
```

### 5.4 Key Dependencies (package.json)

**Frontend (`frontend/package.json`):**
```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.x",
    "@tanstack/react-query": "^5.x",
    "@tanstack/react-query-devtools": "^5.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "@hookform/resolvers": "^3.x",
    "echarts": "^5.x",
    "echarts-for-react": "^3.x",
    "react-i18next": "^14.x",
    "i18next": "^23.x",
    "axios": "^1.x",
    "zustand": "^4.x",
    "date-fns": "^3.x"
  }
}
```

**Backend (`backend/package.json`):**
```json
{
  "dependencies": {
    "express": "^4.x",
    "@prisma/client": "^5.x",
    "puppeteer-core": "^22.x",
    "xlsx": "^0.18.x",
    "jsonwebtoken": "^9.x",
    "bcrypt": "^5.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "prisma": "^5.x"
  }
}
```

> **Lưu ý:** Dùng `puppeteer-core` (không có `puppeteer`) để tránh download Chromium trong npm — thay vào đó dùng Chromium từ Alpine apk đã install trong Docker image.

### 5.5 SQLite Configuration (backend/src/config/database.ts)

Khi khởi tạo Prisma Client, phải set các PRAGMA và cấu hình WAL checkpoint định kỳ:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Chạy một lần khi app khởi động
async function initializeSQLite() {
  // --- Core SQLite PRAGMAs ---
  await prisma.$executeRawUnsafe('PRAGMA journal_mode = WAL;');        // Concurrent reads
  await prisma.$executeRawUnsafe('PRAGMA synchronous = NORMAL;');      // Safe + fast (data safe after commit)
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');         // Enforce FK constraints
  await prisma.$executeRawUnsafe('PRAGMA busy_timeout = 5000;');       // Wait 5s before write lock error
  await prisma.$executeRawUnsafe('PRAGMA cache_size = -64000;');       // 64MB page cache in memory
  await prisma.$executeRawUnsafe('PRAGMA temp_store = MEMORY;');       // Temp tables in memory

  // --- Periodic WAL Checkpoint ---
  // WAL checkpoint = merge WAL file vào main DB file (housekeeping)
  // Data đã an toàn trên disk trong WAL file sau mỗi commit.
  // Checkpoint chỉ là gộp WAL → DB chính để giữ WAL file nhỏ.
  // Configurable qua env var WAL_CHECKPOINT_INTERVAL_MS (default: 30000ms = 30s)
  const checkpointInterval = parseInt(process.env.WAL_CHECKPOINT_INTERVAL_MS || '30000');
  if (checkpointInterval > 0) {
    setInterval(async () => {
      try {
        // PASSIVE: checkpoint không block readers/writers
        await prisma.$executeRawUnsafe('PRAGMA wal_checkpoint(PASSIVE);');
      } catch (err) {
        console.error('[SQLite] WAL checkpoint error:', err);
      }
    }, checkpointInterval);
    console.log(`[SQLite] WAL checkpoint interval: ${checkpointInterval}ms`);
  }
}

export { prisma, initializeSQLite };
```

> **WAL vs In-memory flush:**
> - `synchronous = NORMAL` → data ghi vào WAL file trên disk ngay sau mỗi commit — **không mất data khi crash**
> - `wal_checkpoint(PASSIVE)` định kỳ = gộp WAL vào DB chính — **đây là "flush" an toàn**, không phải in-memory→disk
> - `WAL_CHECKPOINT_INTERVAL_MS=0` để tắt periodic checkpoint (SQLite sẽ tự checkpoint theo `wal_autocheckpoint=1000 pages`)

> **Volume mount:** SQLite file nằm tại `./data/isd_oms.db` trên host, được mount vào container tại `/app/data/isd_oms.db`. File này persist khi restart/recreate container.

### 5.6 Component Structure

```typescript
// Component file structure
components/
  dashboard/
    KpiCard/
      KpiCard.tsx         // Main component
      KpiCard.test.tsx    // Tests
      KpiCard.stories.tsx // Storybook (optional)
      index.ts            // Export
```

### 5.7 Conflict Prevention Strategy (OCC + SSE)

**Bối cảnh:** Với < 20 concurrent users, rủi ro chính là "lost update" — User A và User B cùng mở cùng một event form, User B lưu sau và ghi đè dữ liệu User A đã thay đổi mà không hay biết.

**Tại sao không dùng WebSocket?**
- WebSocket phù hợp cho collaborative editing real-time (Google Docs style — nhiều người edit cùng 1 document đồng thời)
- Với < 20 users và CRUD riêng biệt (mỗi người edit event của mình), SSE (server-to-client one-way) là đủ và đơn giản hơn nhiều
- SQLite WAL + `busy_timeout` đã xử lý concurrent writes ở DB layer
- WebSocket có thể cân nhắc trong v2.0 nếu cần collaborative editing

**3-layer conflict prevention:**

```
Layer 1: SQLite WAL          → Serializes concurrent writes, no DB crash
Layer 2: OCC (version field) → Detects lost updates, returns HTTP 409
Layer 3: SSE notifications   → Live UI refresh, prevents stale data editing
```

#### 5.7.1 Layer 2: Optimistic Concurrency Control (OCC)

**Prisma Schema (thêm vào model Event):**
```prisma
model Event {
  // ... existing fields ...
  version    Int      @default(1)    // OCC version counter
}
```

**Backend — eventService.ts:**
```typescript
async updateEvent(id: string, data: UpdateEventDto, expectedVersion: number, userId: string) {
  // Atomic update: chỉ update nếu version khớp
  const result = await prisma.event.updateMany({
    where: {
      id,
      version: expectedVersion,  // OCC check
      deletedAt: null,
    },
    data: {
      ...data,
      version: { increment: 1 }, // Tăng version sau mỗi update thành công
      updatedAt: new Date(),
    },
  });

  if (result.count === 0) {
    // Kiểm tra event có tồn tại không
    const exists = await prisma.event.findFirst({ where: { id, deletedAt: null } });
    if (!exists) throw new NotFoundError('EVENT_NOT_FOUND', 'Sự kiện không tồn tại.');
    // Event tồn tại nhưng version không khớp → conflict
    throw new ConflictError('EVENT_CONFLICT', 'Sự kiện đã bị thay đổi bởi người dùng khác. Vui lòng tải lại trang.');
  }

  // Audit log + SSE broadcast
  await auditService.log({ entityId: id, action: 'update', userId });
  broadcastEventChange('updated', id, userId);
}
```

**Frontend — EventForm.tsx:**
```typescript
// Lưu version khi load form
const { data: event } = useQuery({ queryKey: ['event', id], queryFn: () => fetchEvent(id) });

// Gửi version kèm PUT request
const mutation = useMutation({
  mutationFn: (data) => updateEvent(id, { ...data, version: event.version }),
  onError: (error) => {
    if (error.code === 'EVENT_CONFLICT') {
      toast.warning('Sự kiện đã bị thay đổi bởi người khác. Đang tải lại dữ liệu mới nhất...');
      queryClient.invalidateQueries({ queryKey: ['event', id] }); // Refresh form
    }
  },
});
```

#### 5.7.2 Layer 3: Server-Sent Events (SSE)

**Backend — routes/event.routes.ts:**
```typescript
// SSE client registry
const sseClients = new Map<string, Response>();

function broadcastEventChange(action: 'created' | 'updated' | 'deleted', eventId: string, userId: string) {
  const payload = JSON.stringify({ action, eventId, userId, timestamp: new Date().toISOString() });
  sseClients.forEach((res) => {
    try { res.write(`data: ${payload}\n\n`); } catch { /* client disconnected */ }
  });
}

// SSE endpoint
router.get('/stream', authMiddleware, (req: Request, res: Response) => {
  const clientId = `${req.user.id}-${Date.now()}`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
  res.flushHeaders();

  // Heartbeat mỗi 30s để giữ connection
  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 30000);

  sseClients.set(clientId, res);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(clientId);
  });
});
```

**Frontend — hooks/useEventStream.ts:**
```typescript
export function useEventStream() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const eventSource = new EventSource('/api/v1/events/stream', {
      withCredentials: true,
    });

    eventSource.onmessage = (e) => {
      const { action, eventId } = JSON.parse(e.data);

      // Invalidate queries → TanStack Query tự refetch
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      // Nếu user đang edit đúng event bị thay đổi, show warning
      if (action === 'updated') {
        queryClient.setQueryData(['event-modified', eventId], true);
      }
    };

    eventSource.onerror = () => {
      // Tự động reconnect (browser SSE behavior)
    };

    return () => eventSource.close();
  }, [user, queryClient]);
}

// Sử dụng trong App.tsx hoặc MainLayout:
// useEventStream(); // Subscribe once at app level
```

---

## 6. TESTING STRATEGY

### 6.1 Test Types

| Type | Tool | Coverage Target | Focus |
|------|------|-----------------|-------|
| Unit | Jest | 60% | Services, utils |
| Integration | Jest + Supertest | 40% | API endpoints |
| E2E | Playwright | Critical paths | User flows |

### 6.2 Critical Test Cases

| ID | Test Case | Type |
|----|-----------|------|
| TC-001 | User can login with valid credentials | E2E |
| TC-002 | Event CRUD operations | Integration |
| TC-003 | Dashboard KPI calculations | Unit |
| TC-004 | Week selector updates all components | E2E |
| TC-005 | Excel import with duplicate detection | Integration |
| TC-006 | PDF export generates valid file | Integration |

### 6.3 Test Commands

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

---

## 7. DEPLOYMENT CHECKLIST

### 7.1 Pre-deployment

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Seed data loaded (if needed)
- [ ] SSL certificates installed
- [ ] Backup strategy configured

### 7.2 Environment Variables (.env.production)

```env
# SQLite Database (không cần user/password — file-based)
DATABASE_URL=file:/app/data/isd_oms.db

# SQLite WAL Checkpoint (merge WAL → DB chính)
# 30000 = 30 giây, 15000 = 15 giây, 0 = dùng auto-checkpoint (mỗi ~4MB writes)
WAL_CHECKPOINT_INTERVAL_MS=30000

# JWT
JWT_SECRET=<64-char-random-string>
JWT_EXPIRES_IN=8h

# App
NODE_ENV=production
PORT=3001

# Optional
BACKUP_DIR=/app/backups
LOG_LEVEL=info
```

### 7.3 Deployment Steps

```bash
# 1. Clone repository
git clone <repo-url>
cd isd-oms

# 2. Tạo thư mục data và backups (SQLite files sẽ tự tạo khi migrate)
mkdir -p data backups

# 3. Create .env file
cp .env.example .env
# Chỉ cần set JWT_SECRET — không cần DB_USER/DB_PASSWORD

# 4. Build and start
docker-compose -f docker-compose.prod.yml up -d --build

# 5. Run migrations (SQLite file tự tạo tại ./data/isd_oms.db)
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# 6. Seed data (first time only)
docker-compose -f docker-compose.prod.yml exec backend npx prisma db seed

# 7. Verify
curl http://localhost/api/v1/health
```

### 7.4 Post-deployment

- [ ] Verify all services running
- [ ] Test login functionality
- [ ] Test dashboard loading
- [ ] Test PDF export
- [ ] Configure backup cron job
- [ ] Setup monitoring (optional)

### 7.5 Backup Script (scripts/backup-db.sh)

```bash
#!/bin/bash
# SQLite Backup Script — đơn giản hơn pg_dump, chỉ cần copy file
DATA_DIR="/app/data"
BACKUP_DIR="/app/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Dùng SQLite Online Backup API (an toàn khi DB đang mở)
# Cần sqlite3 CLI hoặc có thể dùng cp nếu app đang dừng
if command -v sqlite3 &> /dev/null; then
  # Hot backup (an toàn khi app đang chạy)
  sqlite3 "${DATA_DIR}/isd_oms.db" ".backup ${BACKUP_DIR}/isd_oms_backup_${TIMESTAMP}.db"
else
  # Cold backup (nếu không có sqlite3 CLI — chỉ dùng khi app dừng)
  cp "${DATA_DIR}/isd_oms.db" "${BACKUP_DIR}/isd_oms_backup_${TIMESTAMP}.db"
fi

gzip "${BACKUP_DIR}/isd_oms_backup_${TIMESTAMP}.db"

# Giữ 7 ngày gần nhất
find ${BACKUP_DIR} -name "*.gz" -mtime +7 -delete

echo "Backup completed: isd_oms_backup_${TIMESTAMP}.db.gz"
```

**Cron job (daily at 2 AM):**
```
0 2 * * * docker exec isd-oms-api-prod /app/scripts/backup-db.sh >> /var/log/isd-backup.log 2>&1
```

---

## Document Control

| Action | Date | Author | Notes |
|--------|------|--------|-------|
| Created | 23/02/2026 | ISD Team | Initial version |
| Reviewed | - | - | Pending |
| Approved | - | - | Pending |

---

*End of Implementation Plan*
