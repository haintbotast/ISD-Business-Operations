# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# ISD Operations Management System (ISD-OMS)

---

| **Phiên bản** | **Ngày** | **Tác giả** | **Ghi chú** |
|---------------|----------|-------------|-------------|
| v1.0 | 23/02/2026 | ISD Team | Initial release |

---

## MỤC LỤC

1. [Product Vision & Goals](#1-product-vision--goals)
2. [User Personas](#2-user-personas)
3. [User Stories](#3-user-stories)
4. [Feature List with Priority](#4-feature-list-with-priority)
5. [Dashboard Design Requirements](#5-dashboard-design-requirements)
6. [Data Model](#6-data-model)
7. [Acceptance Criteria](#7-acceptance-criteria-per-feature)
8. [Traceability Matrix](#8-traceability-matrix)

---

## 1. PRODUCT VISION & GOALS

### 1.1 Product Vision Statement

> **"ISD-OMS dashboard cung cấp cho đội IT Operations khả năng nhìn thấy real-time các incidents, projects, và KPIs hàng tuần — thay thế hoàn toàn việc báo cáo thủ công bằng Excel."**

### 1.2 Product Goals

| Goal | Description | Measure of Success |
|------|-------------|-------------------|
| **G1. Digitize Operations Logging** | Chuyển đổi 100% việc ghi nhận sự kiện từ Excel sang web app | 0 entries vào Excel sau go-live |
| **G2. Real-time Visibility** | Cung cấp dashboard cập nhật tức thì | Dashboard refresh < 5 giây |
| **G3. Professional Reporting** | Tạo báo cáo chất lượng cao như Tableau | Management approval rate > 90% |
| **G4. Collaboration Enhancement** | Nhiều người có thể làm việc đồng thời không gây mất dữ liệu | < 20 concurrent users, conflict prevention qua OCC + SSE |
| **G5. Audit & Compliance** | Mọi thay đổi đều được ghi lại | 100% changes có audit trail |

### 1.3 Problem Statement

**Current State:**
- Đội ISD sử dụng file Excel `BS24_ISD_Operations_Template_2026.xlsx` để track 500+ events/năm
- 4 locations với 5 main groups và 15+ categories
- Báo cáo tuần mất 2-4 giờ để compile thủ công
- Không có single source of truth, multiple versions tồn tại

**Desired State:**
- Một web application duy nhất làm source of truth
- Dashboard tự động cập nhật như Tableau Customer Support Case Demo
- Báo cáo tuần export trong < 15 phút
- Audit trail đầy đủ cho compliance

---

## 2. USER PERSONAS

### 2.1 Persona 1: Ops Engineer

| Attribute | Detail |
|-----------|--------|
| **Tên đại diện** | Nguyễn Văn A - IT Operations Engineer |
| **Vai trò** | Data entry + View own work |
| **Độ tuổi** | 25-35 tuổi |
| **Technical skill** | Intermediate (comfortable với web apps, Excel proficient) |
| **Goals** | - Nhập event nhanh chóng<br>- Xem lại lịch sử công việc của mình<br>- Không muốn mất dữ liệu đã nhập |
| **Pain points** | - Excel hay bị conflict khi nhiều người edit<br>- Khó tìm event cũ<br>- Công thức Excel phức tạp, sợ làm hỏng |
| **Typical tasks** | - Log 5-10 events/tuần<br>- Cập nhật status events<br>- Xem danh sách events mình được assign |
| **Access needs** | Editor role |

**Quote:** *"Tôi chỉ muốn nhập nhanh và đi, không muốn sợ click nhầm làm hỏng công thức Excel của cả team."*

---

### 2.2 Persona 2: Team Lead

| Attribute | Detail |
|-----------|--------|
| **Tên đại diện** | Trần Thị B - IT Team Lead |
| **Vai trò** | Weekly report + KPI review |
| **Độ tuổi** | 30-40 tuổi |
| **Technical skill** | Advanced (expert Excel, basic data analysis) |
| **Goals** | - Tổng hợp báo cáo tuần nhanh<br>- Monitor KPIs của team<br>- Identify trends và issues sớm |
| **Pain points** | - Mất nhiều giờ để compile weekly report<br>- Excel charts không đẹp, management không hài lòng<br>- Khó so sánh data across weeks |
| **Typical tasks** | - Review toàn bộ events trong tuần<br>- Tạo weekly matrix report<br>- Analyze KPI trends<br>- Present cho management |
| **Access needs** | Editor role + Export capabilities |

**Quote:** *"Tôi muốn có dashboard đẹp như Tableau để present cho sếp, và tạo báo cáo trong 10 phút thay vì 3 tiếng."*

---

### 2.3 Persona 3: IT Manager

| Attribute | Detail |
|-----------|--------|
| **Tên đại diện** | Lê Văn C - IT Manager |
| **Vai trò** | Executive dashboard + Trend analysis |
| **Độ tuổi** | 40-50 tuổi |
| **Technical skill** | Basic to Intermediate |
| **Goals** | - High-level overview của operations<br>- Quick identification của critical issues<br>- Data-driven decision making |
| **Pain points** | - Không có real-time visibility<br>- Phải chờ weekly report mới biết tình hình<br>- Khó drill-down vào chi tiết khi cần |
| **Typical tasks** | - Xem executive dashboard hàng ngày<br>- Review severe incidents ngay lập tức<br>- Compare performance across locations<br>- Monthly/quarterly trend analysis |
| **Access needs** | Viewer role (read-only, full dashboard access) |

**Quote:** *"Tôi cần biết tình hình ngay lập tức, không phải đợi đến thứ Hai mới nhận được báo cáo tuần trước."*

---

## 3. USER STORIES

### 3.1 Event Management Stories

#### US-001: Log New Event

| Attribute | Value |
|-----------|-------|
| **ID** | US-001 |
| **Title** | Ghi nhận sự kiện mới |
| **As a** | Ops Engineer |
| **I want to** | Tạo một event mới với đầy đủ thông tin |
| **So that** | Sự kiện được ghi nhận vào hệ thống và xuất hiện trong báo cáo |
| **Acceptance Criteria** | - Form có tất cả fields từ 02_NHAT_KY<br>- Required fields: week, date, location, main_group, category, severity, status, description<br>- Date validation: phải nằm trong week range<br>- Save thành công hiển thị toast notification<br>- Event xuất hiện ngay trong danh sách |
| **Priority** | Must Have |
| **Story Points** | 5 |
| **Related BR** | BR-001 |

---

#### US-002: Edit Event

| Attribute | Value |
|-----------|-------|
| **ID** | US-002 |
| **Title** | Chỉnh sửa sự kiện |
| **As a** | Ops Engineer |
| **I want to** | Chỉnh sửa thông tin của event đã tạo |
| **So that** | Dữ liệu luôn được cập nhật chính xác |
| **Acceptance Criteria** | - Click vào event mở edit form<br>- Pre-fill data hiện tại<br>- updated_at tự động cập nhật<br>- Audit log ghi nhận changes |
| **Priority** | Must Have |
| **Story Points** | 3 |
| **Related BR** | BR-001 |

---

#### US-003: Delete Event

| Attribute | Value |
|-----------|-------|
| **ID** | US-003 |
| **Title** | Xóa sự kiện |
| **As a** | Ops Engineer |
| **I want to** | Xóa event nhập sai |
| **So that** | Data không bị duplicate hoặc sai |
| **Acceptance Criteria** | - Confirm dialog trước khi xóa<br>- Soft delete (keep in DB với deleted_at)<br>- Event không còn hiển thị trong UI<br>- Audit log ghi nhận deletion |
| **Priority** | Must Have |
| **Story Points** | 2 |
| **Related BR** | BR-001 |

---

#### US-004: View Event List

| Attribute | Value |
|-----------|-------|
| **ID** | US-004 |
| **Title** | Xem danh sách sự kiện |
| **As a** | Ops Engineer |
| **I want to** | Xem danh sách events với filter và sort |
| **So that** | Tìm được event cần thiết nhanh chóng |
| **Acceptance Criteria** | - Table với pagination (20 rows/page default)<br>- Filter by: week, location, status, severity, assignee<br>- Sort by: date, severity, status<br>- Search by description keyword<br>- Quick filters (Today, This Week, Open only) |
| **Priority** | Must Have |
| **Story Points** | 5 |
| **Related BR** | BR-001, BR-008 |

---

### 3.2 Dashboard Stories

#### US-005: View KPI Cards

| Attribute | Value |
|-----------|-------|
| **ID** | US-005 |
| **Title** | Xem KPI Cards trên Dashboard |
| **As a** | IT Manager |
| **I want to** | Xem các KPI summary cards với sparkline |
| **So that** | Nắm được tình hình operations trong nháy mắt |
| **Acceptance Criteria** | - 5 KPI cards: Total Events, Downtime (mins), Closure Rate %, Severe Incidents, Open/In-Progress<br>- Mỗi card có: số chính, sparkline 12 tuần, WoW delta<br>- Delta màu xanh nếu positive, đỏ nếu negative<br>- Click card → filter detail table theo metric đó |
| **Priority** | Must Have |
| **Story Points** | 8 |
| **Related BR** | BR-003 |

---

#### US-006: View Trend Charts

| Attribute | Value |
|-----------|-------|
| **ID** | US-006 |
| **Title** | Xem biểu đồ xu hướng |
| **As a** | Team Lead |
| **I want to** | Xem stacked bar chart events theo tuần và category |
| **So that** | Phân tích trend và pattern |
| **Acceptance Criteria** | - X-axis: weeks (range từ week selector)<br>- Y-axis: event count<br>- Stacked by category (bad=red tones, good=green tones)<br>- Hover tooltip hiển thị chi tiết<br>- Click bar → drill down to week detail |
| **Priority** | Must Have |
| **Story Points** | 8 |
| **Related BR** | BR-003 |

---

#### US-007: Filter Dashboard by Week Range

| Attribute | Value |
|-----------|-------|
| **ID** | US-007 |
| **Title** | Lọc dashboard theo khoảng thời gian linh động |
| **As a** | Team Lead / IT Manager |
| **I want to** | Chọn granularity (tuần/tháng/quý/năm) và range để filter toàn bộ dashboard |
| **So that** | Xem data theo đúng góc nhìn cần thiết — tuần cho vận hành, tháng/quý/năm cho phân tích xu hướng |
| **Acceptance Criteria** | - Time range selector ở header position, prominent<br>- **Granularity switcher**: Tuần \| Tháng \| Quý \| Năm<br>- Single period và range: W01-W04, T1-T3, Q1-Q2, 2025-2026<br>- Preset shortcuts: Tuần này, Tháng này, Quý này, Năm nay, 4 tuần gần nhất, YTD<br>- All components update trong < 500ms (debounce 300ms)<br>- Display format động: "Tuần 03 (13-19/01/2026)" / "Tháng 1/2026" / "Q1 2026" / "Năm 2026" |
| **Priority** | Must Have |
| **Story Points** | 8 |
| **Related BR** | BR-009 |

---

#### US-008: View Status Distribution

| Attribute | Value |
|-----------|-------|
| **ID** | US-008 |
| **Title** | Xem phân bố trạng thái |
| **As a** | IT Manager |
| **I want to** | Xem breakdown của events theo status và severity |
| **So that** | Biết được bao nhiêu issues đang open vs closed |
| **Acceptance Criteria** | - Panel hiển thị: All | Low | Medium | High | Severe<br>- Mỗi level có count và percentage<br>- Progress bar visual<br>- Open vs Closed breakdown per level |
| **Priority** | Must Have |
| **Story Points** | 5 |
| **Related BR** | BR-003 |

---

### 3.3 Report Stories

#### US-009: View Weekly Matrix Report

| Attribute | Value |
|-----------|-------|
| **ID** | US-009 |
| **Title** | Xem báo cáo ma trận tuần |
| **As a** | Team Lead |
| **I want to** | Xem matrix report với rows=locations, columns=categories |
| **So that** | Tổng quan events theo từng site và loại |
| **Acceptance Criteria** | - Layout matching 04_BAO_CAO_TUAN<br>- Row headers: KDAMB, KDAMN, Offshore, HO, TOTAL<br>- Column headers: các categories, grouped by main_group<br>- Cell: bullet list descriptions<br>- Header badge: "Sự cố/Lỗi (4)" khi count > 0<br>- Color: bad categories=red header, good=green |
| **Priority** | Must Have |
| **Story Points** | 8 |
| **Related BR** | BR-004 |

---

#### US-010: Export Weekly Report as PDF

| Attribute | Value |
|-----------|-------|
| **ID** | US-010 |
| **Title** | Xuất báo cáo tuần ra PDF |
| **As a** | Team Lead |
| **I want to** | Export weekly matrix report thành PDF |
| **So that** | Gửi email cho management |
| **Acceptance Criteria** | - Button "Xuất PDF" trên matrix report page<br>- PDF format A3 landscape<br>- Include: header với logo, week info, report content, footer với timestamp<br>- File name: ISD_WeeklyReport_W##_2026.pdf<br>- Download trong < 10 giây |
| **Priority** | Must Have |
| **Story Points** | 5 |
| **Related BR** | BR-006 |

---

#### US-011: View KPI Trend Table

| Attribute | Value |
|-----------|-------|
| **ID** | US-011 |
| **Title** | Xem bảng KPI trend |
| **As a** | IT Manager |
| **I want to** | Xem table KPIs theo từng tuần W01-W53 |
| **So that** | Compare performance across weeks |
| **Acceptance Criteria** | - Table rows: W01 đến W53 (năm hiện tại)<br>- Columns: Total Events, Downtime (mins), Severe Count, Closure Rate %, Open Count<br>- Current week highlighted<br>- Conditional formatting: bad values=red, good=green<br>- Export to Excel button |
| **Priority** | Must Have |
| **Story Points** | 5 |
| **Related BR** | BR-003 |

---

### 3.4 Classification Stories

#### US-012: Classify Event as Good/Bad News

| Attribute | Value |
|-----------|-------|
| **ID** | US-012 |
| **Title** | Phân loại sự kiện Good/Bad News |
| **As a** | Ops Engineer |
| **I want to** | Phân loại event là good_news, bad_news, hoặc neutral |
| **So that** | Báo cáo highlight đúng thành tích và rủi ro |
| **Acceptance Criteria** | - Dropdown select trong event form<br>- Default value dựa trên category<br>- User có thể override<br>- Visual indicator (icon/color) trong event list<br>- Filter by classification trong dashboard |
| **Priority** | Must Have |
| **Story Points** | 3 |
| **Related BR** | BR-005 |

---

### 3.5 Import/Export Stories

#### US-013: Import Historical Data from Excel

| Attribute | Value |
|-----------|-------|
| **ID** | US-013 |
| **Title** | Import dữ liệu lịch sử từ Excel |
| **As a** | IT Admin |
| **I want to** | Upload và import dữ liệu từ file Excel cũ |
| **So that** | Không mất dữ liệu lịch sử khi chuyển sang hệ thống mới |
| **Acceptance Criteria** | - Upload .xlsx file<br>- Auto-detect columns từ header names<br>- Preview mode với 20 rows sample<br>- Show validation errors nếu có<br>- Duplicate detection: (year + week + location + description)<br>- Option: skip duplicates hoặc replace<br>- Progress bar during import<br>- Summary: imported X, skipped Y, errors Z |
| **Priority** | Must Have |
| **Story Points** | 13 |
| **Related BR** | BR-010 |

---

#### US-014: Export Event Log to Excel

| Attribute | Value |
|-----------|-------|
| **ID** | US-014 |
| **Title** | Xuất danh sách events ra Excel |
| **As a** | Team Lead |
| **I want to** | Export filtered event list thành Excel file |
| **So that** | Có thể analyze offline hoặc share |
| **Acceptance Criteria** | - Button "Xuất Excel" trên event list<br>- Columns match 02_NHAT_KY format (B-W)<br>- Preserve Vietnamese characters<br>- File name: ISD_Events_W##-W##_2026.xlsx<br>- Export current filter/sort state |
| **Priority** | Must Have |
| **Story Points** | 5 |
| **Related BR** | BR-006 |

---

### 3.6 Admin Stories

#### US-015: Manage Categories

| Attribute | Value |
|-----------|-------|
| **ID** | US-015 |
| **Title** | Quản lý danh mục |
| **As a** | IT Admin |
| **I want to** | Thêm/sửa/xóa main groups và categories |
| **So that** | Cập nhật taxonomy khi cần |
| **Acceptance Criteria** | - Admin page cho category management<br>- CRUD main_group với name và classification_default<br>- CRUD category thuộc main_group<br>- Changes reflect ngay trong dropdowns<br>- Cannot delete category đang có events |
| **Priority** | Should Have |
| **Story Points** | 5 |
| **Related BR** | BR-005 |

---

#### US-016: Manage Users and Roles

| Attribute | Value |
|-----------|-------|
| **ID** | US-016 |
| **Title** | Quản lý users và roles |
| **As a** | IT Admin |
| **I want to** | Tạo user accounts và assign roles |
| **So that** | Kiểm soát access vào hệ thống |
| **Acceptance Criteria** | - Admin page cho user management<br>- Create user: username, password, full_name, role<br>- Roles: Admin, Editor, Viewer<br>- Deactivate user (không xóa hẳn)<br>- Reset password function |
| **Priority** | Must Have |
| **Story Points** | 5 |
| **Related BR** | BR-007 |

---

### 3.6.1 Admin Story: Flexible Fields

#### US-018: Manage Custom Fields

| Attribute | Value |
|-----------|-------|
| **ID** | US-018 |
| **Title** | Quản lý trường thông tin tùy chỉnh |
| **As a** | IT Admin |
| **I want to** | Định nghĩa, thêm, ẩn/hiện các custom fields cho events |
| **So that** | Hệ thống linh động theo nghiệp vụ mà không cần deploy lại |
| **Acceptance Criteria** | - Admin page "Quản lý trường tùy chỉnh" (Field Definitions)<br>- Tạo field mới với: key (unique), label (tiếng Việt), type (text/number/select/date/boolean), required, sort_order<br>- Với type=select: thêm/sửa/xóa options trong danh sách<br>- Ẩn field (is_active=false): field không hiển thị trên form nhưng data lịch sử giữ nguyên<br>- Không thể xóa field đã có data<br>- Custom fields xuất hiện trong event form, event list (toggleable columns), export |
| **Priority** | **Should Have — v1.1** (Defer từ v1.0 để tập trung go-live) |
| **Story Points** | 8 |
| **Related BR** | BR-011 |

---

### 3.7 Authentication Stories

#### US-017: Login to System

| Attribute | Value |
|-----------|-------|
| **ID** | US-017 |
| **Title** | Đăng nhập hệ thống |
| **As a** | User |
| **I want to** | Login với username và password |
| **So that** | Truy cập được vào hệ thống |
| **Acceptance Criteria** | - Login page với username/password fields<br>- Remember me checkbox<br>- Error message nếu credentials sai<br>- Redirect đến dashboard sau login success<br>- Session timeout sau 8 giờ inactive |
| **Priority** | Must Have |
| **Story Points** | 5 |
| **Related BR** | BR-007 |

---

## 4. FEATURE LIST WITH PRIORITY

### 4.1 MoSCoW Prioritization

| Feature | Priority | Effort | Sprint | Notes |
|---------|----------|--------|--------|-------|
| **F01. Event CRUD** | Must | Medium | 1 | Core functionality |
| **F02. Event List with Filter/Sort** | Must | Medium | 1 | |
| **F03. User Authentication** | Must | Medium | 1 | Security prerequisite |
| **F04. Role-based Access Control** | Must | Low | 1 | |
| **F05. KPI Summary Cards** | Must | High | 2 | Main dashboard |
| **F06. Trend Charts (Stacked Bar)** | Must | High | 2 | |
| **F07. Status Distribution Panel** | Must | Medium | 2 | |
| **F08. Time Range Selector (tuần/tháng/quý/năm)** | Must | Medium | 2 | Thay thế Week Selector |
| **F09. Detail Table with Drill-down** | Must | Medium | 2 | |
| **F10. Weekly Matrix Report** | Must | High | 3 | Key deliverable |
| **F11. KPI Trend Table** | Must | Medium | 3 | |
| **F12. PDF Export** | Must | Medium | 3 | |
| **F13. Excel Export** | Must | Medium | 3 | |
| **F14. Excel Import Wizard** | Must | High | 4 | Migration |
| **F15. Good/Bad Classification** | Must | Low | 1 | |
| **F16. Admin - Category Management** | Should | Medium | 4 | |
| **F17. Admin - User Management** | Must | Medium | 4 | |
| **F18. Audit Logging** | Should | Low | 4 | |
| **F19. Vietnamese i18n** | Must | Low | 1-4 | Throughout |
| **F20. Mobile Responsive** | Could | Medium | - | v1.1 |
| **F21. Admin - Custom Field Management** | **Should (v1.1)** | Medium | v1.1 | BR-011 — defer để đảm bảo go-live v1.0 |

### 4.2 Feature Dependencies

```
F03 (Auth) ──┬──> F04 (RBAC)
             │
             └──> F01 (Event CRUD) ──> F02 (Event List)
                        │
                        └──> F15 (Classification)

F02 (Event List) ──> F05 (KPI Cards) ──> F06 (Charts)
                            │
                            └──> F08 (Week Selector) ──> F07 (Status Panel)
                                         │
                                         └──> F09 (Detail Table)

F02 (Event List) ──> F10 (Weekly Matrix) ──> F12 (PDF Export)
                            │
                            └──> F11 (KPI Trend Table)

F01 (Event CRUD) ──> F14 (Excel Import)
                            │
                            └──> F13 (Excel Export)
```

---

## 5. DASHBOARD DESIGN REQUIREMENTS

### 5.1 Reference Dashboard

**Source:** Tableau Customer Support Case Demo

**URL:** https://public.tableau.com/app/profile/ellen4268/viz/CustomerSupportCaseDemo/CustomerSupportCases

**Mô tả tham chiếu nội bộ:** [docs/references/dashboard_reference.md](references/dashboard_reference.md)

### 5.2 Visual Components Specification

#### 5.2.1 KPI Summary Cards (Top-Left Panel)

**Reference Area:** Cột trái dashboard (Severe impact, High impact, Medium impact, Low impact)

| Property | Specification |
|----------|---------------|
| **Layout** | 4-5 cards xếp dọc |
| **Card content** | - Category name<br>- Big number (open count)<br>- "X open" label<br>- Total count nhỏ bên dưới<br>- Sparkline 12 điểm<br>- WoW delta badge |
| **Sparkline** | Mini area chart, 12 data points (weeks) |
| **Delta badge** | - Format: "vs PY: +X.X%" hoặc "vs WoW: -X.X%"<br>- Green với mũi tên lên nếu positive<br>- Red với mũi tên xuống nếu negative |
| **Interaction** | Click → filter detail table theo category |

**Visual Example:**
```
┌──────────────────────────────┐
│ Severe impact                │
│                              │
│    5 open ●               ▁▂▃│
│    31 total ●             ▄▅▆│
│                              │
│  ⬇ vs PY: -16.7%            │
└──────────────────────────────┘
```

---

#### 5.2.2 Category Breakdown Bar Chart (Right Panel)

**Reference Area:** Biểu đồ cột phía trên bên phải

| Property | Specification |
|----------|---------------|
| **Chart type** | Stacked bar chart |
| **X-axis** | Weeks (W01, W02, ...) hoặc months |
| **Y-axis** | Event count (0 đến max) |
| **Stacking** | By category (color-coded) |
| **Colors** | - Bad categories: Red family (#C00000, #FF6666, #FF9999, #FFCCCC)<br>- Good categories: Green family (#375623, #70AD47, #AADEAA, #E2F0D9)<br>- Neutral: Blue family (#1F4E79, #2E75B6, #9BC2E6, #BDD7EE) |
| **Interaction** | - Hover: tooltip với details<br>- Click bar segment: drill-down to filtered list |
| **Legend** | Hiển thị bên phải hoặc dưới chart |

---

#### 5.2.3 Status Distribution (Center Panel)

**Reference Area:** "Cases by impact + status" section

| Property | Specification |
|----------|---------------|
| **Layout** | Vertical list với progress bars |
| **Rows** | All, Low, Medium, High, Severe |
| **Content per row** | - Label: "Level: X | Y%"<br>- Progress bar (filled portion = percentage)<br>- Color: matches severity |
| **Status toggle** | Open ● / Closed ► toggle buttons |
| **Numbers** | Open count, Closed count in boxes |

**Visual Example:**
```
Cases by impact + status
Last 12 months ►

All: 541 | 100%  ████████████████████████████████

Low: 310 | 57%   ███████████████████░░░░░░░░░░░░░

Medium: 108 | 20% ██████░░░░░░░░░░░░░░░░░░░░░░░░░░

High: 92 | 17%   █████░░░░░░░░░░░░░░░░░░░░░░░░░░░

Severe: 31 | 6%  ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

Status: Open ● | closed ● ►
        130       411
```

---

#### 5.2.4 Detail Table (Bottom Panel)

**Reference Area:** "Open Cases | breakdown" section

| Property | Specification |
|----------|---------------|
| **Columns** | #, Order ID, Customer Name, Description, Open Date, Days Open, Severity Badge |
| **Sorting** | Click header to sort (default: Days Open desc) |
| **Row count** | 20 rows per page with pagination |
| **Row highlight** | Hover highlight |
| **Severity badge** | Inline colored badge (Low=green, Medium=yellow, High=orange, Severe=red) |
| **Sort dropdown** | "Sort by: [Days open ▼]" |
| **Days adjuster** | "- [14 days] +" control (filter events open > X days) |

**Columns mapping cho ISD-OMS:**

| # | Column | Excel Mapping | Width |
|---|--------|---------------|-------|
| 1 | # | Row number | 40px |
| 2 | Event ID | Generated | 100px |
| 3 | Customer/Tenant | H (Khách hàng/Tenant) | 150px |
| 4 | Description | M (Mô tả) | flex |
| 5 | Open Date | C (Ngày) | 100px |
| 6 | Days Open | Calculated | 80px |
| 7 | Severity | I (Mức độ nghiêm trọng) | 80px |

---

#### 5.2.5 Time Range Selector

| Property | Specification |
|----------|---------------|
| **Position** | Top header, prominent location — luôn hiển thị |
| **Granularity switcher** | Tab/Toggle bar: **Tuần** \| **Tháng** \| **Quý** \| **Năm** |
| **Selection type** | Single period hoặc range (start → end) |
| **Presets** | Tuần này, Tháng này, Quý này, Năm nay, 4 tuần gần nhất, 3 tháng gần nhất, YTD |
| **Display format** | Động theo granularity:<br>- Tuần: "Tuần 03 (13-19/01/2026)" hoặc "Tuần 01-04/2026"<br>- Tháng: "Tháng 1/2026" hoặc "T1-T3/2026"<br>- Quý: "Q1/2026" hoặc "Q1-Q2/2026"<br>- Năm: "2026" hoặc "2025-2026" |
| **Behavior** | Change → tất cả components refresh (debounce 300ms); granularity change → reset về single current period |
| **Impact on charts** | X-axis label thay đổi theo granularity (W01, T1, Q1, 2026) |
| **Impact on KPI trend** | Table rows thay đổi: W01-W53 (tuần) / T1-T12 (tháng) / Q1-Q4 (quý) / 2024-2026 (năm) |

---

#### 5.2.6 Left Sidebar Navigation

| Property | Specification |
|----------|---------------|
| **Position** | Fixed left, collapsible |
| **Width** | 240px expanded, 64px collapsed |
| **Components** | - Logo/App name<br>- Main nav items<br>- User info at bottom |
| **Nav items** | 1. Dashboard<br>2. Nhật ký (Event Log)<br>3. Báo cáo tuần (Weekly Report)<br>4. KPI Trend<br>5. Danh mục (Categories) - Admin only<br>6. Quản trị (Admin) - Admin only |
| **Active state** | Highlighted background + left border accent |

---

### 5.3 Color Palette

#### 5.3.1 Semantic Colors

| Usage | Color Code | Color Name | Example |
|-------|------------|------------|---------|
| **Bad News / Severe** | #C00000 | Dark Red | Severe incidents |
| **Bad News / High** | #FF6666 | Light Red | High priority issues |
| **Bad News / Light** | #FF9999 | Pale Red | Medium bad news |
| **Bad News / Lightest** | #FFCCCC | Pink | Low severity bad |
| **Good News / Primary** | #375623 | Dark Green | Major achievements |
| **Good News / Secondary** | #70AD47 | Green | Good news items |
| **Good News / Light** | #AADEAA | Light Green | Minor positive |
| **Good News / Lightest** | #E2F0D9 | Pale Green | Subtle positive |
| **Neutral / Primary** | #1F4E79 | Navy Blue | Headers, primary actions |
| **Neutral / Secondary** | #2E75B6 | Blue | Links, secondary elements |
| **Neutral / Light** | #9BC2E6 | Light Blue | Borders, subtle elements |
| **Neutral / Lightest** | #BDD7EE | Pale Blue | Hover states |

#### 5.3.2 UI Colors

| Usage | Color Code | Notes |
|-------|------------|-------|
| **Background** | #F5F8FC | Main app background |
| **Card Background** | #FFFFFF | Cards, panels |
| **Text Primary** | #1F2937 | Main text |
| **Text Secondary** | #6B7280 | Muted text |
| **Border** | #E5E7EB | Subtle borders |
| **Success** | #10B981 | Success states |
| **Warning** | #F59E0B | Warning states |
| **Error** | #EF4444 | Error states |

---

## 6. DATA MODEL

### 6.1 Entity Relationship Diagram

```
┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────┐  ┌──────────────────────┐
│   USERS         │  │  CATEGORY_MASTER │  │  LOCATION_MASTER    │  │  FIELD_DEFINITIONS   │
├─────────────────┤  ├──────────────────┤  ├─────────────────────┤  ├──────────────────────┤
│ id (PK)         │  │ id (PK)          │  │ id (PK)             │  │ id (PK) [v1.1]       │
│ username        │  │ main_group       │  │ code (UNIQUE)       │  │ field_key (UNIQUE)   │
│ password_hash   │  │ category         │  │ full_name           │  │ field_label          │
│ full_name       │  │ classification   │  │ is_active           │  │ field_type           │
│ role            │  │ sort_order       │  │ sort_order          │  │ options (JSON)       │
│ is_active       │  │ created_at       │  │ created_at          │  │ is_required          │
│ created_at      │  └──────────────────┘  └─────────────────────┘  │ is_active            │
│ updated_at      │           │                      │               │ sort_order           │
└─────────────────┘           │                      │               └──────────────────────┘
        │                     │                      │
        │                     ▼                      ▼
        │    ┌───────────────────────────────────────────────────────┐
        └───►│                      EVENTS                            │
             ├───────────────────────────────────────────────────────┤
             │ id (PK, UUID)                                          │
             │ week_code (FK → WEEK_REFERENCE.week_code)              │
             │ year (FK → WEEK_REFERENCE.year)                        │
             │ date                                                   │
             │ location_code (FK → LOCATION_MASTER.code)              │
             │ main_group (FK → CATEGORY_MASTER)                      │
             │ category (FK → CATEGORY_MASTER)                        │
             │ system_component                                       │
             │ customer_tenant                                        │
             │ severity                                               │
             │ status                                                 │
             │ assignee                                               │
             │ openproject_id                                         │
             │ description                                            │
             │ downtime_minutes                                       │
             │ classification                                         │
             │ version (INT DEFAULT 1) ← OCC conflict prevention      │
             │ extra_fields (TEXT/JSON) ← custom fields [v1.1]        │
             │ created_by (FK → USERS)                                │
             │ created_at                                             │
             │ updated_at                                             │
             │ deleted_at                                             │
             └───────────────────────────────────────────────────────┘
                     │
                     ▼
┌───────────────────────┐       ┌──────────────────┐
│  WEEK_REFERENCE       │       │    AUDIT_LOG     │
├───────────────────────┤       ├──────────────────┤
│ (year, week_code) PK  │       │ id (PK)          │
│ year                  │       │ table_name       │
│ week_code             │       │ record_id        │
│ start_date            │       │ action           │
│ end_date              │       │ old_values (JSON)│
└───────────────────────┘       │ new_values (JSON)│
                                │ user_id (FK)     │
                                │ created_at       │
                                └──────────────────┘
```

### 6.2 Entity Specifications

#### 6.2.1 EVENTS (Tương đương 02_NHAT_KY)

| Field | Type | Constraints | Excel Column | Notes |
|-------|------|-------------|--------------|-------|
| id | UUID | PK, auto-generated | - | Primary key |
| week_code | VARCHAR(3) | NOT NULL, FK | B | Format: W01-W53; FK → week_references(year, week_code) |
| year | INTEGER | NOT NULL, FK | B | Năm; cùng FK với week_code |
| date | DATE | NOT NULL | C | Ngày xảy ra — phải thuộc range của week |
| location_code | VARCHAR(20) | NOT NULL, FK → location_master.code | D | KDAMB, KDAMN, Offshore, HO (Admin có thể thêm) |
| main_group | VARCHAR(100) | NOT NULL, FK | E | Nhóm chính |
| category | VARCHAR(100) | NOT NULL, FK | F | Danh mục |
| system_component | VARCHAR(200) | NULL | G | Hệ thống/Component |
| customer_tenant | VARCHAR(200) | NULL | H | Khách hàng/Tenant |
| severity | VARCHAR(20) | NOT NULL, default 'Thấp' | I | Thấp, Trung bình, Cao, Nghiêm trọng (CHECK constraint) |
| status | VARCHAR(20) | NOT NULL, default 'Mở' | J | Mở, Đang xử lý, Đã đóng (CHECK constraint) |
| assignee | VARCHAR(100) | NULL | K | Người xử lý |
| openproject_id | VARCHAR(50) | NULL | L | Link OpenProject |
| description | TEXT | NOT NULL | M | Mô tả chi tiết |
| downtime_minutes | INTEGER | NOT NULL, default 0 | N | Thời gian downtime (phút) |
| classification | VARCHAR(10) | NOT NULL, default 'neutral' | O | good_news, bad_news, neutral (CHECK constraint) |
| **version** | **INTEGER** | **NOT NULL, default 1** | - | **OCC: tăng dần mỗi lần update; PUT phải gửi version hiện tại** |
| created_by | UUID | FK → users.id | - | User tạo |
| created_at | TIMESTAMP | NOT NULL, default NOW() | P | |
| updated_at | TIMESTAMP | NOT NULL, default NOW() | Q | |
| deleted_at | TIMESTAMP | NULL | - | Soft delete |
| extra_fields | TEXT (JSON) | NULL | - | **[v1.1]** Custom fields dạng `{"field_key": value, ...}` — validated against FIELD_DEFINITIONS |

---

#### 6.2.1b FIELD_DEFINITIONS (Custom Field Registry)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INTEGER | PK, AUTOINCREMENT | |
| field_key | VARCHAR(50) | UNIQUE, NOT NULL | Machine-readable key (snake_case) — không đổi sau khi tạo |
| field_label | VARCHAR(100) | NOT NULL | Tên hiển thị tiếng Việt |
| field_type | VARCHAR(20) | NOT NULL, CHECK IN ('text','number','select','date','boolean') | Kiểu dữ liệu |
| options | TEXT (JSON) | NULL | Array of strings cho type=select: `["Option A","Option B"]` |
| is_required | BOOLEAN | default false | Bắt buộc nhập khi tạo event |
| is_active | BOOLEAN | default true | false = ẩn khỏi form (data lịch sử giữ nguyên) |
| sort_order | INTEGER | default 0 | Thứ tự hiển thị trên form |
| created_at | TEXT (ISO8601) | default CURRENT_TIMESTAMP | |

> **Lưu ý thiết kế:** `field_key` là immutable sau khi tạo để tránh mất liên kết với `extra_fields` JSON trong events. Chỉ `field_label`, `is_active`, `is_required`, `sort_order`, `options` mới có thể sửa.

---

#### 6.2.1c LOCATION_MASTER (Địa điểm — Admin có thể thêm/sửa)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INTEGER | PK, AUTOINCREMENT | |
| code | VARCHAR(20) | UNIQUE, NOT NULL | Mã ngắn: KDAMB, KDAMN, Offshore, HO |
| full_name | VARCHAR(100) | NOT NULL | Tên đầy đủ |
| is_active | BOOLEAN | default true | false = ẩn khỏi dropdown |
| sort_order | INTEGER | default 0 | Thứ tự hiển thị |
| created_at | TEXT | default CURRENT_TIMESTAMP | |

> **Lý do dùng LOCATION_MASTER thay ENUM:** Admin cần thêm/sửa location mà không cần schema migration. Seed data mặc định: KDAMB, KDAMN, Offshore, HO.

---

#### 6.2.2 WEEK_REFERENCE (Tương đương 03_DANH_MUC weeks)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| year | INTEGER | PK (composite) | Năm: 2024, 2025, 2026... |
| week_code | VARCHAR(3) | PK (composite) | W01-W53 |
| start_date | DATE | NOT NULL | Monday của tuần |
| end_date | DATE | NOT NULL | Sunday của tuần |

> **PK composite:** `(year, week_code)` — tránh nhầm W01/2025 với W01/2026.

---

#### 6.2.3 CATEGORY_MASTER (Tương đương 03_DANH_MUC categories)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | SERIAL | PK | Auto increment |
| main_group | VARCHAR(100) | NOT NULL | Nhóm chính |
| category | VARCHAR(100) | NOT NULL | Danh mục |
| classification_default | ENUM | NOT NULL | good_news, bad_news, neutral |
| sort_order | INTEGER | NOT NULL, default 0 | Thứ tự hiển thị |
| created_at | TIMESTAMP | default NOW() | |

**Unique constraint:** (main_group, category)

---

#### 6.2.4 USERS

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | Auto-generated |
| username | VARCHAR(50) | UNIQUE, NOT NULL | Login username |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hash |
| full_name | VARCHAR(100) | NOT NULL | Display name |
| role | ENUM | NOT NULL | Admin, Editor, Viewer |
| is_active | BOOLEAN | default true | Soft deactivate |
| created_at | TIMESTAMP | default NOW() | |
| updated_at | TIMESTAMP | default NOW() | |

---

#### 6.2.5 AUDIT_LOG

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | INTEGER | PK, AUTOINCREMENT | Auto increment |
| table_name | VARCHAR(50) | NOT NULL | events, users, etc. |
| record_id | VARCHAR(50) | NOT NULL | ID of affected record |
| action | VARCHAR(10) | NOT NULL, CHECK IN ('INSERT','UPDATE','DELETE') | Loại hành động |
| old_values | TEXT (JSON) | NULL | Before state — serialize JSON thành TEXT |
| new_values | TEXT (JSON) | NULL | After state — serialize JSON thành TEXT |
| user_id | TEXT (UUID) | FK → users.id | Who made the change |
| created_at | TEXT (ISO8601) | default CURRENT_TIMESTAMP | When |

---

### 6.3 Enum Definitions

> **Ghi chú SQLite:** SQLite không hỗ trợ native ENUM type. Các enum dưới đây được Prisma ORM tự động chuyển thành `CHECK constraints` khi generate schema cho SQLite. Không cần thay đổi Prisma schema — chỉ cần đổi `provider = "sqlite"`.

| Enum | Giá trị hợp lệ |
|------|----------------|
| **location** | `KDAMB`, `KDAMN`, `Offshore`, `HO` |
| **severity** | `Thấp`, `Trung bình`, `Cao`, `Nghiêm trọng` |
| **status** | `Mở`, `Đang xử lý`, `Đã đóng` |
| **classification** | `good_news`, `bad_news`, `neutral` |
| **role** | `Admin`, `Editor`, `Viewer` |
| **audit_action** | `INSERT`, `UPDATE`, `DELETE` |

**Prisma schema (database-agnostic):**
```prisma
// Viết một lần, Prisma tự map sang CHECK constraint cho SQLite
enum LocationEnum {
  KDAMB
  KDAMN
  Offshore
  HO
}

enum SeverityEnum {
  Thap      @map("Thấp")
  TrungBinh @map("Trung bình")
  Cao
  NghiemTrong @map("Nghiêm trọng")
}

// ... tương tự cho các enum khác
```

---

## 7. ACCEPTANCE CRITERIA PER FEATURE

### 7.1 F01. Event CRUD - Acceptance Criteria

| AC ID | Scenario | Given | When | Then |
|-------|----------|-------|------|------|
| AC-F01-01 | Create event successfully | User is on event creation form | User fills all required fields and clicks Save | Event is saved, toast shows "Đã tạo sự kiện", event appears in list |
| AC-F01-02 | Validation error on create | User is on event creation form | User leaves required field empty and clicks Save | Form shows inline error, Save is blocked |
| AC-F01-03 | Date-week validation | User enters date 2026-01-20 | Week is W03 (13-19 Jan) | Error: "Ngày không thuộc tuần W03" |
| AC-F01-04 | Edit event | User clicks Edit on event | User changes description and Save | Event updated, updated_at changes, audit logged |
| AC-F01-05 | Delete event | User clicks Delete on event | User confirms deletion | Event soft-deleted, removed from UI, audit logged |

### 7.2 F05. KPI Summary Cards - Acceptance Criteria

| AC ID | Scenario | Given | When | Then |
|-------|----------|-------|------|------|
| AC-F05-01 | Cards display correctly | Dashboard loads | Week selector is W01-W04 | 5 KPI cards show with correct values |
| AC-F05-02 | Sparkline renders | Card is visible | Data exists for 12 weeks | Sparkline shows 12 data points |
| AC-F05-03 | Delta calculation | Previous week had 10 events | Current week has 12 events | Delta badge shows "+20%" in green |
| AC-F05-04 | Click drill-down | User clicks "Severe" card | - | Detail table filters to severity="Nghiêm trọng" |
| AC-F05-05 | Zero state | No events in selected range | Dashboard loads | Cards show "0" with empty sparkline |

### 7.3 F10. Weekly Matrix Report - Acceptance Criteria

| AC ID | Scenario | Given | When | Then |
|-------|----------|-------|------|------|
| AC-F10-01 | Matrix renders | Week W03 selected | Page loads | Matrix shows 4 location rows + categories columns |
| AC-F10-02 | Cell content | KDAMB has 3 "Sự cố/Lỗi" events | Matrix renders | Cell shows 3 bullet points with descriptions |
| AC-F10-03 | Header badge | Category "Downtime" has 2 events | Matrix renders | Header shows "Downtime (2)" |
| AC-F10-04 | Color coding | "Sự cố/Lỗi" is bad_news | Matrix renders | Header has red background |
| AC-F10-05 | Empty cell | HO has no "Mối đe dọa" events | Matrix renders | Cell is empty (no "N/A" text) |

### 7.4 F14. Excel Import - Acceptance Criteria

| AC ID | Scenario | Given | When | Then |
|-------|----------|-------|------|------|
| AC-F14-01 | Upload file | User is on Import page | User uploads valid .xlsx | File accepted, column mapping shown |
| AC-F14-02 | Auto-mapping | Excel has header "Tuần" | Mapping page loads | "Tuần" auto-mapped to "week" field |
| AC-F14-03 | Preview data | Mapping confirmed | Preview page loads | Shows first 20 rows with mapped values |
| AC-F14-04 | Duplicate detection | Import includes existing event | Import runs | Duplicate flagged, user can skip/replace |
| AC-F14-05 | Import completion | User confirms import | Import runs | Progress bar, summary shows X imported |

---

## 8. TRACEABILITY MATRIX

### 8.1 BR → US → FR Traceability

| Business Req | User Story | Feature | Priority |
|--------------|------------|---------|----------|
| BR-001 | US-001, US-002, US-003, US-004 | F01, F02 | Must |
| BR-002 | US-005, US-011 | F05, F11 | Must |
| BR-003 | US-005, US-006, US-008 | F05, F06, F07 | Must |
| BR-004 | US-009 | F10 | Must |
| BR-005 | US-012 | F15 | Must |
| BR-006 | US-010, US-014 | F12, F13 | Must |
| BR-007 | US-016, US-017 | F03, F04, F17 | Must |
| BR-008 | US-004, US-009 | F02, F10 | Must |
| BR-009 | US-007 | F08 | Must |
| BR-010 | US-013 | F14 | Must |

### 8.2 Feature → Test Case Mapping

| Feature | Test Cases (Planned) |
|---------|---------------------|
| F01. Event CRUD | TC-001 to TC-010 |
| F02. Event List | TC-011 to TC-020 |
| F03. Authentication | TC-021 to TC-030 |
| F05. KPI Cards | TC-031 to TC-040 |
| F06. Trend Charts | TC-041 to TC-050 |
| F10. Weekly Matrix | TC-051 to TC-060 |
| F12. PDF Export | TC-061 to TC-070 |
| F14. Excel Import | TC-071 to TC-085 |

---

## Document Control

| Action | Date | Author | Notes |
|--------|------|--------|-------|
| Created | 23/02/2026 | ISD Team | Initial version |
| Reviewed | - | - | Pending |
| Approved | - | - | Pending |

---

*End of Product Requirements Document*
