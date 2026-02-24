# ISD-OMS — Implementation Progress

> **AI Agent:** Đọc file này đầu tiên mỗi session. Update checkbox khi hoàn thành task.
> **Docs:** `docs/04_Implementation_Plan.md` | **Agent rules:** `CLAUDE.md`, `backend/CLAUDE.md`, `frontend/CLAUDE.md`

---

## Current Status: Sprint 1 — NOT STARTED

**Next action:** Start with [Phase 1: Project Scaffold](#phase-1-project-scaffold--s1-001--s1-006)

---

## Phase 1: Project Scaffold (S1-001 – S1-006)

_Backend foundation — do these first, in order._

- [ ] **S1-001** `backend/` — Init Node.js + TypeScript project (`npm init`, `tsconfig.json`, `eslint`)
- [ ] **S1-002** `backend/` — Install Express + Prisma + dependencies (see `backend/CLAUDE.md` for full list)
- [ ] **S1-003** `backend/prisma/schema.prisma` — Define full schema (Event, User, WeekReference, LocationMaster, CategoryMaster, AuditLog, EventDraft)
- [ ] **S1-004** `backend/src/config/database.ts` — Prisma client + SQLite WAL PRAGMAs
- [ ] **S1-005** `backend/prisma/seed.ts` — Seed users (admin/editor/viewer) + locations (KDAMB, KDAMN, Offshore, HO) + categories
- [ ] **S1-006** `docker-compose.yml` + `docker-compose.prod.yml` — 2 containers: frontend + backend (no DB service)

---

## Phase 2: Backend Auth + Events API (S1-007 – S1-010, S1-018, S1-022)

- [ ] **S1-007** `backend/src/middleware/auth.ts` + `rbac.ts` — JWT auth middleware + `requireRole()`
- [ ] **S1-008** `backend/src/routes/auth.routes.ts` — POST /login, POST /logout, GET /me
- [ ] **S1-009** `backend/src/routes/event.routes.ts` — Full CRUD: GET/POST/PUT(OCC)/DELETE + soft delete
- [ ] **S1-010** `backend/src/routes/health.routes.ts` — GET /api/v1/health (no auth)
- [ ] **S1-018** `backend/src/services/auth.service.ts` — Unit tests (Jest)
- [ ] **S1-022** `backend/src/routes/event.routes.ts` (draft endpoints) + `event_drafts` table migration — POST/GET /api/v1/events/draft

---

## Phase 3: Frontend Scaffold (S1-011 – S1-021)

_Start after Phase 1 backend is running._

- [ ] **S1-011** `frontend/` — Init Vite + React 18 + TypeScript; install all deps; configure Shadcn/ui
- [ ] **S1-019** `frontend/src/main.tsx` — Setup TanStack Query (`QueryClient`, `QueryClientProvider`, devtools)
- [ ] **S1-020** `frontend/src/` — Setup React Hook Form + Zod (EventForm schema, LoginForm schema)
- [ ] **S1-021** `frontend/src/i18n/` — Setup react-i18next (`i18n.ts`, `vi.json`, `en.json` with initial keys)
- [ ] **S1-012** `frontend/src/pages/LoginPage.tsx` — Login form with RHF + Zod + auth mutation
- [ ] **S1-013** `frontend/src/components/shared/Layout/` — Main layout: sidebar + header + outlet
- [ ] **S1-014** `frontend/src/pages/EventsPage.tsx` — Event list with pagination table
- [ ] **S1-016** `frontend/src/components/events/EventFilters/` — Filter panel (week, location, category, status)
- [ ] **S1-015** `frontend/src/components/events/EventForm/` — Create/edit form + draft auto-save (30s)
- [ ] **S1-017** `frontend/src/` — Good/Bad classification badge in EventForm + EventList

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

_Add session notes here as work progresses._

- (empty)
