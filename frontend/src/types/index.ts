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
