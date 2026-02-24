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

export const SEVERITY_COLORS = {
  Critical: '#dc2626', // red-600
  High:     '#ea580c', // orange-600
  Medium:   '#d97706', // amber-600
  Low:      '#16a34a', // green-600
};

export const STATUS_COLORS = {
  Open:        '#2563eb', // blue-600
  'In Progress': '#7c3aed', // violet-600
  Resolved:    '#16a34a', // green-600
  Closed:      '#6b7280', // gray-500
};
