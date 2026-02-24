# ISD OPERATIONS MANAGEMENT SYSTEM (ISD-OMS)
# MASTER PROJECT DOCUMENTATION

---

| **Phiên bản** | **Ngày** | **Tác giả** |
|---------------|----------|-------------|
| v1.0 | 23/02/2026 | ISD Team |

---

## PROJECT SUMMARY

**ISD-OMS** là một web application nội bộ được thiết kế để thay thế hoàn toàn file Excel `BS24_ISD_Operations_Template_2026.xlsx` hiện đang được sử dụng để quản lý hoạt động vận hành IT.

### Mission Statement

> Xây dựng một web application cấp production để quản lý vận hành IT, cung cấp dashboard tương tác chất lượng cao tương đương Tableau, phục vụ đội ngũ IT Operations (~10-50 users) tại Việt Nam.

---

## CONTEXT & ASSETS

### 1. Excel Template (Source of Truth)

**File:** `BS24_ISD_Operations_Template_2026.xlsx`

| Sheet | Mục đích | Mapping |
|-------|----------|---------|
| 02_NHAT_KY | Flat-table log (1 row = 1 event/task) | → Events table |
| 03_DANH_MUC | Reference/dropdown master data | → Category Master |
| 04_BAO_CAO_TUAN | Weekly report matrix | → Weekly Matrix Report |
| 99_KPI_TUAN | Weekly KPI aggregation | → KPI Trend Table |
| 01_DASHBOARD | Summary dashboard | → Dashboard Module |

### 2. Dashboard Reference

**Tableau Customer Support Case Demo:**
- **URL:** https://public.tableau.com/app/profile/ellen4268/viz/CustomerSupportCaseDemo/CustomerSupportCases
- **Mô tả tham chiếu:** [docs/references/dashboard_reference.md](references/dashboard_reference.md)

*Mô tả layout và interaction pattern được lưu tại `docs/references/dashboard_reference.md`*

**Visual Elements cần replicate:**

| Component | Vị trí | Mô tả |
|-----------|--------|-------|
| KPI Cards | Top-left | Cards với open count, total, sparkline, delta badge |
| Stacked Bar Chart | Top-right | Events by week × category |
| Status Distribution | Center | Breakdown by severity với progress bars |
| Detail Table | Bottom | Sortable table với severity badges |
| Week Selector | Header | Drives all views |

---

## DELIVERABLES

### Documentation Suite

| # | Document | File | Mục đích |
|---|----------|------|----------|
| 1 | **BRD** | [01_BRD_Business_Requirements_Document.md](01_BRD_Business_Requirements_Document.md) | Business requirements, stakeholders, constraints |
| 2 | **PRD** | [02_PRD_Product_Requirements_Document.md](02_PRD_Product_Requirements_Document.md) | User stories, features, data model, UI specs |
| 3 | **SRS** | [03_SRS_Software_Requirements_Specification.md](03_SRS_Software_Requirements_Specification.md) | Technical specs, API, database schema |
| 4 | **Implementation Plan** | [04_Implementation_Plan.md](04_Implementation_Plan.md) | Sprint plan, Docker setup, code structure |

### Requirement IDs Reference

| Prefix | Document | Example |
|--------|----------|---------|
| BR-### | Business Requirements | BR-001: Single Data Entry Point |
| US-### | User Stories | US-005: View KPI Cards |
| FR-### | Functional Requirements | FR-002: Dashboard Module |
| NFR-### | Non-Functional Requirements | NFR-P01: Dashboard load < 3s |

---

## KEY SPECIFICATIONS

### Data Model (Entities)

| Entity | Description | Primary Key |
|--------|-------------|-------------|
| **events** | Main data table (từ 02_NHAT_KY) | UUID |
| **week_references** | Week lookup (W01-W53) | week_code |
| **category_master** | Category taxonomy | (main_group, category) |
| **users** | User accounts | UUID |
| **audit_log** | Change tracking | SERIAL |

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Shadcn/ui + Apache ECharts + React Hook Form + TanStack Query + react-i18next |
| **Backend** | Node.js + Express + Prisma + Puppeteer |
| **Database** | SQLite 3 (WAL mode, file-based) |
| **Infrastructure** | Docker + Nginx |

### Category Taxonomy (từ 03_DANH_MUC)

```
Ổn định hệ thống
├── Sự cố/Lỗi (bad_news) 🔴
├── Downtime (bad_news) 🔴
├── Cải thiện (good_news) 🟢
└── Bảo trì (neutral) 🔵

An toàn thông tin
├── Mối đe dọa (bad_news) 🔴
├── Cải thiện bảo mật (good_news) 🟢
└── Audit/Compliance (neutral) 🔵

Tối ưu hóa
├── Automation (good_news) 🟢
├── Performance tuning (good_news) 🟢
└── Cost optimization (good_news) 🟢

Biến động nhân sự
├── Onboarding (neutral) 🔵
├── Offboarding (neutral) 🔵
└── Training (good_news) 🟢

Dự án
├── Triển khai mới/Mở rộng (good_news) 🟢
├── POC/Pilot (neutral) 🔵
└── Project milestone (good_news) 🟢
```

### Color Palette

| Usage | Hex Code | Usage |
|-------|----------|-------|
| Bad News (Primary) | #C00000 | Severe incidents |
| Bad News (Light) | #FF9999 | Medium severity |
| Good News (Primary) | #375623 | Major achievements |
| Good News (Light) | #AADEAA | Minor positive |
| Neutral (Primary) | #1F4E79 | Headers, primary |
| Neutral (Light) | #BDD7EE | Subtle elements |
| Background | #F5F8FC | Main app background |

---

## SPRINT OVERVIEW

| Sprint | Weeks | Focus | Key Deliverables |
|--------|-------|-------|------------------|
| **Sprint 1** | 1-2 | Foundation | DB, Auth, Event CRUD, Event List UI |
| **Sprint 2** | 3-4 | Dashboard | KPI Cards, Charts, Week Selector |
| **Sprint 3** | 5-6 | Reports | Weekly Matrix, KPI Trend, Exports |
| **Sprint 4** | 7-8 | Polish | Import Wizard, Admin UI, Deploy |

---

## TRACEABILITY MATRIX

### BR → US → FR → Test Case

| Business Req | User Story | Feature | Functional Req | Test Cases |
|--------------|------------|---------|----------------|------------|
| BR-001 | US-001, US-002, US-003, US-004 | F01, F02 | FR-001 | TC-001 to TC-010 |
| BR-003 | US-005, US-006, US-008 | F05, F06, F07 | FR-002 | TC-031 to TC-050 |
| BR-004 | US-009 | F10 | FR-003 | TC-051 to TC-060 |
| BR-006 | US-010, US-014 | F12, F13 | FR-006 | TC-061 to TC-070 |
| BR-010 | US-013 | F14 | FR-008 | TC-071 to TC-085 |

---

## QUICK START

### Prerequisites

- Docker 24.x
- docker-compose 2.x
- Node.js 20.x (for local development)

### Development Setup

```bash
# Clone and start
git clone <repo-url>
cd isd-oms
mkdir -p data backups
docker-compose up -d

# Access
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# Database: ./data/isd_oms.db (SQLite file, không cần service riêng)

# Default login
# Admin: admin / admin123
# Editor: editor / editor123
# Viewer: viewer / viewer123
```

### Production Deployment

```bash
# Setup environment
cp .env.example .env
# Edit .env with production values (JWT_SECRET, etc.)

# Tạo thư mục chứa SQLite DB và backup
mkdir -p data backups

# Build and deploy
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations (tự tạo SQLite file nếu chưa có)
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Seed data (lần đầu tiên)
docker-compose -f docker-compose.prod.yml exec backend npx prisma db seed
```

---

## IMPORTANT NOTES

### Excel File is Source of Truth

> **CRITICAL:** Khi implement, luôn tham chiếu Excel file `BS24_ISD_Operations_Template_2026.xlsx` để đảm bảo:
> - Column mapping chính xác (02_NHAT_KY columns B-W)
> - Category taxonomy đúng (03_DANH_MUC)
> - Weekly matrix layout match (04_BAO_CAO_TUAN)

### Dashboard Quality Standard

Dashboard phải đạt chất lượng visual tương đương Tableau Customer Support Case Demo:
- Smooth animations
- Professional color scheme
- Clear data visualization
- Responsive interactions

### Vietnamese Language UI

- Tất cả labels, messages, error texts bằng tiếng Việt
- Date format: DD/MM/YYYY
- Number format: Vietnamese locale (dấu . ngăn cách hàng nghìn)

---

## DOCUMENT REVISION HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| v1.0 | 23/02/2026 | ISD Team | Initial release - Full documentation suite |

---

## APPROVAL SIGNATURES

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | _______________ | _______________ | ___/___/___ |
| Tech Lead | _______________ | _______________ | ___/___/___ |
| IT Manager | _______________ | _______________ | ___/___/___ |

---

*End of Master Project Overview*
