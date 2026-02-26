// ─── Impact Scope (影響範囲 / JIS Q 31000) ────────────────────────────────────

export type ImpactScope = 'Individual' | 'Team' | 'Site' | 'MultiSite' | 'Enterprise';

// ─── Risk Matrix (リスクマトリクス / JIS Q 31000) ─────────────────────────────

export interface RiskMatrixItem {
  category: string;
  mainGroup: string;
  eventCount: number;
  maxSeverity: string;
  impact: number;          // 1–4 (Low→Critical)
  impactLabel: string;
  likelihood: number;      // 1–4 (Rare→Likely)
  likelihoodLabel: string;
  riskScore: number;       // impact × likelihood, range 1–16
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  dominantScope: ImpactScope;
  classification: 'Good' | 'Bad' | 'Neutral';
}

export interface RiskMatrixData {
  period: string;
  items: RiskMatrixItem[];
}

// ─── Pareto Analysis (パレート図 / JIS Z 8115) ────────────────────────────────

export interface ParetoItem {
  category: string;
  mainGroup: string;
  classification: 'Good' | 'Bad' | 'Neutral';
  count: number;
  percentage: number;   // % of total
  cumulative: number;   // cumulative % (sorted desc)
  weeksAppeared: number;    // distinct weeks this category appeared in the year (closed included)
}

export interface ParetoData {
  period: string;
  total: number;
  totalWeeksInYear: number; // distinct weeks with any data in the year
  items: ParetoItem[];
}

// ─── Domain Models ────────────────────────────────────────────────────────────

export interface Event {
  id: string;
  year: number;
  weekCode: string;
  date: string;                   // ISO string
  locationCode: string;
  mainGroup: string;
  category: string;
  systemComponent?: string;
  description: string;
  impact?: string;
  rootCause?: string;
  resolution?: string;
  downtimeMinutes?: number;
  classification: 'Good' | 'Bad' | 'Neutral';
  impactScope: ImpactScope;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  version: number;               // OCC — include in every PUT payload
  deletedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationMaster {
  id: string;
  code: string;
  fullName: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CategoryMaster {
  id: string;
  mainGroup: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  isActive: boolean;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiList<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ApiError {
  success: false;
  code: string;
  message: string;
  details?: unknown[];
}

// ─── Form DTOs ────────────────────────────────────────────────────────────────

export interface CreateEventDto {
  year: number;
  weekCode: string;
  date: string;
  locationCode: string;
  mainGroup: string;
  category: string;
  systemComponent?: string;
  description: string;
  impact?: string;
  rootCause?: string;
  resolution?: string;
  downtimeMinutes?: number;
  classification: 'Good' | 'Bad' | 'Neutral';
  impactScope?: ImpactScope;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
}

export interface UpdateEventDto extends CreateEventDto {
  version: number;               // OCC — required for PUT
}

// ─── Filter / Query ───────────────────────────────────────────────────────────

export interface EventFilters {
  page?: number;
  limit?: number;
  year?: number;
  weekCode?: string;
  locationCode?: string;
  mainGroup?: string;
  category?: string;
  classification?: 'Good' | 'Bad';
  severity?: string;
  status?: string;
  search?: string;
}

// ─── Dashboard Types ──────────────────────────────────────────────────────────

export type DashboardGranularity = 'week' | 'month' | 'quarter' | 'year';
export type DashboardMetricFilter = 'all' | 'open' | 'severe' | 'downtime' | 'closure';

export interface DashboardQueryParams {
  granularity: DashboardGranularity;
  year: number;
  periodStart: string;
  periodEnd: string;
  locationCode?: string;
}

export interface DashboardKpiMetric {
  value: number;
  deltaPct: number;
  sparkline: number[];
}

export interface DashboardSummaryData {
  kpis: {
    totalEvents: DashboardKpiMetric;
    downtimeMinutes: DashboardKpiMetric;
    closureRate: DashboardKpiMetric;
    severeIncidents: DashboardKpiMetric;
    openInProgress: DashboardKpiMetric;
  };
  statusDistribution: {
    all: { count: number; pct: number };
    low: { count: number; pct: number; open: number; closed: number };
    medium: { count: number; pct: number; open: number; closed: number };
    high: { count: number; pct: number; open: number; closed: number };
    critical: { count: number; pct: number; open: number; closed: number };
  };
  detailRows: DashboardDetailRow[];
}

export interface DashboardDetailRow {
  id: string;
  date: string;
  weekCode: string;
  locationCode: string;
  systemComponent: string | null;
  description: string;
  severity: string;
  status: string;
  daysOpen: number;
}

export interface DashboardChartSeries {
  name: string;
  classification: 'Good' | 'Bad' | 'Neutral';
  data: number[];
}

export interface DashboardChartData {
  xAxis: string[];
  series: DashboardChartSeries[];
}

// ─── Weekly Matrix Types ───────────────────────────────────────────────────────

export interface WeeklyMatrixCell {
  id: string;
  description: string;
  severity: string;
  status: string;
  downtimeMinutes: number | null;
  classification: 'Good' | 'Bad' | 'Neutral';
}

export interface WeeklyMatrixData {
  week: string;
  year: number;
  weekRange: string;
  locations: string[];
  categories: Array<{
    mainGroup: string;
    category: string;
  }>;
  cells: Record<string, WeeklyMatrixCell[]>;
}

// ─── KPI Trend Types ──────────────────────────────────────────────────────────

export interface KpiTrendRow {
  period: string;
  totalEvents: number;
  downtimeMinutes: number;
  closureRate: number;
  severeIncidents: number;
  openInProgress: number;
}

export interface KpiTrendData {
  granularity: DashboardGranularity;
  year: number;
  currentPeriod: string;
  columns: string[];
  rows: KpiTrendRow[];
}

// ─── Import Types ─────────────────────────────────────────────────────────────

export interface ImportPreviewRow {
  rowNumber: number;
  weekCode: string;
  date: string;
  locationCode: string;
  mainGroup: string;
  category: string;
  description: string;
  isDuplicate: boolean;
  parseError?: string;
}

export interface ImportPreviewData {
  total: number;
  valid: number;
  duplicates: number;
  parseErrors: number;
  previewRows: ImportPreviewRow[];
}

export interface ImportExecuteData {
  imported: number;
  skipped: number;
  replaced: number;
  errors: number;
  errorDetails: Array<{ rowNumber: number; error: string }>;
}

// ─── User Management Types ────────────────────────────────────────────────────

export interface UserDto {
  id: string;
  username: string;
  displayName: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserDto {
  username: string;
  password: string;
  displayName: string;
  role: 'Admin' | 'Editor' | 'Viewer';
}

export interface UpdateUserDto {
  displayName?: string;
  role?: 'Admin' | 'Editor' | 'Viewer';
  isActive?: boolean;
}
