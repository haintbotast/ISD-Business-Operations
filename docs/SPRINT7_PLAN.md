# Sprint 7 — Dashboard UX & Analytics Improvements

> **Mục tiêu:** Nâng chất lượng Dashboard Overview: KPI có ngữ cảnh SLA, màu sắc biểu đồ rõ ràng,
> Top Issues phản ánh vấn đề lặp lại thực sự, Detail Table có bộ lọc nhanh.

---

## 1. KPI Card — Downtime & Closure Rate phải có ngữ cảnh SLA

### Vấn đề hiện tại
- **Downtime** hiển thị số phút thô (e.g. "0" hay "126") — người dùng không biết con số đó tốt hay xấu.
- **Closure Rate** hiển thị % — không có target để so sánh.

### Yêu cầu
| KPI | Hiển thị đề xuất | SLA default |
|-----|-----------------|-------------|
| Downtime | **Uptime %** (e.g. "99.8%") + phụ đề "X phút / SLA ≤ Y phút" | 99.5% (≈ 50 phút/tuần) |
| Closure Rate | **X% / Target ≥ Z%** với màu đỏ nếu dưới target | Target 80% |

**Cách tính Uptime %:**
```
Uptime % = 100 − (totalDowntimeMin / periodTotalMin) × 100
periodTotalMin:
  week  = 7 × 24 × 60 = 10,080 min
  month = 30 × 24 × 60 = 43,200 min (approx)
  quarter = 91 × 24 × 60 ≈ 130,000 min
  year  = 365 × 24 × 60 = 525,600 min
```

**SLA config** — thêm file cấu hình (không hardcode):
```ts
// frontend/src/lib/slaConfig.ts
export const SLA_CONFIG = {
  uptimePct: 99.5,          // target uptime %
  closureRatePct: 80,        // target closure rate %
  severeIncidentTarget: 0,   // target severe incidents (aspirational)
};
```

### Checklist implementation
- [ ] **`frontend/src/lib/slaConfig.ts`** — tạo mới: `SLA_CONFIG` object
- [ ] **`frontend/src/components/dashboard/KpiCard/KpiCard.tsx`** — thêm prop `slaTarget?: number` + `slaLabel?: string`
  - Nếu có `slaTarget`: hiển thị progress-bar màu xanh/đỏ bên dưới value
  - Format: `value / slaTarget` hoặc chỉ màu đỏ khi vượt ngưỡng
- [ ] **`frontend/src/pages/DashboardPage.tsx`** (hoặc nơi gọi KpiCard) — truyền SLA props vào card Downtime và Closure Rate:
  - Downtime card: chuyển `value` từ "phút thô" sang "uptime %" trước khi hiển thị
  - Thêm sub-label: "X phút / ≤ Y phút (SLA)"
- [ ] **`backend/src/services/dashboard.service.ts`** — thêm `periodTotalMinutes` vào response của `getSummary()` để frontend tính uptime %
  - hoặc tính sẵn `uptimePct` trong backend

---

## 2. Top Issues — Hiển thị vấn đề lặp lại thực sự (không phải catalog chung chung)

### Vấn đề hiện tại
- TopIssues dùng Pareto API group by `category` → "Tác động hệ thống" (6 lần) là quá chung chung
- Không phân biệt được "sự cố lặp lại" vs "nhiều loại sự cố khác nhau trong cùng bucket"

### Phân tích root cause
Pareto API group by `(mainGroup, category)`. "Tác động hệ thống" là category bao gồm 6 sự kiện khác nhau:
- Thiết lập GPO, cập nhật T3, setup Gogoro... — không phải cùng 1 vấn đề lặp lại.

### Giải pháp đề xuất
**Thay đổi grouping key của Pareto/TopIssues từ `category` → `(category, systemComponent)`**

Kết quả mới sẽ trông như:
```
1. Telehub T3 Platform / Tác động hệ thống   ← 8 sự kiện
2. Security Monitoring / Mối đe dọa          ← 3 sự kiện
3. Backup System / Sao lưu/DR                ← 3 sự kiện
```
Thay vì:
```
1. Tác động hệ thống                         ← 6 sự kiện (quá chung)
```

**Bổ sung:** Chỉ hiển thị `classification = 'Bad'` trong Top Issues (vì "Sao lưu/dự phòng" là Good News — không nên nằm trong "Vấn đề nổi bật").

### Checklist implementation

**Backend:**
- [ ] **`backend/src/services/reports.service.ts`** — `getPareto()`:
  - Thay group by `category` → group by `(category, systemComponent)`
  - Thêm filter: chỉ lấy `classification = 'Bad'` cho endpoint được dùng bởi TopIssues
  - Hoặc thêm query param `?classificationFilter=Bad` để frontend tự chọn
  - Cập nhật `ParetoItem` type: thêm field `systemComponent?: string`
- [ ] **`backend/src/routes/reports.routes.ts`** — thêm param `classificationFilter?: 'Bad' | 'all'`

**Frontend:**
- [ ] **`frontend/src/types/index.ts`** — `ParetoItem`: thêm `systemComponent?: string`
- [ ] **`frontend/src/hooks/useReports.ts`** — `usePareto()`: thêm param `classificationFilter?: string`
- [ ] **`frontend/src/components/dashboard/TopIssues/TopIssues.tsx`**:
  - Truyền `classificationFilter='Bad'` vào `usePareto()`
  - Hiển thị `systemComponent` bên dưới category name (thay cho `mainGroup`)
  - Label: `"[category] · [systemComponent]"` hoặc 2 dòng

---

## 3. Trend Chart — Màu sắc rõ ràng hơn, không phân trang legend

### Vấn đề hiện tại
1. **Màu quá đồng nhất**: Bad → tất cả đỏ (dark→light), Good → tất cả xanh lá → khó phân biệt
2. **Legend phân trang**: Hiện tại `legend.type: 'scroll'` → phải bấm mũi tên để xem hết → user bỏ qua
3. **Không nhất quán ngữ nghĩa**: "Cắt hủy" (hủy dịch vụ — Good outcome) được tô đỏ vì nằm trong nhóm Bad classification

### Giải pháp đề xuất
**Dùng palette màu riêng biệt cho từng category, độc lập với classification:**

```ts
// 16 màu phân biệt cao (ColorBrewer qualitative + custom)
const CATEGORY_PALETTE = [
  '#e41a1c', '#377eb8', '#4daf4a', '#984ea3',
  '#ff7f00', '#a65628', '#f781bf', '#999999',
  '#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3',
  '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3',
];
```

Classification vẫn có thể thể hiện qua:
- **Opacity**: Bad = 100%, Neutral = 70%, Good = 50% (hoặc đường kẻ khác)
- **Hoặc**: Dùng màu sắc như trên, thêm pattern/hatch fill cho Good

**Legend không phân trang — wrap toàn bộ:**
```ts
legend: {
  type: 'plain',      // ← đổi từ 'scroll' sang 'plain'
  orient: 'horizontal',
  bottom: 0,
  textStyle: { fontSize: 10 },
  // Không có pageButton, không có scrolling
}
```
Nếu legend quá dài → tăng chiều cao chart hoặc dùng layout 2 cột.

### Checklist implementation
- [ ] **`frontend/src/lib/colors.ts`** — thêm `CATEGORY_PALETTE: string[]` (16 màu phân biệt)
- [ ] **`frontend/src/components/dashboard/TrendChart/TrendChart.tsx`**:
  - Thay logic gán màu từ classification-based sang palette index-based
  - Gán màu theo thứ tự xuất hiện của series name (consistent across renders)
  - Đổi `legend.type` từ `'scroll'` → `'plain'`
  - Tăng height từ 320px → 360px hoặc 400px để chứa legend nhiều dòng
  - Xem xét dùng `legend.formatter` để rút ngắn tên dài
- [ ] **Review**: Đảm bảo màu đủ phân biệt trên màn hình nhỏ (test ≥ 8 categories cùng lúc)

---

## 4. Detail Table — Quick Filter Tags

### Vấn đề hiện tại
Table "Chi tiết sự kiện" không có bộ lọc → phải scroll qua tất cả 50 rows để tìm sự kiện theo thuộc tính.

### Yêu cầu
Thêm chip/tag filter bar phía trên table, lọc **client-side** (không gọi API thêm):

```
[Tất cả] [● Critical] [● High] [● Medium] [● Low]
[Tất cả] [Open] [In Progress] [Resolved] [Closed]
[Tất cả] [KDAMB] [KDAMN] [Offshore] [HO]
```

Mỗi dòng là 1 nhóm filter, chỉ chọn được 1 option/nhóm. Active chip có màu nền phù hợp với severity/status color.

### Checklist implementation
- [ ] **`frontend/src/components/dashboard/DetailTable/DetailTable.tsx`**:
  - Thêm state: `severityFilter`, `statusFilter`, `locationFilter`
  - Thêm component `FilterChips` (inline trong file hoặc separate):
    ```tsx
    <FilterChipGroup
      label="Mức độ"
      options={['Critical','High','Medium','Low']}
      value={severityFilter}
      onChange={setSeverityFilter}
      colorFn={severityColor}
    />
    ```
  - Filter `rows` prop trước khi render table
  - Thêm count badge trên mỗi chip: `High (3)`
  - Reset chips khi `rows` prop thay đổi (period change)

---

## 5. Bonus: KPI Card — Downtime subtitle

Bổ sung minor: KPI card Downtime nên hiển thị rõ đơn vị và ngữ cảnh:
- Dòng 1 (value lớn): `99.8%` (uptime)
- Dòng 2 (subtitle nhỏ): `0 phút downtime · SLA ≤ 50 phút/tuần`
- Màu delta: Xanh nếu uptime ≥ SLA target, đỏ nếu thấp hơn

---

## Thứ tự triển khai (priority order)

```
Step 1: colors.ts — CATEGORY_PALETTE (5 phút, unlock Step 2)
Step 2: TrendChart — màu + legend plain (30 phút)
Step 3: DetailTable — FilterChips (45 phút)
Step 4: slaConfig.ts + KpiCard SLA context (60 phút)
Step 5: backend Pareto grouping by (category, systemComponent) (45 phút)
Step 6: TopIssues — classificationFilter + systemComponent display (30 phút)
```

**Tổng ước tính: ~4 giờ dev**

---

## Files sẽ thay đổi

| File | Thay đổi |
|------|----------|
| `frontend/src/lib/colors.ts` | + `CATEGORY_PALETTE` |
| `frontend/src/lib/slaConfig.ts` | Tạo mới |
| `frontend/src/components/dashboard/TrendChart/TrendChart.tsx` | Màu, legend plain |
| `frontend/src/components/dashboard/DetailTable/DetailTable.tsx` | FilterChips |
| `frontend/src/components/dashboard/KpiCard/KpiCard.tsx` | SLA context prop |
| `frontend/src/pages/DashboardPage.tsx` | Truyền SLA props, tính uptimePct |
| `frontend/src/types/index.ts` | `ParetoItem.systemComponent?` |
| `frontend/src/hooks/useReports.ts` | `usePareto()` param classificationFilter |
| `frontend/src/components/dashboard/TopIssues/TopIssues.tsx` | classificationFilter, systemComponent |
| `backend/src/services/reports.service.ts` | Pareto group by (category, systemComponent) |
| `backend/src/routes/reports.routes.ts` | param classificationFilter |
| `frontend/src/i18n/vi.json` + `en.json` | Keys mới cho SLA label |

---

## Notes / Decisions

1. **SLA values** — Hiện tại hardcode trong `slaConfig.ts`. v1.1 có thể admin-configurable.
2. **Pareto classificationFilter** — TopIssues dùng `Bad` only; Reports page (Pareto full) vẫn dùng `all`.
3. **Trend Chart height** — Legend nhiều dòng cần chart cao hơn; test responsive trên tablet (768px).
4. **FilterChips reset** — Dùng `useEffect([rows])` để reset filters khi period thay đổi.
5. **Uptime calculation** — Dùng `periodTotalMinutes` từ backend để tránh sai lệch timezone.
