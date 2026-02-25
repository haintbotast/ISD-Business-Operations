import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiSuccess, DashboardGranularity, KpiTrendData, WeeklyMatrixData } from '@/types';

export function useWeeklyMatrix(week: string, year: number, enabled = true) {
  return useQuery<WeeklyMatrixData>({
    queryKey: ['reports', 'weekly-matrix', { week, year }],
    queryFn: async () => {
      const res = await api.get<ApiSuccess<WeeklyMatrixData>>('/dashboard/weekly-matrix', {
        params: { week, year },
      });
      return res.data.data;
    },
    staleTime: 30_000,
    enabled: enabled && !!week && !!year,
  });
}

export function useKpiTrend(granularity: DashboardGranularity, year: number) {
  return useQuery<KpiTrendData>({
    queryKey: ['reports', 'kpi-trend', { granularity, year }],
    queryFn: async () => {
      const res = await api.get<ApiSuccess<KpiTrendData>>('/dashboard/kpi-trend', {
        params: { granularity, year },
      });
      return res.data.data;
    },
    staleTime: 30_000,
  });
}
