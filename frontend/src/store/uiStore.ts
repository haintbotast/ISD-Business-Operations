import { create } from 'zustand';
import { currentWeekCode, currentIsoYear } from '@/lib/utils';

interface UIStore {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Dashboard time range — shared across all panels
  granularity: 'week' | 'month' | 'quarter' | 'year';
  year: number;
  periodStart: string;
  periodEnd: string;
  setTimeRange: (
    granularity: 'week' | 'month' | 'quarter' | 'year',
    year: number,
    periodStart: string,
    periodEnd: string,
  ) => void;

  // Event list active filters
  eventFilters: {
    year: number;
    weekCode: string;
    locationCode: string;
    mainGroup: string;
    classification: string;
    status: string;
    search: string;
  };
  setEventFilters: (filters: Partial<UIStore['eventFilters']>) => void;
  resetEventFilters: () => void;
}

const currentYear = currentIsoYear();
const currentWeek = currentWeekCode();

const defaultEventFilters = {
  year: currentYear,
  weekCode: '',
  locationCode: '',
  mainGroup: '',
  classification: '',
  status: '',
  search: '',
};

export const useUIStore = create<UIStore>((set) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Dashboard time range
  granularity: 'week',
  year: currentYear,
  periodStart: currentWeek,
  periodEnd: currentWeek,
  setTimeRange: (granularity, year, periodStart, periodEnd) =>
    set({ granularity, year, periodStart, periodEnd }),

  // Event list filters
  eventFilters: defaultEventFilters,
  setEventFilters: (filters) =>
    set((s) => ({ eventFilters: { ...s.eventFilters, ...filters } })),
  resetEventFilters: () => set({ eventFilters: defaultEventFilters }),
}));
