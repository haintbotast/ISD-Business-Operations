# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
# ISD Operations Management System (ISD-OMS)

---

| **Phiên bản** | **Ngày** | **Tác giả** | **Ghi chú** |
|---------------|----------|-------------|-------------|
| v1.1 (minimum) | 23/02/2026 | ISD Team | Rút gọn theo phạm vi v1.0, giữ yêu cầu bắt buộc |

---

## 1. MỤC TIÊU VÀ PHẠM VI

### 1.1 Mục tiêu tài liệu
SRS này là bản **tối thiểu** để triển khai v1.0, tập trung vào:
- Yêu cầu chức năng bắt buộc
- Yêu cầu phi chức năng đo được
- Ràng buộc dữ liệu và API ở mức triển khai
- Traceability từ BRD sang kiểm thử

### 1.2 Phạm vi v1.0
Hệ thống ISD-OMS thay thế Excel `BS24_ISD_Operations_Template_2026.xlsx` cho:
- Ghi nhận và quản lý sự kiện vận hành IT (event)
- Dashboard KPI theo tuần
- Weekly Matrix Report và KPI Trend
- Import/Export Excel, Export PDF
- Xác thực, phân quyền, audit log

### 1.3 Ngoài phạm vi v1.0
- Mobile native app
- Notification service (push/email)
- Tích hợp API hệ thống ngoài

### 1.4 Tài liệu tham chiếu
- `docs/01_BRD_Business_Requirements_Document.md`
- `docs/02_PRD_Product_Requirements_Document.md`
- `docs/04_Implementation_Plan.md`
- `BS24_ISD_Operations_Template_2026.xlsx`

---

## 2. BỐI CẢNH HỆ THỐNG

### 2.1 Người dùng mục tiêu
- Ops Engineer (Editor)
- Team Lead (Editor)
- IT Manager (Viewer)
- IT Admin (Admin)

### 2.2 Quy mô và ràng buộc
- **< 20 người dùng đồng thời** (thực tế vận hành đội ISD)
- Triển khai mạng nội bộ (on-prem/private)
- Ngôn ngữ chính: tiếng Việt
- Dữ liệu nghiệp vụ lấy từ cấu trúc Excel hiện tại
- Lưu trữ dữ liệu khoảng 2-3 năm (~1,000-1,500 events + audit logs)

### 2.3 Kiến trúc triển khai (logical)
- Frontend: React 18 + TypeScript + Shadcn/ui
  - **Charts:** Apache ECharts (`echarts-for-react`) — canvas-based, enterprise-grade, hỗ trợ gradient/animation/sparkline
  - **Forms:** React Hook Form + Zod — validation schema, tích hợp sẵn với Shadcn/ui
  - **Server state:** TanStack Query — caching, background refetch, invalidation khi nhận SSE event
  - **i18n:** `react-i18next` — tiếng Việt mặc định (`vi.json`), tiếng Anh tùy chọn (`en.json`)
- Backend: Node.js + Express + Prisma
  - **PDF:** Puppeteer (headless Chromium) — pixel-perfect A3 landscape, render từ HTML template
  - **Real-time:** Server-Sent Events (SSE) — notify clients khi data thay đổi
- Database mục tiêu: **SQLite 3** (WAL mode, file-based, không cần server riêng)
- Đóng gói: Docker

> **Lý do chọn SQLite:** Quy mô < 20 concurrent users và ~1,500 records/2-3 năm phù hợp với SQLite. Giảm thiểu hạ tầng (không cần PostgreSQL container, không cần DBA). Backup đơn giản bằng cách copy file `.db`. Có thể migrate sang PostgreSQL sau này chỉ bằng cách đổi `provider` trong Prisma schema mà không cần rewrite code.

> **SQLite WAL Mode:** Thay thế cho ý tưởng "in-memory + periodic flush". WAL mode ghi data xuống WAL file ngay sau mỗi commit (an toàn, không mất data), sau đó tự động checkpoint vào DB chính. Không có risk mất data như in-memory approach.

> **Conflict Prevention (3 lớp):**
> 1. **SQLite layer:** WAL mode + `busy_timeout=5000ms` serializes concurrent writes — nếu 2 users write cùng lúc, SQLite tự retry/queue (không crash).
> 2. **Application layer (OCC):** Cột `version INTEGER` trên bảng `events` tăng dần. Server dùng `UPDATE ... WHERE id=? AND version=?` để detect lost update — nếu 0 rows updated → trả HTTP 409 conflict.
> 3. **UX layer (SSE):** Client subscribe SSE stream để nhận notification khi event thay đổi. TanStack Query invalidate cache → danh sách tự refresh. User đang edit form nhận cảnh báo "Record này vừa được cập nhật bởi người khác."
>
> **Tại sao không dùng WebSocket full-duplex?** Với < 20 users và CRUD đơn giản (không có collaborative editing), SSE (one-way server-to-client push) là đủ. WebSocket thêm complexity không cần thiết cho use case này.

---

## 3. YÊU CẦU CHỨC NĂNG TỐI THIỂU (FR)

| ID | Yêu cầu | Priority | Nguồn BR | Tiêu chí chấp nhận tối thiểu |
|----|---------|----------|----------|-------------------------------|
| FR-001 | Event CRUD đầy đủ field theo 02_NHAT_KY, validation bắt buộc, **auto-save draft 30 giây qua server-side API** (`POST /api/v1/events/draft`), soft delete | Must | BR-001 | Tạo/sửa/xóa mềm thành công; kiểm tra week-date hợp lệ; auto-save mỗi 30s gọi draft API; hiển thị ngay trên danh sách |
| FR-002 | Auto-aggregation theo tuần/địa điểm/main_group/category, cập nhật khi có dữ liệu mới | Must | BR-002 | Kết quả tổng hợp khớp logic Excel đã duyệt; hỗ trợ lọc đa chiều |
| FR-003 | Dashboard gồm 5 KPI cards, trend chart, status distribution, detail table drill-down | Must | BR-003 | Dashboard phản hồi theo bộ lọc tuần; click KPI/biểu đồ lọc đúng detail |
| FR-004 | **Time range selector** với granularity tuần/tháng/quý/năm điều khiển đồng bộ toàn bộ dashboard/report view | Must | BR-009 | Đổi granularity hoặc period làm toàn bộ panel cập nhật đồng bộ; aggregation query thay đổi theo granularity |
| FR-005 | Weekly Matrix Report tương đương 04_BAO_CAO_TUAN | Must | BR-004 | Row theo location, column theo category, header có badge count, cell là bullet descriptions |
| FR-006 | KPI Trend Table theo tuần W01-W53 cho năm chọn | Must | BR-003 | Hiển thị đầy đủ chỉ số KPI theo từng tuần, có highlight tuần hiện tại |
| FR-007 | Import dữ liệu Excel lịch sử với preview, kiểm tra lỗi, xử lý duplicate | Must | BR-010 | Upload xlsx, preview 20 dòng, duplicate action (skip/replace), trả summary import |
| FR-008 | Export PDF (weekly matrix) và Excel (event list/kpi trend) | Must | BR-006 | Tệp tải được, đúng định dạng cột/yêu cầu hiển thị, thời gian xuất trong ngưỡng NFR |
| FR-009 | Auth + RBAC (Admin/Editor/Viewer) + audit log 100% thay đổi dữ liệu nghiệp vụ | Must | BR-007, OBJ-005 | Chặn truy cập trái quyền; mọi thao tác create/update/delete event có bản ghi audit |
| FR-010 | Quản lý master data tối thiểu: category + location | Must | BR-005, BR-008 | Admin cập nhật danh mục/location; thay đổi phản ánh ở form/filter |
| FR-011 | **Flexible field management**: Admin định nghĩa custom fields (key, label, type, options, required, sort_order); events lưu custom values dưới dạng JSON trong cột `extra_fields`; field_key immutable sau khi tạo; deactivate thay vì xóa | **Should (v1.1)** | BR-011 | Custom fields hiện trên form/list; validation theo field_type; không mất data khi deactivate — **DEFER sang v1.1 để đảm bảo go-live v1.0** |
| FR-012 | **Risk Matrix** (JIS Q 31000:2019): Tính Impact × Likelihood per category từ sự kiện Bad; hiển thị bubble chart ECharts với bong bóng = dominantScope; 4 mức rủi ro: Low/Medium/High/Critical theo JIS Z 9103:2018 color. API: `GET /api/v1/reports/risk-matrix?year&weekCode` hoặc `?year&periodStart&periodEnd` | **Must (v1.0 Sprint 5)** | — | Risk Matrix trả đúng riskScore = impact × likelihood; bubble chart hiển thị màu JIS; detail table dưới chart |
| FR-013 | **Pareto Analysis** (JIS Z 8115): Đếm sự kiện theo category (tất cả: Bad + Good), sort desc, tính cumulative %; Bar+Line combo chart với markLine 80%. API: `GET /api/v1/reports/pareto?year&periodStart&periodEnd` | **Must (v1.0 Sprint 5)** | — | Pareto chart có markLine 80%; tổng cumulative cuối = 100%; top 80% được highlight; Good/Bad bar màu khác nhau |

### 3.1 Quy tắc nghiệp vụ bắt buộc
1. `date` phải thuộc `week` đã chọn.
2. `classification` mặc định theo category, nhưng cho phép override.
3. Duplicate import tối thiểu kiểm tra theo `(year, week, location, description)`.
4. Xóa event là soft delete (`deleted_at`), không xóa cứng.
5. Toàn bộ thao tác CRUD event phải ghi `audit_log`.

---

## 4. YÊU CẦU DỮ LIỆU TỐI THIỂU

### 4.1 Thực thể cốt lõi (v1.0)
- `events` (cột `version INTEGER DEFAULT 1` cho OCC; cột `impact_scope TEXT DEFAULT 'Site'` cho FR-012; cột `extra_fields TEXT/JSON` được thêm ở v1.1)
- `users`
- `category_master`
- `location_master` (Admin thêm/sửa location; seed: KDAMB, KDAMN, Offshore, HO)
- `week_references` (PK composite: `(year, week_code)`)
- `audit_log`
- `event_drafts` (server-side auto-save drafts — FR-001)
- `field_definitions` — **[v1.1]** registry cho custom fields (BR-011)

### 4.2 Ràng buộc dữ liệu
1. `week_references` phải định danh theo `(year, week_code)` để tránh trùng nhiều năm.
2. `events` phải tham chiếu `week_references` theo cặp `(year, week_code)`.
3. `location` không hard-code bằng enum cố định nếu yêu cầu có thêm/sửa location.
4. `category_master` unique theo `(main_group, category)`.
5. `audit_log` lưu được user, action, old_values, new_values, timestamp.
6. **[v1.1]** `field_definitions.field_key` là **immutable** sau khi tạo (dùng làm khóa trong `extra_fields` JSON của events).
7. **[v1.1]** `events.extra_fields` phải được validate theo `field_definitions` hiện hành: kiểu dữ liệu, required, options hợp lệ — tại application layer.
8. Dashboard aggregation API phải nhận tham số `granularity` (`week|month|quarter|year`) và `period_start`, `period_end` thay vì chỉ `week` param.
9. `event_drafts` lưu per-user (`user_id + event_id` hoặc `user_id + 'new'`), ghi đè liên tục — không phải audit entity, TTL 24 giờ.

### 4.3 Mapping tối thiểu từ Excel 02_NHAT_KY
- B: `week`
- C: `date`
- D: `location`
- E: `main_group`
- F: `category`
- G: `system_component`
- H: `customer_tenant`
- I: `severity`
- J: `status`
- K: `assignee`
- L: `openproject_id`
- M: `description`
- N: `downtime_minutes`
- O: `classification`
- P/Q: `created_at`/`updated_at` (nếu có)

---

## 5. API CONTRACT TỐI THIỂU

### 5.0 System
- `GET /api/v1/health` — health check, **không cần auth**; response: `{"status":"ok","db":"ok","version":"1.0.0"}`

### 5.1 Auth
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

### 5.2 Events
- `GET /api/v1/events`
- `POST /api/v1/events`
- `PUT /api/v1/events/:id` — body phải có `version` (OCC); trả 409 nếu version mismatch
- `DELETE /api/v1/events/:id`
- `GET /api/v1/events/stream` — SSE endpoint; `Content-Type: text/event-stream`; broadcast khi create/update/delete event
- `POST /api/v1/events/draft` — auto-save draft (FR-001); body: `{event_id?: string, form_data: object}`; upsert per user
- `GET /api/v1/events/draft?event_id=xxx` — khôi phục draft khi mở form; trả `null` nếu không có

### 5.3 Dashboard/Report
- `GET /api/v1/dashboard/summary?granularity=week|month|quarter|year&period_start=W01&period_end=W04`
- `GET /api/v1/dashboard/weekly-matrix?week=W03&year=2026`
- `GET /api/v1/dashboard/kpi-trend?granularity=week|month|quarter|year&year=2026`

### 5.4 Master Data
- `GET /api/v1/categories`
- `POST /api/v1/categories`
- `GET /api/v1/locations`
- `POST /api/v1/locations`

### 5.4b Field Definitions (Custom Fields — FR-011) **[v1.1 — chưa implement v1.0]**
- `GET /api/v1/field-definitions` — list all (active + inactive)
- `POST /api/v1/field-definitions` — tạo mới (Admin only)
- `PUT /api/v1/field-definitions/:id` — cập nhật label/options/is_active (Admin only; field_key immutable)
- `DELETE /api/v1/field-definitions/:id` — chỉ cho phép nếu 0 events có data cho field này

### 5.5 Import/Export
- `POST /api/v1/import/excel`
- `GET /api/v1/export/weekly-matrix?format=pdf|xlsx`
- `GET /api/v1/export/events?format=xlsx`

### 5.6 Quy ước response lỗi
```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Thông báo tiếng Việt",
  "details": {}
}
```

---

## 6. YÊU CẦU PHI CHỨC NĂNG TỐI THIỂU (NFR)

| ID | Yêu cầu | Ngưỡng |
|----|---------|--------|
| NFR-P01 | Dashboard initial load | < 3 giây |
| NFR-P02 | API aggregation response | p95 < 500 ms |
| NFR-P03 | Concurrent users | < 20 users (SQLite WAL mode đáp ứng tốt) |
| NFR-P04 | Export PDF/Excel | < 10 giây cho 500 records |
| NFR-S01 | Bảo mật mật khẩu | bcrypt cost >= 12 |
| NFR-S02 | API security | JWT bắt buộc cho endpoint cần auth |
| NFR-S03 | Authorization | RBAC enforce server-side |
| NFR-R01 | Auditability | 100% CRUD event có audit log |
| NFR-R02 | Backup | Backup DB hằng ngày (copy file `.db` — không cần pg_dump) |
| NFR-U01 | Ngôn ngữ giao diện | Tiếng Việt mặc định |
| NFR-U02 | Định dạng dữ liệu | Date DD/MM/YYYY, number theo vi-VN |
| NFR-C01 | Conflict prevention | OCC: PUT event phải gửi kèm `version`; server từ chối nếu version mismatch (HTTP 409); client hiển thị cảnh báo |
| NFR-C02 | Real-time sync | SSE: client subscribe `/api/v1/events/stream`; khi event thay đổi → TanStack Query tự động invalidate + refresh list/dashboard trong < 2 giây |

---

## 7. TRACEABILITY TỐI THIỂU

| BR | FR | Test nhóm |
|----|----|-----------|
| BR-001 | FR-001 | TC-CRUD-01..05 |
| BR-002 | FR-002 | TC-AGG-01..03 |
| BR-003 | FR-003, FR-006 | TC-DB-01..06 |
| BR-004 | FR-005 | TC-MTX-01..05 |
| BR-005 | FR-010 | TC-CAT-01..03 |
| BR-006 | FR-008 | TC-EXP-01..04 |
| BR-007 | FR-009 | TC-AUTH-01..05 |
| BR-008 | FR-010 | TC-LOC-01..03 |
| BR-009 | FR-004 | TC-TIME-01..05 (week/month/quarter/year) |
| BR-010 | FR-007 | TC-IMP-01..05 |
| BR-011 | FR-011 **(v1.1)** | TC-FIELD-01..06 — defer to v1.1 sprint |

---

## 8. RELEASE GATE V1.0
Một release được coi là đạt v1.0 khi thỏa đồng thời:
1. Tất cả FR có priority **Must** (FR-001 đến FR-010) được implement và pass UAT.
2. FR-011 (Custom Fields) **KHÔNG** yêu cầu cho v1.0 — được defer sang v1.1.
3. Toàn bộ test critical path pass.
4. NFR-P01/P03/P04 và NFR-R01 đạt ngưỡng.
5. NFR-C01 (OCC) và NFR-C02 (SSE) được verify qua integration test.
6. `GET /api/v1/health` trả `{"status":"ok"}` trên production environment.
7. Đối soát dữ liệu với Excel đạt kết quả chấp nhận bởi Product Owner.

---

## Document Control

| Action | Date | Author | Notes |
|--------|------|--------|-------|
| Created | 23/02/2026 | ISD Team | Initial full SRS |
| Revised | 23/02/2026 | ISD Team | Minimal SRS v1.1 |

---

*End of Software Requirements Specification*
