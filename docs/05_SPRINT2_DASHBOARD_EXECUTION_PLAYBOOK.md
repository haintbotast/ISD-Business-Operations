# SPRINT 2 EXECUTION PLAYBOOK
# ISD-OMS Dashboard (Week 3-4)

---

## 1. Objective

Deliver Sprint 2 dashboard scope from `docs/04_Implementation_Plan.md` with production-ready APIs and UI:
- 5 KPI cards with sparkline + delta
- Stacked trend chart by category
- Status distribution panel
- Time range selector (week/month/quarter/year)
- Detail table + drill-down from KPI cards

This playbook is designed for parallel execution by multiple AI assistants.

---

## 2. Current Snapshot (Verified)

### 2.1 Implemented
- Sprint 1 foundation is complete (`TODO.md`).
- Auth + events CRUD + SSE exist.
- `frontend/src/pages/DashboardPage.tsx` is still placeholder.
- No dashboard backend route/service exists yet.
- `frontend/src/store/uiStore.ts` already has time-range state (`granularity`, `year`, `periodStart`, `periodEnd`).

### 2.2 Constraints to keep
- Stack: React + TS + TanStack Query + ECharts + Express + Prisma + SQLite.
- Keep OCC/SSE behaviors intact.
- All API/business endpoints must remain behind auth.
- Follow i18n (`t('...')`) for new UI text.

---

## 3. Working Agreements (For Multi-AI Collaboration)

1. Do not change Sprint 1 behavior or existing endpoint contracts unless explicitly listed below.
2. Use small, scoped PRs per workstream.
3. Merge order:
   1. Backend contracts
   2. Frontend data hook + type integration
   3. Dashboard components and page layout
   4. Integration tests and perf tuning
4. Each PR must include:
   - Changed files list
   - Test evidence (command + output summary)
   - Remaining risks / TODO

---

## 4. API Contract for Sprint 2 (Freeze First)

## 4.1 GET `/api/v1/dashboard/summary`

### Query params
- `granularity`: `week | month | quarter | year`
- `year`: number (required)
- `periodStart`: string (required)
- `periodEnd`: string (required)
- `locationCode`: string (optional)
- `metricFilter`: `all | open | severe | downtime | closure` (optional, default `all`)

### Response shape
```json
{
  "success": true,
  "data": {
    "kpis": {
      "totalEvents": { "value": 45, "deltaPct": 18.4, "sparkline": [12, 14, 10, 9, 15, 18, 12, 20, 19, 22, 17, 45] },
      "downtimeMinutes": { "value": 180, "deltaPct": -5.2, "sparkline": [30, 28, 22, 17, 40, 10, 12, 15, 9, 7, 5, 180] },
      "closureRate": { "value": 78.5, "deltaPct": 3.1, "sparkline": [60, 62, 58, 70, 73, 74, 69, 76, 77, 79, 80, 78.5] },
      "severeIncidents": { "value": 3, "deltaPct": 50.0, "sparkline": [0, 1, 0, 2, 1, 0, 1, 2, 1, 0, 2, 3] },
      "openInProgress": { "value": 12, "deltaPct": 9.0, "sparkline": [8, 7, 9, 8, 10, 9, 11, 10, 12, 11, 10, 12] }
    },
    "statusDistribution": {
      "all": { "count": 541, "pct": 100 },
      "low": { "count": 310, "pct": 57.3, "open": 30, "closed": 280 },
      "medium": { "count": 108, "pct": 20.0, "open": 20, "closed": 88 },
      "high": { "count": 92, "pct": 17.0, "open": 15, "closed": 77 },
      "critical": { "count": 31, "pct": 5.7, "open": 5, "closed": 26 }
    },
    "detailRows": [
      {
        "id": "evt_001",
        "date": "2026-01-15T00:00:00.000Z",
        "weekCode": "W03",
        "locationCode": "KDAMB",
        "systemComponent": "Database",
        "description": "Database connection pool exhausted",
        "severity": "Critical",
        "status": "Open",
        "daysOpen": 12
      }
    ]
  }
}
```

## 4.2 GET `/api/v1/dashboard/chart`

### Query params
- same as `/dashboard/summary` minus `metricFilter`

### Response shape
```json
{
  "success": true,
  "data": {
    "xAxis": ["W01", "W02", "W03", "W04"],
    "series": [
      { "name": "Sự cố/Lỗi", "classification": "Bad", "data": [5, 3, 7, 4] },
      { "name": "Downtime", "classification": "Bad", "data": [1, 2, 1, 3] },
      { "name": "Cải thiện", "classification": "Good", "data": [2, 4, 3, 5] }
    ]
  }
}
```

---

## 5. Workstream Split (Parallel-Friendly)

## 5.1 WS-A Backend (API + Aggregation)

### Files
- `backend/src/routes/dashboard.routes.ts` (new)
- `backend/src/services/dashboard.service.ts` (new)
- `backend/src/app.ts` (mount new route)
- `backend/src/types/index.ts` (dashboard DTOs)
- optional: `backend/src/services/event.service.ts` (only if shared helpers needed)

### Checklist
- [ ] A1. Create dashboard route with Zod validation for query params.
- [ ] A2. Implement summary aggregation in service (kpis, status distribution, detail rows).
- [ ] A3. Implement chart aggregation grouped by period + category.
- [ ] A4. Add metric filter behavior for detail table drill-down.
- [ ] A5. Add period label utilities for week/month/quarter/year.
- [ ] A6. Return API errors in standard shape (`success=false, code, message`).
- [ ] A7. Add indexes review for query performance (if needed).

### Done criteria
- [ ] `/dashboard/summary` returns contract-compliant data for all granularities.
- [ ] `/dashboard/chart` returns deterministic xAxis + stacked series.
- [ ] p95 summary response < 500ms on seeded dataset.

---

## 5.2 WS-B Frontend Data Layer (Hooks + Types + API wrappers)

### Files
- `frontend/src/types/index.ts` (add dashboard types)
- `frontend/src/lib/api.ts` (no contract break)
- `frontend/src/hooks/useDashboard.ts` (new)
- `frontend/src/store/uiStore.ts` (reuse; only minimal extension if needed)

### Checklist
- [ ] B1. Define TypeScript interfaces for summary/chart payload.
- [ ] B2. Create `useDashboardSummary(params)` and `useDashboardChart(params)` hooks.
- [ ] B3. Build stable query keys from time range + filters.
- [ ] B4. Add memoized selector for `detailRows` derived data (sorting/pagination client-side if required).
- [ ] B5. Add graceful empty/loading/error mapping for dashboard consumers.

### Done criteria
- [ ] Hooks are fully typed; no `any`.
- [ ] Query invalidation from SSE keeps dashboard fresh (`queryKey` starts with `dashboard`).

---

## 5.3 WS-C Frontend UI Components (Dashboard)

### Files (new)
- `frontend/src/components/dashboard/TimeRangeSelector/TimeRangeSelector.tsx`
- `frontend/src/components/dashboard/KpiCard/KpiCard.tsx`
- `frontend/src/components/dashboard/TrendChart/TrendChart.tsx`
- `frontend/src/components/dashboard/StatusDistribution/StatusDistribution.tsx`
- `frontend/src/components/dashboard/DetailTable/DetailTable.tsx`
- `frontend/src/components/dashboard/*/index.ts`
- update `frontend/src/pages/DashboardPage.tsx`
- update `frontend/src/i18n/vi.json` + `frontend/src/i18n/en.json`

### Checklist
- [ ] C1. TimeRangeSelector supports week/month/quarter/year + presets.
- [ ] C2. KPI cards render value + delta + sparkline (12 points).
- [ ] C3. Trend chart uses ECharts stacked bar with category legend and tooltip.
- [ ] C4. Status panel renders all/low/medium/high/critical with open/closed splits.
- [ ] C5. Detail table renders event rows, default sort by `daysOpen` desc.
- [ ] C6. KPI card click sets `metricFilter` and refreshes detail table.
- [ ] C7. Dashboard page composes all panels in responsive grid.
- [ ] C8. Loading skeletons and empty states for all panels.
- [ ] C9. All new labels via i18n keys.

### Done criteria
- [ ] Dashboard UI matches Sprint 2 acceptance criteria in `docs/04_Implementation_Plan.md`.
- [ ] No hardcoded Vietnamese strings in new components.

---

## 5.4 WS-D Integration, Testing, Performance

### Files
- `backend/tests/integration/dashboard.test.ts` (new)
- `frontend/src/pages/DashboardPage.tsx` (perf refinements)
- optional: helper test data seed file

### Checklist
- [ ] D1. Add backend integration tests for summary/chart happy path.
- [ ] D2. Add tests for invalid query params (400) and unauthorized (401).
- [ ] D3. Add smoke test for metric drill-down behavior.
- [ ] D4. Verify chart render under target threshold (< 500ms perceived update).
- [ ] D5. Run full test + typecheck for frontend/backend.

### Done criteria
- [ ] `backend` test suite includes dashboard endpoint coverage.
- [ ] `npm run typecheck` passes both apps.
- [ ] Manual smoke checks pass in Docker.

---

## 6. Suggested Task Assignment Matrix

| Track | Primary AI | Parallel-safe? | Depends on |
|------|------------|----------------|------------|
| WS-A Backend API | AI-1 | Yes | none |
| WS-B Frontend data hooks | AI-2 | Yes | WS-A contract freeze |
| WS-C UI components | AI-3 | Partial | WS-B hooks/types |
| WS-D Integration/perf | AI-4 | Partial | WS-A + WS-C |

---

## 7. Merge & Validation Sequence

1. Merge WS-A first (backend contract becomes source of truth).
2. Rebase WS-B and WS-C on WS-A.
3. Merge WS-C after UI smoke works on local Docker.
4. Merge WS-D last with tests/perf checks.
5. Final regression check:
   - auth/login/logout
   - events list/create/edit/delete still OK
   - dashboard end-to-end behavior OK

---

## 8. Sprint 2 Exit Checklist

- [ ] All S2 tasks S2-001..S2-016 are checked in `TODO.md`.
- [ ] All Sprint 2 acceptance criteria pass.
- [ ] No regression on Sprint 1 acceptance criteria.
- [ ] Updated docs for any contract changes.
- [ ] Ready to start Sprint 3 (Reports + Export).

---

*End of Sprint 2 Execution Playbook*
