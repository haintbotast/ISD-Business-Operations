// Shared TypeScript types and DTOs for ISD-OMS backend

// ─── Error Classes ───────────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ─── Auth Types ──────────────────────────────────────────────────────────────

export interface JwtPayload {
  id: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

// ─── Event DTOs ──────────────────────────────────────────────────────────────

export interface CreateEventDto {
  year: number;
  weekCode: string;
  date: string; // ISO date string — converted to DateTime in service
  locationCode: string;
  mainGroup: string;
  category: string;
  systemComponent?: string;
  description: string;
  impact?: string;
  rootCause?: string;
  resolution?: string;
  downtimeMinutes?: number;
  classification: string; // "Good" | "Bad"
  severity?: string;
  status?: string;
}

export interface UpdateEventDto extends Partial<CreateEventDto> {
  version: number; // Required for OCC — client must send current version
}

// ─── API Response Shape ──────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  code?: string;
  message?: string;
  details?: unknown;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

// ─── Query Filters ───────────────────────────────────────────────────────────

export interface EventFilters {
  page?: number;
  limit?: number;
  year?: number;
  weekCode?: string;
  locationCode?: string;
  mainGroup?: string;
  category?: string;
  status?: string;
  classification?: string;
  search?: string;
}

// ─── Dashboard DTOs ───────────────────────────────────────────────────────────

export type DashboardGranularity = 'week' | 'month' | 'quarter' | 'year';
export type DashboardMetricFilter = 'all' | 'open' | 'severe' | 'downtime' | 'closure';

export interface DashboardQueryParams {
  granularity: DashboardGranularity;
  year: number;
  periodStart: string;
  periodEnd: string;
  locationCode?: string;
  metricFilter: DashboardMetricFilter;
}

export interface KpiMetric {
  value: number;
  deltaPct: number;
  sparkline: number[];
}

export interface DashboardSummaryResponse {
  kpis: {
    totalEvents: KpiMetric;
    downtimeMinutes: KpiMetric;
    closureRate: KpiMetric;
    severeIncidents: KpiMetric;
    openInProgress: KpiMetric;
  };
  statusDistribution: {
    all: { count: number; pct: number };
    low: { count: number; pct: number; open: number; closed: number };
    medium: { count: number; pct: number; open: number; closed: number };
    high: { count: number; pct: number; open: number; closed: number };
    critical: { count: number; pct: number; open: number; closed: number };
  };
  detailRows: Array<{
    id: string;
    date: string;
    weekCode: string;
    locationCode: string;
    systemComponent: string | null;
    description: string;
    severity: string;
    status: string;
    daysOpen: number;
  }>;
}

export interface DashboardChartResponse {
  xAxis: string[];
  series: Array<{
    name: string;
    classification: 'Good' | 'Bad';
    data: number[];
  }>;
}

// ─── Weekly Matrix ────────────────────────────────────────────────────────────

export interface WeeklyMatrixCell {
  id: string;
  description: string;
  severity: string;
  status: string;
  downtimeMinutes: number | null;
}

export interface WeeklyMatrixResponse {
  week: string;
  year: number;
  weekRange: string;
  locations: string[];
  categories: Array<{
    mainGroup: string;
    category: string;
    classification: 'Good' | 'Bad';
  }>;
  cells: Record<string, WeeklyMatrixCell[]>;
}

// ─── KPI Trend ────────────────────────────────────────────────────────────────

export interface KpiTrendRow {
  period: string;
  totalEvents: number;
  downtimeMinutes: number;
  closureRate: number;
  severeIncidents: number;
  openInProgress: number;
}

export interface KpiTrendResponse {
  granularity: DashboardGranularity;
  year: number;
  currentPeriod: string;
  columns: string[];
  rows: KpiTrendRow[];
}

// ─── Import ───────────────────────────────────────────────────────────────────

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

export interface ImportPreviewResponse {
  total: number;
  valid: number;
  duplicates: number;
  parseErrors: number;
  previewRows: ImportPreviewRow[];
}

export interface ImportExecuteResponse {
  imported: number;
  skipped: number;
  replaced: number;
  errors: number;
  errorDetails: Array<{ rowNumber: number; error: string }>;
}

// ─── User Management ──────────────────────────────────────────────────────────

export interface UserDto {
  id: string;
  username: string;
  displayName: string;
  role: string;
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
