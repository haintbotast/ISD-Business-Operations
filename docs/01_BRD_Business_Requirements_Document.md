# BUSINESS REQUIREMENTS DOCUMENT (BRD)
# ISD Operations Management System (ISD-OMS)

---

| **Phiên bản** | **Ngày** | **Tác giả** | **Ghi chú** |
|---------------|----------|-------------|-------------|
| v1.0 | 23/02/2026 | ISD Team | Initial release |

---

## MỤC LỤC

1. [Executive Summary](#1-executive-summary)
2. [Stakeholders](#2-stakeholders)
3. [Business Requirements](#3-business-requirements)
4. [Constraints & Assumptions](#4-constraints--assumptions)
5. [Out of Scope](#5-out-of-scope-v10)
6. [Appendix](#6-appendix)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Tên dự án
**ISD Operations Management System (ISD-OMS)**

### 1.2 Vấn đề kinh doanh (Business Problem)

Hiện tại, đội IT Operations đang sử dụng file Excel `BS24_ISD_Operations_Template_2026.xlsx` để theo dõi và quản lý các hoạt động vận hành hàng tuần. Phương pháp này gặp phải các vấn đề nghiêm trọng:

| Vấn đề | Mô tả | Tác động |
|--------|-------|----------|
| **Không có khả năng mở rộng** | File Excel khó quản lý khi dữ liệu tăng lên, nhiều người cùng truy cập gây xung đột | Mất dữ liệu, duplicate entries |
| **Thiếu visibility thời gian thực** | Không có dashboard tự động cập nhật, phải refresh thủ công | Ra quyết định chậm trễ |
| **Không có professional dashboard** | Excel charts không đáp ứng được yêu cầu trực quan hóa chuyên nghiệp | Báo cáo lên management thiếu tính thuyết phục |
| **Khó khăn trong collaboration** | Nhiều người edit cùng lúc gây conflict | Giảm năng suất làm việc nhóm |
| **Thiếu audit trail** | Không theo dõi được ai sửa gì, khi nào | Khó truy vết khi có sai sót |
| **Manual aggregation** | Phải copy-paste, dùng công thức phức tạp để tổng hợp báo cáo tuần | Tốn thời gian, dễ sai sót |

### 1.3 Mục tiêu kinh doanh (Business Objectives)

Áp dụng nguyên tắc **SMART** (Specific, Measurable, Achievable, Relevant, Time-bound):

| ID | Mục tiêu | Đo lường | Thời hạn |
|----|----------|----------|----------|
| **OBJ-001** | Thay thế hoàn toàn file Excel bằng web application | 100% data entry và reporting trên web app | Q2/2026 |
| **OBJ-002** | Giảm thời gian tạo báo cáo tuần | Từ 2-4 giờ xuống còn < 15 phút | Q2/2026 |
| **OBJ-003** | Cung cấp dashboard tương tác chất lượng cao | Dashboard đạt chuẩn như Tableau reference | Q2/2026 |
| **OBJ-004** | Hỗ trợ đội ISD đồng thời không conflict dữ liệu | Hệ thống stable với < 20 concurrent users (SQLite WAL mode), OCC ngăn lost update | Q2/2026 |
| **OBJ-005** | Đảm bảo data integrity và audit trail | 100% changes được logged, 0 data loss | Continuous |

### 1.4 Success Metrics (KPIs cho dự án)

| Metric | Target | Đo lường bằng |
|--------|--------|---------------|
| User adoption rate | > 90% trong tháng đầu | Số user active / Tổng số user |
| Weekly report generation time | < 15 phút | Timer đo từ click đến export xong |
| Data accuracy | 100% | Cross-check với source data |
| System uptime | > 99% | Monitoring tools |
| User satisfaction score | > 4/5 | Survey sau 1 tháng sử dụng |
| Bug severity | 0 Critical bugs trong production | Bug tracking system |

---

## 2. STAKEHOLDERS

### 2.1 Stakeholder Matrix

| Role | Tên/Chức danh | Interest Level | Influence | Expectations |
|------|---------------|----------------|-----------|--------------|
| **Product Owner** | ISD Team Lead | Cao | Cao | Hệ thống đáp ứng đầy đủ yêu cầu nghiệp vụ, dễ sử dụng |
| **Ops Team Users** | IT Operations Engineers (5-10 người) | Cao | Trung bình | Giao diện thân thiện, data entry nhanh, không mất dữ liệu |
| **IT Admin** | System Administrator | Trung bình | Cao | Dễ deploy, dễ backup, có documentation |
| **Management/Viewers** | IT Manager, Division Head | Cao | Cao | Dashboard đẹp, dữ liệu chính xác, export report chuyên nghiệp |
| **Developer** | Internal/External Developer | Trung bình | Cao | Requirements rõ ràng, tech stack hiện đại |

### 2.2 Communication Plan

| Stakeholder | Phương thức | Tần suất |
|-------------|-------------|----------|
| Product Owner | Standup meeting, Demo | Hàng ngày/Sprint |
| Ops Team Users | Training session, User guide | Trước go-live + on-demand |
| IT Admin | Technical handover | Trước deployment |
| Management | Executive summary, Demo | Cuối mỗi sprint |

---

## 3. BUSINESS REQUIREMENTS

### 3.1 Core Business Requirements

#### BR-001: Single Data Entry Point (Thay thế 02_NHAT_KY)

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | BR-001 |
| **Tên** | Điểm nhập liệu duy nhất |
| **Mô tả** | Hệ thống cung cấp giao diện web duy nhất để ghi nhận tất cả events/tasks, thay thế hoàn toàn việc nhập liệu vào sheet 02_NHAT_KY trong Excel |
| **Lý do** | Loại bỏ duplicate data entry, đảm bảo single source of truth |
| **Acceptance Criteria** | - Form nhập liệu bao gồm tất cả fields từ cột B-W của 02_NHAT_KY<br>- Validation real-time khi nhập<br>- Auto-save draft sau mỗi 30 giây |
| **Priority** | Must Have |
| **Source** | Excel sheet 02_NHAT_KY |

---

#### BR-002: Auto-aggregation (Tự động tổng hợp)

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | BR-002 |
| **Tên** | Tự động tổng hợp theo tuần, địa điểm, danh mục |
| **Mô tả** | Hệ thống tự động tính toán và tổng hợp số liệu theo các chiều: week, location, main_group, category mà không cần thao tác thủ công |
| **Lý do** | Loại bỏ công thức Excel phức tạp, giảm lỗi tính toán |
| **Acceptance Criteria** | - Aggregation thực hiện real-time khi có data mới<br>- Kết quả khớp 100% với công thức Excel hiện tại<br>- Có thể group theo multiple dimensions |
| **Priority** | Must Have |
| **Source** | Excel formulas trong các sheet báo cáo |

---

#### BR-003: Interactive Dashboard với KPI Cards và Trend Charts

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | BR-003 |
| **Tên** | Dashboard tương tác với KPI cards và biểu đồ xu hướng |
| **Mô tả** | Dashboard hiển thị các KPI quan trọng dưới dạng cards có sparkline, kèm theo biểu đồ xu hướng theo thời gian. Visual quality phải tương đương Tableau Customer Support Case Demo |
| **Lý do** | Cung cấp visibility tức thì cho management, hỗ trợ ra quyết định |
| **Acceptance Criteria** | - Minimum 5 KPI cards: Total Events, Downtime Minutes, Closure Rate %, Severe Incidents, Open/In-Progress Count<br>- Mỗi card có sparkline 12 tuần gần nhất<br>- Có YoY/WoW delta badge (mũi tên xanh/đỏ + %)<br>- Charts interactive (hover tooltip, click drill-down) |
| **Priority** | Must Have |
| **Source** | Tableau reference + 01_DASHBOARD |

**Dashboard Reference Image:**

Xem mô tả dashboard tham chiếu tại: [docs/references/dashboard_reference.md](references/dashboard_reference.md)

*Link tham khảo: https://public.tableau.com/app/profile/ellen4268/viz/CustomerSupportCaseDemo/CustomerSupportCases*

---

#### BR-004: Weekly Report Matrix (Tương đương 04_BAO_CAO_TUAN)

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | BR-004 |
| **Tên** | Báo cáo ma trận tuần |
| **Mô tả** | Hiển thị matrix report với rows = locations (KDAMB, KDAMN, Offshore, HO), columns = categories, cells = danh sách mô tả events |
| **Lý do** | Đây là format báo cáo chính được gửi lên management hàng tuần |
| **Acceptance Criteria** | - Layout giống hệt 04_BAO_CAO_TUAN<br>- Column header hiển thị count badge khi > 0<br>- Bad categories header màu đỏ, Good categories header màu xanh lá<br>- Cell content là bullet list các event descriptions |
| **Priority** | Must Have |
| **Source** | Excel sheet 04_BAO_CAO_TUAN |

---

#### BR-005: Good/Bad News Classification

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | BR-005 |
| **Tên** | Phân loại sự kiện theo tính chất Good/Bad News |
| **Mô tả** | Mỗi event được phân loại là good_news, bad_news, hoặc neutral. Classification có thể được gợi ý tự động dựa trên category nhưng user có quyền override |
| **Lý do** | Hỗ trợ highlight các thành tích (good) và cảnh báo rủi ro (bad) trong báo cáo |
| **Acceptance Criteria** | - Default classification theo category mapping từ 03_DANH_MUC<br>- User có thể override classification per event<br>- Visual indicator rõ ràng (icon/color) trên danh sách<br>- Filter/Group by classification trên dashboard |
| **Priority** | Must Have |
| **Source** | Business logic từ 03_DANH_MUC |

---

#### BR-006: Export to PDF/Excel

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | BR-006 |
| **Tên** | Xuất báo cáo ra PDF và Excel |
| **Mô tả** | Hỗ trợ export Weekly Matrix Report ra PDF (format A3 landscape) và event log ra Excel (.xlsx) giữ nguyên format cột như file gốc |
| **Lý do** | Đáp ứng yêu cầu gửi báo cáo qua email, lưu trữ offline |
| **Acceptance Criteria** | - PDF export đẹp, đúng format A3 landscape<br>- Excel export mapping đúng với cột B-W của 02_NHAT_KY<br>- Export hoàn thành trong < 10 giây cho 500 records<br>- File name tự động format: ISD_WeeklyReport_W##_YYYY.pdf |
| **Priority** | Must Have |
| **Source** | Current workflow |

---

#### BR-007: Role-based Access Control

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | BR-007 |
| **Tên** | Phân quyền truy cập theo vai trò |
| **Mô tả** | Hệ thống phân quyền với ít nhất 3 roles: Admin, Editor, Viewer. Mỗi role có permission khác nhau |
| **Lý do** | Bảo mật dữ liệu, kiểm soát ai được phép sửa đổi |
| **Acceptance Criteria** | - **Admin**: Full access, manage users, manage categories<br>- **Editor**: CRUD events, view all reports<br>- **Viewer**: Read-only dashboard và reports<br>- Login required cho tất cả access |
| **Priority** | Must Have |
| **Source** | Security requirements |

---

#### BR-008: Multi-location Support

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | BR-008 |
| **Tên** | Hỗ trợ đa địa điểm |
| **Mô tả** | Hệ thống hỗ trợ 4 locations: KDAMB, KDAMN, Offshore, HO. Mỗi event phải thuộc một location |
| **Lý do** | Phản ánh cơ cấu tổ chức thực tế của đội ISD |
| **Acceptance Criteria** | - Location là required field khi tạo event<br>- Dashboard có thể filter theo location<br>- Weekly matrix hiển thị breakdown theo location<br>- Admin có thể thêm/sửa locations |
| **Priority** | Must Have |
| **Source** | 03_DANH_MUC, organizational structure |

**Locations hiện tại:**

| Code | Tên đầy đủ |
|------|------------|
| KDAMB | Khu Dữ Liệu A - Miền Bắc |
| KDAMN | Khu Dữ Liệu A - Miền Nam |
| Offshore | Offshore Team |
| HO | Head Office |

---

#### BR-009: Time Range Selector Driving All Views

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | BR-009 |
| **Tên** | Bộ chọn thời gian linh động điều khiển toàn bộ views |
| **Mô tả** | Một time range selector ở vị trí prominent trên giao diện, hỗ trợ nhiều mức độ granularity (tuần/tháng/quý/năm), khi thay đổi sẽ cập nhật đồng bộ tất cả components: KPI cards, charts, matrix, detail table |
| **Lý do** | Đảm bảo consistency và hỗ trợ phân tích đa chiều — theo tuần cho báo cáo vận hành, theo tháng/quý/năm cho phân tích xu hướng và executive review |
| **Acceptance Criteria** | - Hỗ trợ granularity: **Tuần** (W01-W53), **Tháng** (T1-T12), **Quý** (Q1-Q4), **Năm** (2024-2026+)<br>- Support single period và range (ví dụ: W01-W04, T1-T3, Q1-Q2)<br>- Preset options: Tuần này, 4 tuần gần nhất, Tháng này, Quý này, Năm nay, YTD<br>- Tất cả components phản ứng trong < 500ms (debounce 300ms)<br>- Display format thay đổi theo granularity: "Tuần 03 (13-19/01/2026)" / "Tháng 1/2026" / "Q1 2026" / "Năm 2026" |
| **Priority** | Must Have |
| **Source** | UX requirement + Management reporting needs |

---

#### BR-010: Data Import from Existing Excel (Migration)

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | BR-010 |
| **Tên** | Import dữ liệu từ file Excel hiện có |
| **Mô tả** | Hỗ trợ upload và import dữ liệu từ file Excel hiện tại vào hệ thống mới để migration dữ liệu lịch sử |
| **Lý do** | Không mất dữ liệu lịch sử, continuity trong reporting |
| **Acceptance Criteria** | - Upload file .xlsx<br>- Tự động mapping cột từ header names của 02_NHAT_KY<br>- Preview imported rows trước khi confirm<br>- Duplicate detection: (year + week + location + description)<br>- Rollback nếu import fail giữa chừng |
| **Priority** | Must Have |
| **Source** | Migration requirement |

---

#### BR-011: Flexible Field Management (Quản lý thuộc tính linh động)

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | BR-011 |
| **Tên** | Quản lý thuộc tính/trường thông tin linh động |
| **Mô tả** | Admin có thể định nghĩa, thêm, ẩn/hiện, hoặc hiệu chỉnh các trường thông tin tùy chỉnh (custom fields) cho events. Các trường cốt lõi (week, date, location, category, severity, status, description) luôn cố định và không thể xóa. Custom fields được lưu dưới dạng JSON linh động trong DB |
| **Lý do** | Nghiệp vụ thay đổi theo thời gian — cần có khả năng mở rộng schema mà không cần deploy lại hệ thống |
| **Acceptance Criteria** | - Admin có thể tạo custom field với: tên hiển thị, kiểu dữ liệu (text/number/select/date/boolean), bắt buộc hay không, thứ tự hiển thị<br>- Với kiểu 'select': Admin định nghĩa danh sách options<br>- Custom fields xuất hiện trong event form và event list (optional columns)<br>- Custom fields có thể ẩn/hiện (không xóa để giữ data lịch sử)<br>- Validation tự động theo field type khi nhập liệu<br>- Export Excel/PDF bao gồm active custom fields |
| **Priority** | **Should Have — v1.1** (Schema Excel hiện tại đã đủ cho v1.0; defer để đảm bảo go-live đúng tiến độ) |
| **Source** | Yêu cầu linh động từ đội ISD |

---

### 3.2 Business Requirements Summary Table

| ID | Tên ngắn | Priority | Complexity | Dependencies |
|----|----------|----------|------------|--------------|
| BR-001 | Single Data Entry | Must | Medium | - |
| BR-002 | Auto-aggregation | Must | Medium | BR-001 |
| BR-003 | Interactive Dashboard | Must | High | BR-001, BR-002 |
| BR-004 | Weekly Report Matrix | Must | Medium | BR-001, BR-002 |
| BR-005 | Good/Bad Classification | Must | Low | BR-001 |
| BR-006 | Export PDF/Excel | Must | Medium | BR-004 |
| BR-007 | Role-based Access | Must | Medium | - |
| BR-008 | Multi-location | Must | Low | BR-001 |
| BR-009 | Time Range Selector (tuần/tháng/quý/năm) | Must | Medium | BR-003, BR-004 |
| BR-010 | Data Import | Must | High | BR-001 |
| BR-011 | Flexible Field Management | **Should** (v1.1) | Medium | BR-001, BR-007 |

---

## 4. CONSTRAINTS & ASSUMPTIONS

### 4.1 Constraints (Ràng buộc)

| ID | Constraint | Loại | Tác động |
|----|------------|------|----------|
| CON-001 | Internal network deployment (on-premise hoặc private cloud) | Technical | Không cần thiết kế cho public internet access |
| CON-002 | Giao diện tiếng Việt là chính, tiếng Anh là phụ | Business | Cần i18n framework, mặc định vi-VN |
| CON-003 | Không có DBA chuyên trách | Resource | Solution phải self-contained, minimal DB admin |
| CON-004 | **< 20 người dùng đồng thời** (thực tế đội ISD) | Scale | Không cần horizontal scaling; SQLite WAL mode đủ đáp ứng |
| CON-005 | Budget hạn chế | Financial | Ưu tiên open-source stack |

### 4.2 Assumptions (Giả định)

| ID | Assumption | Risk nếu sai |
|----|------------|--------------|
| ASM-001 | Users có máy tính với browser hiện đại (Chrome/Edge/Firefox) | Cần fallback cho IE nếu có |
| ASM-002 | Network nội bộ đủ bandwidth (>10 Mbps) | Cần optimize nếu bandwidth thấp |
| ASM-003 | Dữ liệu Excel hiện tại clean, không có inconsistency lớn | Cần data cleaning nếu dirty data |
| ASM-004 | Users được training trước khi go-live | Adoption thấp nếu không training |
| ASM-005 | IT Admin có thể quản lý Docker containers | Cần training Docker nếu không |

---

## 5. OUT OF SCOPE (v1.0)

Các tính năng sau đây **KHÔNG** nằm trong phạm vi phiên bản 1.0:

| Feature | Lý do loại trừ | Dự kiến version |
|---------|----------------|-----------------|
| Mobile native app (iOS/Android) | Không đủ resource, low priority | v2.0 |
| Real-time notifications (push/email) | Complexity cao, cần notification service | v2.0 |
| Integration với OpenProject API | Cần API documentation từ OpenProject | v2.0 |
| Multi-language UI (ngoài VI/EN) | Không có nhu cầu hiện tại | v3.0 |
| Advanced analytics (ML/AI predictions) | Phức tạp, cần data scientist | v3.0 |
| Offline mode | Cần service worker, complexity cao | v2.0 |
| Custom report builder | Thời gian phát triển dài | v2.0 |

---

## 6. APPENDIX

### 6.1 Glossary

| Thuật ngữ | Định nghĩa |
|-----------|------------|
| Event | Một sự kiện/công việc được ghi nhận trong hệ thống (tương đương 1 row trong 02_NHAT_KY) |
| KPI | Key Performance Indicator - Chỉ số đánh giá hiệu suất |
| Week Code | Mã tuần format W## (W01-W53) |
| Location | Địa điểm/site: KDAMB, KDAMN, Offshore, HO |
| Main Group | Nhóm chính của sự kiện (5 nhóm) |
| Category | Danh mục con thuộc Main Group |
| Classification | Phân loại: good_news, bad_news, neutral |
| Dashboard | Bảng điều khiển hiển thị tổng quan KPIs và charts |
| Matrix Report | Báo cáo dạng ma trận (rows x columns) |

### 6.2 Reference Documents

1. **Excel Template**: `BS24_ISD_Operations_Template_2026.xlsx`
   - Sheet 02_NHAT_KY: Data entry log
   - Sheet 03_DANH_MUC: Master data/Reference
   - Sheet 04_BAO_CAO_TUAN: Weekly matrix report
   - Sheet 99_KPI_TUAN: KPI aggregation by week
   - Sheet 01_DASHBOARD: Summary dashboard

2. **Dashboard Reference**: Tableau Customer Support Case Demo
   - URL: https://public.tableau.com/app/profile/ellen4268/viz/CustomerSupportCaseDemo/CustomerSupportCases

### 6.3 Excel Column Mapping (02_NHAT_KY)

| Cột Excel | Tên cột | Mapping to Entity Field |
|-----------|---------|------------------------|
| B | Tuần | week |
| C | Ngày | date |
| D | Địa điểm | location |
| E | Nhóm chính | main_group |
| F | Danh mục | category |
| G | Hệ thống/Component | system_component |
| H | Khách hàng/Tenant | customer_tenant |
| I | Mức độ nghiêm trọng | severity |
| J | Trạng thái | status |
| K | Người xử lý | assignee |
| L | OpenProject ID | openproject_id |
| M | Mô tả | description |
| N | Thời gian downtime (phút) | downtime_minutes |
| O | Phân loại | classification |
| P | Ngày tạo | created_at |
| Q | Ngày cập nhật | updated_at |

### 6.4 Category Taxonomy (03_DANH_MUC)

**Main Groups và Categories:**

| Main Group | Category | Default Classification |
|------------|----------|----------------------|
| **Ổn định hệ thống** | Sự cố/Lỗi | bad_news |
| | Downtime | bad_news |
| | Cải thiện | good_news |
| | Bảo trì | neutral |
| **An toàn thông tin** | Mối đe dọa | bad_news |
| | Cải thiện bảo mật | good_news |
| | Audit/Compliance | neutral |
| **Tối ưu hóa** | Automation | good_news |
| | Performance tuning | good_news |
| | Cost optimization | good_news |
| **Biến động nhân sự** | Onboarding | neutral |
| | Offboarding | neutral |
| | Training | good_news |
| **Dự án** | Triển khai mới/Mở rộng | good_news |
| | POC/Pilot | neutral |
| | Project milestone | good_news |

---

## Document Control

| Action | Date | Author | Notes |
|--------|------|--------|-------|
| Created | 23/02/2026 | ISD Team | Initial version |
| Reviewed | - | - | Pending |
| Approved | - | - | Pending |

---

*End of Business Requirements Document*
