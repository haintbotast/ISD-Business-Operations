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
