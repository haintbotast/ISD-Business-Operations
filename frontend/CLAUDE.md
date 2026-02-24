# ISD-OMS Frontend — Claude Code Instructions

## Stack

React 18 + TypeScript + Vite + Shadcn/ui + Apache ECharts (`echarts-for-react`) + TanStack Query v5 + React Hook Form + Zod + react-i18next + Zustand + Axios + date-fns

> See root `CLAUDE.md` for global rules and project context.

## Directory Structure

```
frontend/src/
├── components/
│   ├── ui/                  # Shadcn/ui base components — do not modify
│   ├── dashboard/
│   │   ├── KpiCard/         # KPI card with sparkline + delta badge
│   │   ├── TrendChart/      # ECharts stacked bar (gradient fill)
│   │   ├── StatusDistribution/  # Donut/bar chart
│   │   ├── TimeRangeSelector/   # granularity: week/month/quarter/year
│   │   └── DetailTable/     # Drill-down table
│   ├── events/
│   │   ├── EventForm/       # Create/edit form (RHF + Zod + draft auto-save)
│   │   ├── EventList/       # Paginated table with filters
│   │   └── EventFilters/    # Filter panel
│   ├── reports/
│   │   ├── WeeklyMatrix/    # Equivalent to 04_BAO_CAO_TUAN sheet
│   │   └── KpiTrendTable/   # Equivalent to 99_KPI_TUAN sheet
│   └── shared/
│       ├── Layout/          # Main layout with sidebar + header
│       ├── Sidebar/
│       └── Header/
├── pages/                   # Route-level components (lazy-loaded)
│   ├── DashboardPage.tsx
│   ├── EventsPage.tsx
│   ├── ReportsPage.tsx
│   ├── ImportPage.tsx
│   ├── AdminPage.tsx        # Categories, Locations, Users
│   └── LoginPage.tsx
├── hooks/
│   ├── useEventStream.ts    # SSE subscription → TanStack Query invalidation
│   └── useAuth.ts           # Auth state
├── lib/
│   ├── api.ts               # Axios instance (baseURL, interceptors, auth header)
│   ├── colors.ts            # Chart color constants (match PRD Section 4.x)
│   └── utils.ts             # cn(), date formatters, week helpers
├── i18n/
│   ├── i18n.ts              # i18next config (vi default, en optional)
│   ├── vi.json              # Vietnamese strings
│   └── en.json              # English strings
├── store/
│   └── uiStore.ts           # Zustand: sidebar, modals, dashboard filters
└── types/
    └── index.ts             # Shared TypeScript interfaces
```

## Commands

```bash
npm run dev        # Vite dev server — http://localhost:3000
npm run build      # Production build → dist/
npm run preview    # Preview production build
npm run test       # Vitest (unit + component tests)
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit (no emit, type check only)
```

## Always / Never

### ALWAYS
- `useTranslation()` + `t('key')` for every string shown to user
- TanStack Query for all server state (fetching, mutating, caching)
- Zustand only for UI state (sidebar open/close, modal state, active filters)
- React Hook Form + Zod for all form validation — define Zod schema first
- Export each component via `index.ts` in its folder
- Use Shadcn/ui components — do not write UI primitives from scratch
- Use `cn()` from `lib/utils.ts` for conditional classNames
- Lazy-load page components with `React.lazy` + `Suspense`
- Add loading skeletons for all async data (TanStack Query `isLoading`)
- Include `version` in every PUT /events/:id mutation payload

### NEVER
- NEVER use `useEffect` for data fetching — use TanStack Query `useQuery`
- NEVER hardcode Vietnamese/English strings in JSX — use `t('key')`
- NEVER use Redux, Recoil, or Context for server state — use TanStack Query
- NEVER use `localStorage` for business data — server is source of truth
- NEVER use `recharts` — project uses Apache ECharts (`echarts-for-react`)
- NEVER use `useState` for filter state shared across dashboard — use Zustand store

## Code Patterns

### API Layer (lib/api.ts)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,  // For JWT httpOnly cookie
});

// Response interceptor: unwrap data, handle 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data ?? error);
  }
);

export default api;
```

### Fetch with TanStack Query

```typescript
// Simple list query
const { data, isLoading, error } = useQuery({
  queryKey: ['events', filters],  // filters in key → refetch on change
  queryFn: () => api.get('/events', { params: filters }).then(r => r.data.data),
  staleTime: 30_000,
});

// Paginated query
const { data } = useQuery({
  queryKey: ['events', { page, limit, ...filters }],
  queryFn: () => api.get('/events', { params: { page, limit, ...filters } })
    .then(r => r.data),  // { data: [...], pagination: { page, limit, total } }
  placeholderData: keepPreviousData,  // No flash between pages
});
```

### Mutation with TanStack Query

```typescript
const queryClient = useQueryClient();

const createMutation = useMutation({
  mutationFn: (data: CreateEventDto) => api.post('/events', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    toast.success(t('event.createSuccess'));
    navigate('/events');
  },
  onError: (error: ApiError) => {
    toast.error(error.message ?? t('common.error'));
  },
});
```

### OCC — Update event with version

```typescript
// Load event (version included in response)
const { data: event } = useQuery({
  queryKey: ['event', id],
  queryFn: () => api.get(`/events/${id}`).then(r => r.data.data),
});

// PUT with version
const updateMutation = useMutation({
  mutationFn: (formData: UpdateEventDto) =>
    api.put(`/events/${id}`, { ...formData, version: event!.version }),
  onError: (error: ApiError) => {
    if (error.code === 'EVENT_CONFLICT') {
      toast.warning(t('event.conflict'));
      queryClient.invalidateQueries({ queryKey: ['event', id] });  // Reload form
    }
  },
});
```

### Form with React Hook Form + Zod

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

const eventSchema = z.object({
  weekCode: z.string().min(1, t('validation.required')),
  date: z.string().min(1, t('validation.required')),
  locationCode: z.string().min(1, t('validation.required')),
  mainGroup: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(5, t('validation.minLength', { min: 5 })),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
  status: z.enum(['Open', 'In Progress', 'Resolved', 'Closed']),
});

type EventFormValues = z.infer<typeof eventSchema>;

const form = useForm<EventFormValues>({
  resolver: zodResolver(eventSchema),
  defaultValues: { weekCode: '', date: '', locationCode: '', status: 'Open' },
});
```

### Draft Auto-save (30s interval)

```typescript
// Inside EventForm component
const draftMutation = useMutation({
  mutationFn: (formData: Partial<EventFormValues>) =>
    api.post('/events/draft', { event_id: id ?? null, form_data: formData }),
});

useEffect(() => {
  const interval = setInterval(() => {
    const currentValues = form.getValues();
    if (form.formState.isDirty) {
      draftMutation.mutate(currentValues);
    }
  }, 30_000);
  return () => clearInterval(interval);
}, []);

// Restore draft on form open
const { data: draft } = useQuery({
  queryKey: ['draft', id ?? 'new'],
  queryFn: () => api.get('/events/draft', { params: { event_id: id ?? 'new' } })
    .then(r => r.data.data),
  enabled: !id || !!id,  // Always fetch on open
});

useEffect(() => {
  if (draft) {
    form.reset(draft.form_data);
    toast.info(t('event.draftRestored'));
  }
}, [draft]);
```

### ECharts — Stacked Bar (TrendChart)

```typescript
import ReactECharts from 'echarts-for-react';
import { CHART_COLORS } from '@/lib/colors';

const option = {
  color: CHART_COLORS,
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { bottom: 0 },
  grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
  xAxis: { type: 'category', data: xAxisLabels },
  yAxis: { type: 'value' },
  series: categories.map((cat) => ({
    name: cat.label,
    type: 'bar',
    stack: 'total',
    emphasis: { focus: 'series' },
    data: cat.data,
    itemStyle: {
      color: cat.color,
      borderRadius: cat.isLast ? [4, 4, 0, 0] : 0,
    },
  })),
};

<ReactECharts
  option={option}
  style={{ height: 300 }}
  opts={{ renderer: 'canvas' }}
/>
```

### ECharts — Sparkline (KpiCard)

```typescript
const sparklineOption = {
  grid: { left: 0, right: 0, top: 0, bottom: 0 },
  xAxis: { type: 'category', show: false, data: weeks },
  yAxis: { type: 'value', show: false },
  series: [{
    type: 'line',
    data: values,
    smooth: true,
    showSymbol: false,
    lineStyle: { color: color, width: 2 },
    areaStyle: { color: `${color}33` },  // 20% opacity
  }],
};

<ReactECharts option={sparklineOption} style={{ height: 48, width: 120 }} />
```

### SSE Hook (hooks/useEventStream.ts)

```typescript
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export function useEventStream() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const es = new EventSource('/api/v1/events/stream', { withCredentials: true });

    es.onmessage = (e) => {
      const { action, eventId } = JSON.parse(e.data);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (action === 'updated') {
        // Flag for EventForm to show warning if same event is open
        queryClient.setQueryData(['event-modified', eventId], true);
      }
    };

    es.onerror = () => { /* Browser auto-reconnects */ };

    return () => es.close();
  }, [user, queryClient]);
}

// Usage: call once in MainLayout.tsx
// useEventStream();
```

### i18n Setup (i18n/i18n.ts)

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import vi from './vi.json';
import en from './en.json';

i18n.use(initReactI18next).init({
  resources: { vi: { translation: vi }, en: { translation: en } },
  lng: 'vi',            // Vietnamese default
  fallbackLng: 'vi',
  interpolation: { escapeValue: false },
});

export default i18n;
```

### i18n Key Structure (vi.json)

```json
{
  "common": { "save": "Lưu", "cancel": "Hủy", "delete": "Xóa", "error": "Đã có lỗi xảy ra" },
  "validation": { "required": "Trường này là bắt buộc", "minLength": "Tối thiểu {{min}} ký tự" },
  "event": {
    "createSuccess": "Tạo sự kiện thành công",
    "updateSuccess": "Cập nhật thành công",
    "deleteSuccess": "Đã xóa sự kiện",
    "conflict": "Sự kiện đã bị thay đổi bởi người khác. Đang tải lại...",
    "draftRestored": "Đã khôi phục bản nháp"
  },
  "dashboard": { "title": "Tổng quan", "totalEvents": "Tổng sự kiện" },
  "nav": { "events": "Sự kiện", "dashboard": "Dashboard", "reports": "Báo cáo" }
}
```

### TimeRangeSelector Component

```typescript
// Granularity: week | month | quarter | year
// Controls dashboard API params: granularity, period_start, period_end
// All dashboard panels update synchronously when changed
// Stored in Zustand uiStore — not local component state
```

## Component File Convention

```
components/dashboard/KpiCard/
├── KpiCard.tsx          # Component implementation
├── KpiCard.test.tsx     # Vitest unit tests
└── index.ts             # export { KpiCard } from './KpiCard'
```

## Zustand Store Pattern

```typescript
// store/uiStore.ts
import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  // Dashboard filter state (shared across all panels)
  granularity: 'week' | 'month' | 'quarter' | 'year';
  periodStart: string;
  periodEnd: string;
  setTimeRange: (g: string, start: string, end: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  granularity: 'week',
  periodStart: 'W01',
  periodEnd: 'W04',
  setTimeRange: (granularity, periodStart, periodEnd) =>
    set({ granularity, periodStart, periodEnd }),
}));
```
