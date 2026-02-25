# ISD-OMS — Implementation Progress

> **AI Agent:** Đọc file này đầu tiên mỗi session. Update checkbox khi hoàn thành task.
> **Docs:** `docs/04_Implementation_Plan.md` | **Agent rules:** `CLAUDE.md`, `backend/CLAUDE.md`, `frontend/CLAUDE.md`

---

## Current Status: Sprint 1 — COMPLETE ✅ (All AC passed)

**Completed:** Phase 1 ✅ | Phase 2 ✅ | Phase 3 ✅ | Acceptance Criteria ✅
**Next action:** Sprint 2 — Dashboard (KpiCard, TrendChart, TimeRangeSelector)

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

- [x] `mkdir -p data backups && docker-compose up` starts 2 containers (no PostgreSQL)
- [x] SQLite `./data/isd_oms.db` auto-created on backend startup
- [x] `GET /api/v1/health` → `{"status":"ok","db":"ok","version":"1.0.0"}`
- [x] Login with admin/admin123 works
- [x] Create event with all fields, appears in list
- [x] Edit event — OCC version sent, 409 handled
- [x] Event list shows with pagination
- [x] Draft auto-saved every 30s, restored on form reopen
- [x] Vietnamese UI (react-i18next), no hardcoded strings

---

## Sprint 2–4 (Planned — not started)

| Sprint | Focus | Key Tasks |
|--------|-------|-----------|
| Sprint 2 | Dashboard | KpiCard, TrendChart (ECharts), TimeRangeSelector, DetailTable |
| Sprint 3 | Reports + Export | WeeklyMatrix, KpiTrendTable, Puppeteer PDF, Excel export |
| Sprint 4 | Import + Polish | Excel import wizard, User/Category mgmt, E2E tests, Docker prod |

### Sprint 2 Execution Board (Ready for multi-AI)

Source playbook: `docs/05_SPRINT2_DASHBOARD_EXECUTION_PLAYBOOK.md`

#### WS-A Backend API (S2-001, S2-002, S2-016 backend part)
- [x] A1. Create `backend/src/routes/dashboard.routes.ts` with query validation.
- [x] A2. Create `backend/src/services/dashboard.service.ts` for KPI + status aggregation.
- [x] A3. Implement `GET /api/v1/dashboard/summary`.
- [x] A4. Implement `GET /api/v1/dashboard/chart`.
- [x] A5. Mount dashboard router in `backend/src/app.ts`.
- [x] A6. Add dashboard DTO types in `backend/src/types/index.ts`.

#### WS-B Frontend data hooks/types (S2-012 foundation)
- [x] B1. Add dashboard response types in `frontend/src/types/index.ts`.
- [x] B2. Add `frontend/src/hooks/useDashboard.ts` with summary/chart hooks.
- [x] B3. Wire query keys + SSE invalidation compatibility (`dashboard` prefix).
- [x] B4. Handle loading/empty/error states consistently for dashboard data.

#### WS-C Frontend dashboard UI (S2-003 → S2-014)
- [x] C1. Create `TimeRangeSelector` component (week/month/quarter/year + presets).
- [x] C2. Create `KpiCard` component with sparkline + delta badge.
- [x] C3. Create `TrendChart` component (ECharts stacked bar).
- [x] C4. Create `StatusDistribution` component.
- [x] C5. Create `DetailTable` component.
- [x] C6. Replace placeholder `frontend/src/pages/DashboardPage.tsx` with real grid layout.
- [x] C7. Implement KPI click drill-down behavior for detail table.
- [x] C8. Add skeleton loading states for all dashboard panels.
- [x] C9. Add/update dashboard i18n keys in `frontend/src/i18n/vi.json` and `frontend/src/i18n/en.json`.

#### WS-D Validation/performance/regression
- [ ] D1. Add backend integration tests for dashboard endpoints (`backend/tests/integration/dashboard.test.ts`).
- [x] D2. Verify Sprint 2 AC: KPI cards, stacked chart, status panel, time range sync, drill-down. ← **Verified ✅**
- [ ] D3. Verify performance target: dashboard update/render < 500ms for expected dataset.
- [ ] D4. Run regression checks for Sprint 1 core flows (auth + event CRUD + draft + SSE).

---

## Sprint 3 — Reports + Export (COMPLETE ✅)

### WS-E Backend Report APIs
- [x] E1. Add `getWeeklyMatrix()` to `dashboard.service.ts`.
- [x] E2. Add `getKpiTrend()` to `dashboard.service.ts`.
- [x] E3. Add `GET /api/v1/dashboard/weekly-matrix` route.
- [x] E4. Add `GET /api/v1/dashboard/kpi-trend` route.
- [x] E5. Create `backend/src/utils/excelHelper.ts` (buildXlsxBuffer, parseXlsxBuffer).
- [x] E6. Create `backend/src/utils/pdfGenerator.ts` (htmlToPdfBuffer via puppeteer-core).
- [x] E7. Create `backend/src/services/export.service.ts` (events xlsx + matrix xlsx/pdf).
- [x] E8. Create `backend/src/routes/export.routes.ts` (GET /export/events, GET /export/weekly-matrix).
- [x] E9. Mount exportRouter in `backend/src/app.ts`.

### WS-F Frontend Reports UI
- [x] F1. Add `WeeklyMatrixData`, `KpiTrendData` types to `frontend/src/types/index.ts`.
- [x] F2. Create `frontend/src/hooks/useReports.ts` (useWeeklyMatrix, useKpiTrend).
- [x] F3. Create `WeeklyMatrix` component (sticky table, color-coded Bad/Good headers).
- [x] F4. Create `KpiTrendTable` component (all periods, highlight current, red alert cells).
- [x] F5. Create `ExportButton` component (DropdownMenu PDF/Excel).
- [x] F6. Create `frontend/src/components/ui/tabs.tsx` (Shadcn Tabs).
- [x] F7. Rebuild `frontend/src/pages/ReportsPage.tsx` with Matrix + KpiTrend tabs.
- [x] F8. Add `reports.*` i18n keys to vi.json + en.json.

---

## Sprint 4 — Import + Admin (COMPLETE ✅)

### WS-G Backend Import + User APIs
- [x] G1. Create `backend/src/services/import.service.ts` (preview + execute, duplicate detection).
- [x] G2. Create `backend/src/routes/import.routes.ts` (POST /import/excel with express.raw).
- [x] G3. Create `backend/src/services/user.service.ts` (list/create/update/resetPassword, bcrypt 12).
- [x] G4. Create `backend/src/routes/user.routes.ts` (Admin-only CRUD).
- [x] G5. Mount importRouter + userRouter in `backend/src/app.ts`.
- [x] G6. Add Sprint 3/4 DTO types to `backend/src/types/index.ts`.

### WS-H Frontend Admin UI
- [x] H1. Add `ImportPreviewData`, `ImportExecuteData`, `UserDto`, etc. to `frontend/src/types/index.ts`.
- [x] H2. Create `frontend/src/hooks/useAdmin.ts` (categories/locations/users/import hooks).
- [x] H3. Create `CategoryTable` component (CRUD via Dialog).
- [x] H4. Create `LocationTable` component (CRUD via Dialog).
- [x] H5. Create `UserTable` component (CRUD + reset password).
- [x] H6. Create `ImportWizard` component (3-step: Upload → Preview → Execute).
- [x] H7. Create `frontend/src/components/ui/dialog.tsx` (Shadcn Dialog).
- [x] H8. Create `frontend/src/components/ui/dropdown-menu.tsx` (Shadcn DropdownMenu).
- [x] H9. Rebuild `frontend/src/pages/AdminPage.tsx` with 4-tab layout.
- [x] H10. Add `admin.*`, `import.*` i18n keys to vi.json + en.json.

---

## Notes / Blockers

- **Sprint 1 COMPLETE** — All 9 acceptance criteria verified via Docker (`docker-compose up`).
- **Bugs fixed during verification**: (1) Prisma on Alpine needs `openssl` apk package; (2) SQLite PRAGMAs must use `$queryRawUnsafe` not `$executeRawUnsafe`; (3) `npm ci` → `npm install` (no lockfiles); (4) Vite proxy uses `BACKEND_URL` env var for Docker networking.
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
