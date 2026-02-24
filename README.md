# ISD Operations Management System (ISD-OMS)

Hệ thống quản lý vận hành IT nội bộ, thay thế file Excel hiện tại bằng web application với dashboard tương tác chất lượng cao.

## Quick Links

- [Master Project Overview](docs/00_MASTER_PROJECT_OVERVIEW.md)
- [Business Requirements (BRD)](docs/01_BRD_Business_Requirements_Document.md)
- [Product Requirements (PRD)](docs/02_PRD_Product_Requirements_Document.md)
- [Software Requirements (SRS)](docs/03_SRS_Software_Requirements_Specification.md)
- [Implementation Plan](docs/04_Implementation_Plan.md)

## Project Overview

**ISD-OMS** thay thế file `BS24_ISD_Operations_Template_2026.xlsx` với các tính năng:

- **Event Management**: CRUD operations cho events/incidents
- **Interactive Dashboard**: KPI cards, charts, status distribution (như Tableau)
- **Weekly Matrix Report**: Tương đương sheet 04_BAO_CAO_TUAN
- **KPI Trend Table**: Tương đương sheet 99_KPI_TUAN
- **Import/Export**: Excel import và PDF/Excel export
- **User Management**: Role-based access control

## Current Repository Status

Phiên bản repository hiện tại là **gói tài liệu phân tích/thiết kế**:
- Có sẵn: BRD, PRD, SRS, Implementation Plan, file Excel nguồn
- Chưa có mã nguồn `frontend/`, `backend/`, `docker-compose.yml`

Khi bắt đầu implementation, cấu trúc code sẽ theo `docs/04_Implementation_Plan.md`.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Shadcn/ui + Apache ECharts + React Hook Form + TanStack Query + react-i18next |
| Backend | Node.js + Express + Prisma + Puppeteer |
| Database | SQLite 3 (WAL mode, file-based) |
| Infrastructure | Docker + Nginx |

## Dashboard Reference

Visual quality target: [Tableau Customer Support Case Demo](https://public.tableau.com/app/profile/ellen4268/viz/CustomerSupportCaseDemo/CustomerSupportCases)

## Documentation Structure

```
docs/
├── 00_MASTER_PROJECT_OVERVIEW.md   # Tổng quan dự án
├── 01_BRD_Business_Requirements_Document.md
├── 02_PRD_Product_Requirements_Document.md
├── 03_SRS_Software_Requirements_Specification.md
├── 04_Implementation_Plan.md
├── images/                          # Screenshots & diagrams
└── references/                      # Reference materials
```

## Source of Truth

> **Important:** File Excel `BS24_ISD_Operations_Template_2026.xlsx` là nguồn dữ liệu chuẩn cho:
> - Data model và column mapping
> - Category taxonomy (03_DANH_MUC)
> - Report layouts (04_BAO_CAO_TUAN, 99_KPI_TUAN)

## Development

```bash
# Start development environment
docker-compose up -d

# Access
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# Database: ./data/isd_oms.db (SQLite file, no separate service)

# Default users
# admin / admin123 (Admin)
# editor / editor123 (Editor)
# viewer / viewer123 (Viewer)
```

## Data Seed and Excel Import

Two backend data commands are now separated clearly:

- `seed` (bootstrap): seed week refs, masters, users, and import Excel events when file exists.
- `import` (excel only): re-import masters/events from Excel without touching users.

### Local (from `backend/`)

```bash
# Full bootstrap seed
npm run data:seed

# Excel import only
npm run data:import:excel
```

### Docker

```bash
# Full bootstrap seed
docker compose exec -T backend npm run data:seed

# Excel import only
docker compose exec -T backend npm run data:import:excel
```

Excel file default path:
- `BS24_ISD_Operations_Template_2026.xlsx` at repo root
- or override by env var `EXCEL_TEMPLATE_PATH`

## Sprint Plan

| Sprint | Focus | Duration |
|--------|-------|----------|
| Sprint 1 | Foundation (DB, Auth, CRUD) | 2 weeks |
| Sprint 2 | Dashboard | 2 weeks |
| Sprint 3 | Reports & Export | 2 weeks |
| Sprint 4 | Import & Polish | 2 weeks |

---

**Version:** 1.0 | **Date:** 23/02/2026 | **Team:** ISD Team
