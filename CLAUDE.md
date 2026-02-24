# ISD-OMS — Claude Code Instructions

## Project Overview

ISD Operations Management System: thay thế file Excel `BS24_ISD_Operations_Template_2026.xlsx` bằng web application quản lý sự kiện IT nội bộ, với dashboard tương tác chất lượng cao (Tableau-level).

- **Repo:** https://github.com/haintbotast/ISD-Business-Operations
- **Current phase:** Sprint 1 — Foundation (DB, Auth, CRUD)
- **Target users:** < 20 concurrent users (nội bộ ISD team)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite + Shadcn/ui + Apache ECharts + React Hook Form + Zod + TanStack Query + react-i18next + Zustand + Axios |
| Backend | Node.js 20 + TypeScript + Express + Prisma ORM |
| Database | SQLite 3 — WAL mode, file `./data/isd_oms.db` |
| PDF | Puppeteer (`puppeteer-core`) + Chromium from Alpine apk |
| Infrastructure | Docker + Nginx |

## Directory Structure

```
ISD-Business-Operations/
├── CLAUDE.md
├── frontend/
│   ├── CLAUDE.md           # Frontend-specific agent instructions
│   └── src/
├── backend/
│   ├── CLAUDE.md           # Backend-specific agent instructions
│   ├── prisma/
│   └── src/
├── data/                   # SQLite DB files (gitignored)
├── backups/                # DB backups (gitignored)
├── docs/                   # Project documentation (source of truth)
│   ├── 00_MASTER_PROJECT_OVERVIEW.md
│   ├── 01_BRD_Business_Requirements_Document.md
│   ├── 02_PRD_Product_Requirements_Document.md    # ERD here
│   ├── 03_SRS_Software_Requirements_Specification.md  # API contracts
│   └── 04_Implementation_Plan.md                  # Sprint backlog
├── docker-compose.yml
└── docker-compose.prod.yml
```

## Dev Commands

```bash
# Start all services (2 containers: frontend + backend)
docker-compose up -d

# Individual services
cd frontend && npm run dev       # http://localhost:3000
cd backend && npm run dev        # http://localhost:3001

# Prisma
cd backend && npx prisma migrate dev --name <name>
cd backend && npx prisma generate
cd backend && npx prisma db seed

# Tests
cd frontend && npm test
cd backend && npm test

# Health check
curl http://localhost:3001/api/v1/health
# Expected: {"status":"ok","db":"ok","version":"1.0.0"}
```

## Source of Truth

| What | Where |
|------|-------|
| Business requirements | `docs/01_BRD_Business_Requirements_Document.md` |
| Data model / ERD | `docs/02_PRD_Product_Requirements_Document.md` Section 6.2 |
| API contracts | `docs/03_SRS_Software_Requirements_Specification.md` Section 5 |
| Sprint tasks | `docs/04_Implementation_Plan.md` Section 2 |
| Field mapping from Excel | `docs/03_SRS_Software_Requirements_Specification.md` Section 4.3 |
| Excel reference | `BS24_ISD_Operations_Template_2026.xlsx` |

## Global Rules — ALWAYS

- TypeScript strict mode — minimize `any`, use proper types or `unknown`
- Validate all API inputs with **Zod** at the route/controller layer
- Audit log every CREATE / UPDATE / DELETE on `events` table
- Use **soft delete** (`deleted_at`) — never hard-delete from `events`
- Include `version` field (OCC) on every PUT /events/:id request
- Return errors in standard format: `{ success: false, code: "SCREAMING_SNAKE", message: "..." }`
- Commit messages follow Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`
- All UI text via `t('key')` from react-i18next — no hardcoded Vietnamese strings in JSX

## Global Rules — NEVER

- NEVER hard-delete from `events` table
- NEVER skip OCC version check on event updates
- NEVER hardcode location/category values (KDAMB, KDAMN...) in code — read from DB
- NEVER implement FR-011 Custom Fields in v1.0 — deferred to v1.1
- NEVER use PostgreSQL — project uses SQLite only
- NEVER skip `authMiddleware` on business data endpoints
- NEVER use WebSocket — project uses SSE for real-time (sufficient for < 20 users)
- NEVER commit: `data/`, `backups/`, `*.db`, `.env`, `node_modules/`

## Key Architectural Decisions

### 1. SQLite WAL Mode
Required PRAGMAs (set in `backend/src/config/database.ts` at startup):
```sql
PRAGMA journal_mode=WAL;       -- concurrent reads while writing
PRAGMA synchronous=NORMAL;     -- crash-safe + performance
PRAGMA busy_timeout=5000;      -- wait up to 5s on write lock
PRAGMA foreign_keys=ON;        -- enforce FK constraints
PRAGMA cache_size=-64000;      -- 64MB page cache
```

### 2. Conflict Prevention (3-layer)
```
Layer 1: SQLite WAL          → Serializes concurrent DB writes
Layer 2: OCC (version field) → Detects lost updates → HTTP 409
Layer 3: SSE notifications   → Live UI refresh → prevents stale edits
```

### 3. OCC Pattern
- `events` table has `version INTEGER DEFAULT 1`
- PUT /events/:id requires `version` in request body
- Backend: `updateMany WHERE id=? AND version=? AND deletedAt IS NULL`
- On `count === 0`: check if exists → 404 if not, 409 if version mismatch
- On success: increment version + broadcast SSE + write audit log

### 4. SSE Endpoint
- `GET /api/v1/events/stream` — authenticated, long-lived connection
- Heartbeat comment every 30s to keep connection alive
- Nginx: `proxy_buffering off; proxy_read_timeout 600s`
- Frontend: `useEventStream()` hook at App/MainLayout level — invalidates TanStack Query on event

### 5. PDF via Puppeteer
- Uses `puppeteer-core` (no bundled Chromium)
- Chromium installed via Alpine: `apk add chromium nss freetype harfbuzz ca-certificates ttf-freefont font-noto font-noto-cjk`
- Env vars: `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`, `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser`
- A3 landscape, rendered from HTML template (Handlebars/EJS)

## Default Seed Data

```
Users:    admin/admin123 (Admin), editor/editor123 (Editor), viewer/viewer123 (Viewer)
Locations: KDAMB, KDAMN, Offshore, HO
```

## v1.1 Backlog (DO NOT implement in v1.0)

| Feature | Tasks |
|---------|-------|
| Custom Fields (FR-011) | `field_definitions` API, Admin form builder UI, dynamic EventForm fields, custom fields in export |

> Schema is pre-designed (`extra_fields TEXT` column in events, `field_definitions` table) — v1.1 only needs API + UI, no DB migration needed.
