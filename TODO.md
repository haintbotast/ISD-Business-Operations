# ISD-OMS — Implementation Progress

> **AI Agent:** Đọc file này đầu tiên mỗi session. Update checkbox khi hoàn thành task.
> **Docs:** `docs/04_Implementation_Plan.md` | **Agent rules:** `CLAUDE.md`, `backend/CLAUDE.md`, `frontend/CLAUDE.md`

---

## Current Status: Sprint 1 — Phase 3 COMPLETE ✅

**Completed:** Phase 1 ✅ | Phase 2 ✅ | Phase 3 ✅
**Next action:** Install deps, run `prisma migrate dev`, verify acceptance criteria

---

## Phase 1: Project Scaffold (S1-001 – S1-006)

_Backend foundation — do these first, in order._

- [x] **S1-001** `backend/` — Init Node.js + TypeScript project (`npm init`, `tsconfig.json`, `eslint`)
- [x] **S1-002** `backend/` — Install Express + Prisma + dependencies (see `backend/CLAUDE.md` for full list)
- [x] **S1-003** `backend/prisma/schema.prisma` — Define full schema (Event, User, WeekReference, LocationMaster, CategoryMaster, AuditLog, EventDraft)
- [x] **S1-004** `backend/src/config/database.ts` — Prisma client + SQLite WAL PRAGMAs
- [x] **S1-005** `backend/prisma/seed.ts` — Seed users (admin/editor/viewer) + locations (KDAMB, KDAMN, Offshore, HO) + categories
- [x] **S1-006** `docker-compose.yml` + `docker-compose.prod.yml` — 2 containers: frontend + backend (no DB service)

---

## Phase 2: Backend Auth + Events API (S1-007 – S1-010, S1-018, S1-022)

- [x] **S1-007** `backend/src/middleware/auth.ts` + `rbac.ts` — JWT auth middleware + `requireRole()`
- [x] **S1-008** `backend/src/routes/auth.routes.ts` — POST /login, POST /logout, GET /me
- [x] **S1-009** `backend/src/routes/event.routes.ts` — Full CRUD: GET/POST/PUT(OCC)/DELETE + soft delete
- [x] **S1-010** `backend/src/routes/health.routes.ts` — GET /api/v1/health (no auth)
- [ ] **S1-018** `backend/src/services/auth.service.ts` — Unit tests (Jest) ← _deferred to Sprint 2_
- [x] **S1-022** `backend/src/routes/event.routes.ts` (draft endpoints) + `event_drafts` table migration — POST/GET /api/v1/events/draft

---

## Phase 3: Frontend Scaffold (S1-011 – S1-021)

_Start after Phase 1 backend is running._

- [x] **S1-011** `frontend/` — Init Vite + React 18 + TypeScript; install all deps; configure Shadcn/ui
- [x] **S1-019** `frontend/src/main.tsx` — Setup TanStack Query (`QueryClient`, `QueryClientProvider`, devtools)
- [x] **S1-020** `frontend/src/` — Setup React Hook Form + Zod (EventForm schema, LoginForm schema)
- [x] **S1-021** `frontend/src/i18n/` — Setup react-i18next (`i18n.ts`, `vi.json`, `en.json` with initial keys)
- [x] **S1-012** `frontend/src/pages/LoginPage.tsx` — Login form with RHF + Zod + auth mutation
- [x] **S1-013** `frontend/src/components/shared/Layout/` — Main layout: sidebar + header + outlet
- [x] **S1-014** `frontend/src/pages/EventsPage.tsx` — Event list with pagination table
- [x] **S1-016** `frontend/src/components/events/EventFilters/` — Filter panel (week, location, category, status)
- [x] **S1-015** `frontend/src/components/events/EventForm/` — Create/edit form + draft auto-save (30s)
- [x] **S1-017** `frontend/src/` — Good/Bad classification badge in EventForm + EventList

---

## Sprint 1 Acceptance Criteria

- [ ] `mkdir -p data backups && docker-compose up` starts 2 containers (no PostgreSQL)
- [ ] SQLite `./data/isd_oms.db` auto-created on backend startup
- [ ] `GET /api/v1/health` → `{"status":"ok","db":"ok","version":"1.0.0"}`
- [ ] Login with admin/admin123 works
- [ ] Create event with all fields, appears in list
- [ ] Edit event — OCC version sent, 409 handled
- [ ] Event list shows with pagination
- [ ] Draft auto-saved every 30s, restored on form reopen
- [ ] Vietnamese UI (react-i18next), no hardcoded strings

---

## Sprint 2–4 (Planned — not started)

| Sprint | Focus | Key Tasks |
|--------|-------|-----------|
| Sprint 2 | Dashboard | KpiCard, TrendChart (ECharts), TimeRangeSelector, DetailTable |
| Sprint 3 | Reports + Export | WeeklyMatrix, KpiTrendTable, Puppeteer PDF, Excel export |
| Sprint 4 | Import + Polish | Excel import wizard, User/Category mgmt, E2E tests, Docker prod |

---

## Notes / Blockers

- **Phase 1+2 completed** (session 3). Backend fully scaffolded: 7-model Prisma schema, full CRUD API with OCC, SSE, JWT auth, draft auto-save, audit log, soft delete.
- **Phase 3 completed** (session 4). Frontend scaffolded: Vite + React 18 + TanStack Query + i18n + Zustand + RHF+Zod + Shadcn/ui. All pages and components created.
- **S1-018** (auth service unit tests) deferred to Sprint 2.
- **Categories in seed.ts** are placeholders — must be updated from `BS24_ISD_Operations_Template_2026.xlsx` sheet `03_DANH_MUC` before production.
- **docker-compose DATABASE_URL override**: Dev docker-compose sets `DATABASE_URL=file:/data/isd_oms.db` (absolute path inside container) to override the relative `.env` path.
- **To run locally (without Docker)**:
  ```bash
  # Backend
  cd backend && npm install
  cp .env.example .env   # then edit JWT_SECRET
  npx prisma migrate dev --name init
  npx prisma db seed
  npm run dev          # port 3001

  # Frontend (separate terminal)
  cd frontend && npm install
  npm run dev          # port 3000 (proxies /api -> 3001)
  ```
