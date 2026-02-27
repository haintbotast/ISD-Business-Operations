import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiSuccess, DashboardGranularity, KpiTrendData, WeeklyMatrixData, RiskMatrixData, ParetoData } from '@/types';

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

// ─── FR-012: Risk Matrix (JIS Q 31000) ────────────────────────────────────────

export function useRiskMatrix(
  params: { year: number; weekCode?: string; periodStart?: string; periodEnd?: string },
  enabled = true,
) {
  return useQuery<RiskMatrixData>({
    queryKey: ['reports', 'risk-matrix', params],
    queryFn: async () => {
      const res = await api.get<ApiSuccess<RiskMatrixData>>('/reports/risk-matrix', { params });
      return res.data.data;
    },
    staleTime: 30_000,
    enabled: enabled && !!params.year,
  });
}

// ─── FR-013: Pareto Analysis (JIS Z 8115) ─────────────────────────────────────

export function usePareto(
  params: { year: number; periodStart?: string; periodEnd?: string; classificationFilter?: 'Bad' | 'all' },
  enabled = true,
) {
  return useQuery<ParetoData>({
    queryKey: ['reports', 'pareto', params],
    queryFn: async () => {
      const res = await api.get<ApiSuccess<ParetoData>>('/reports/pareto', { params });
      return res.data.data;
    },
    staleTime: 30_000,
    enabled: enabled && !!params.year,
  });
}
