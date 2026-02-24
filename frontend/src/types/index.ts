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
  classification: 'Good' | 'Bad';
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
  classification: 'Good' | 'Bad';
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
  classification: 'Good' | 'Bad';
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
  classification: 'Good' | 'Bad';
  data: number[];
}

export interface DashboardChartData {
  xAxis: string[];
  series: DashboardChartSeries[];
}
