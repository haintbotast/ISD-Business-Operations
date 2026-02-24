# Dashboard Reference Guide
# ISD Operations Management System

---

## Tableau Customer Support Case Demo

**URL:** https://public.tableau.com/app/profile/ellen4268/viz/CustomerSupportCaseDemo/CustomerSupportCases

**Lưu ý:** Dashboard này được sử dụng làm tham chiếu về visual quality và interactivity cho ISD-OMS.

---

## Screenshot Reference

Hình ảnh đính kèm trong cuộc hội thoại thể hiện layout của Tableau Dashboard với các components sau:

### Left Panel - KPI Summary Cards

```
┌──────────────────────────────┐
│ Severe impact                │
│                              │
│    5 open ●              ▁▂▃ │
│    31 total ●            ▄▅▆ │
│                              │
│  ⬇ vs PY: -16.7%            │
└──────────────────────────────┘
┌──────────────────────────────┐
│ High impact                  │
│                              │
│    21 open ●             ▁▂▃ │
│    92 total ●            ▄▅▆ │
│                              │
│  ⬆ vs PY: +0.0%             │
└──────────────────────────────┘
┌──────────────────────────────┐
│ Medium impact                │
│                              │
│    25 open ●             ▁▂▃ │
│    108 total ●           ▄▅▆ │
│                              │
│  ⬆ vs PY: +50.0%            │
└──────────────────────────────┘
┌──────────────────────────────┐
│ Low impact                   │
│                              │
│    79 open ●             ▁▂▃ │
│    310 total ●           ▄▅▆ │
│                              │
│  ⬇ vs PY: -20.8%            │
└──────────────────────────────┘
```

### Center Panel - Status Distribution

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

### Right Panel - Stacked Bar Chart

- X-axis: Time periods (weeks/months)
- Y-axis: Case count (0-80)
- Colors: Stacked by category/severity
  - Purple/Pink tones for different severity levels
  - Blue tones for informational items

### Bottom Panel - Open Cases Breakdown Table

| # | Order ID | Customer Name | Description | Open Date | Days Open | Severity |
|---|----------|---------------|-------------|-----------|-----------|----------|
| 10 | CA-2021-122770 | Emily Phan | Case Description | 13/12/21 | 12 days | Low |
| 11 | CA-2021-129294 | Ken Dana | Case Description | 16/03/21 | 12 days | Low |
| 12 | CA-2021-133046 | Dennis Kane | Case Description | 27/07/21 | 12 days | Medium |
| 13 | CA-2021-137428 | Andy Yotov | Case Description | 16/12/21 | 12 days | Medium |
| ... | ... | ... | ... | ... | ... | ... |

**Features:**
- Sortable columns
- Severity badges (color-coded)
- "Sort by" dropdown (Days open)
- Days filter control (- [14 days] +)

---

## Color Scheme Extracted

### From Tableau Reference

| Element | Approximate Color | Hex Estimate |
|---------|-------------------|--------------|
| Severe (Dark Purple) | Dark violet | #8B4DA8 |
| High (Purple) | Medium purple | #B388B8 |
| Medium (Light Purple) | Light purple | #D4B8D8 |
| Low (Light Pink) | Pale pink | #F5E1F0 |
| Open indicator | Orange | #FF9500 |
| Closed indicator | Blue | #4A90D9 |
| Background | Light gray-blue | #F5F8FC |

### Adapted for ISD-OMS (Bad/Good News scheme)

| Usage | Color | Hex |
|-------|-------|-----|
| Bad News - Severe | Dark Red | #C00000 |
| Bad News - High | Medium Red | #FF6666 |
| Bad News - Medium | Light Red | #FF9999 |
| Bad News - Low | Pale Red | #FFCCCC |
| Good News - Major | Dark Green | #375623 |
| Good News - Normal | Green | #70AD47 |
| Good News - Minor | Light Green | #AADEAA |
| Good News - Subtle | Pale Green | #E2F0D9 |
| Neutral - Primary | Navy Blue | #1F4E79 |
| Neutral - Secondary | Blue | #2E75B6 |
| Neutral - Light | Light Blue | #9BC2E6 |
| Neutral - Subtle | Pale Blue | #BDD7EE |

---

## Interaction Patterns

### 1. KPI Card Click
- **Action:** Click on any KPI card
- **Result:** Detail table filters to show only items matching that category

### 2. Week Selector Change
- **Action:** Change week range in selector
- **Result:** All panels update simultaneously (KPI cards, chart, distribution, table)

### 3. Chart Bar Click
- **Action:** Click on a bar segment in stacked chart
- **Result:** Drill-down to filtered view for that week + category

### 4. Table Sort
- **Action:** Click column header or use "Sort by" dropdown
- **Result:** Table reorders by selected column

### 5. Status Toggle
- **Action:** Click Open/Closed toggle
- **Result:** Distribution and table filter by status

---

## Key Takeaways for Implementation

1. **Sparklines are essential** - Each KPI card must have a mini-chart showing trend
2. **Delta badges show change** - vs PY (previous year) or vs WoW (week over week)
3. **Color consistency** - Bad = red tones, Good = green tones, Neutral = blue tones
4. **Interactive everything** - All visual elements should respond to clicks/hovers
5. **Real-time updates** - Week selector changes reflect instantly across all views
6. **Professional aesthetics** - Clean design, proper spacing, consistent typography

---

*This reference guide should be used during implementation to ensure visual and functional parity with the Tableau demo.*
