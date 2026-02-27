// Chart color constants — Apache ECharts (echarts-for-react)

export const CHART_COLORS = [
  '#3b82f6', // blue-500     — primary
  '#ef4444', // red-500      — critical/bad
  '#f59e0b', // amber-500    — warning
  '#10b981', // emerald-500  — good/resolved
  '#8b5cf6', // violet-500   — secondary
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#84cc16', // lime-500
];

export const CLASSIFICATION_COLORS = {
  Good: '#10b981', // emerald-500
  Bad:  '#ef4444', // red-500
};

// JIS Z 9103:2018 — 安全色 (Safety colors for IT severity)
export const SEVERITY_COLORS = {
  Critical: '#C00000', // JIS 赤  — Nguy hiểm (危険)
  High:     '#FF6600', // JIS 橙  — Cảnh báo (警告)
  Medium:   '#FFC000', // JIS 黄  — Chú ý (注意)
  Low:      '#70AD47', // JIS 緑  — An toàn (安全)
};

export const STATUS_COLORS = {
  Open:        '#2563eb', // blue-600
  'In Progress': '#7c3aed', // violet-600
  Resolved:    '#16a34a', // green-600
  Closed:      '#6b7280', // gray-500
};

// JIS Q 31000:2019 — Risk level colors (align with severity)
export const RISK_LEVEL_COLORS: Record<string, string> = {
  Critical: '#C00000', // riskScore 13–16 — 要緊急対応
  High:     '#FF6600', // riskScore  9–12 — 要低減措置
  Medium:   '#FFC000', // riskScore  5– 8 — 要監視
  Low:      '#70AD47', // riskScore  1– 4 — 許容範囲
};

// 16-color qualitative palette (ColorBrewer-inspired) — distinct regardless of classification
// Used by TrendChart so each category gets a stable, unique color across renders.
export const CATEGORY_PALETTE: string[] = [
  '#e41a1c', '#377eb8', '#4daf4a', '#984ea3',
  '#ff7f00', '#a65628', '#f781bf', '#999999',
  '#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3',
  '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3',
];

// Bubble size weights for Impact Scope (影響範囲) in Risk Matrix
export const IMPACT_SCOPE_WEIGHTS: Record<string, number> = {
  Individual: 15,  // 個人
  Team:       25,  // チーム
  Project:    30,  // プロジェクト (inhouse/partner project)
  Site:       35,  // 拠点 (default)
  MultiSite:  50,  // 複数拠点
  Enterprise: 70,  // 全社
  External:   85,  // 外部 (partners, customers)
};
