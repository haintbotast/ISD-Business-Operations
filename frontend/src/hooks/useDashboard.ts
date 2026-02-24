import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  ApiSuccess,
  DashboardChartData,
  DashboardMetricFilter,
  DashboardQueryParams,
  DashboardSummaryData,
} from '@/types';

function normalizedParams(params: DashboardQueryParams): DashboardQueryParams {
  return {
    granularity: params.granularity,
    year: params.year,
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    ...(params.locationCode ? { locationCode: params.locationCode } : {}),
  };
}

export function useDashboardSummary(
  params: DashboardQueryParams,
  metricFilter: DashboardMetricFilter = 'all',
) {
  const queryParams = normalizedParams(params);

  return useQuery<DashboardSummaryData>({
    queryKey: ['dashboard', 'summary', queryParams, metricFilter],
    queryFn: async () => {
      const res = await api.get<ApiSuccess<DashboardSummaryData>>('/dashboard/summary', {
        params: {
          ...queryParams,
          metricFilter,
        },
      });
      return res.data.data;
    },
    staleTime: 15_000,
  });
}

export function useDashboardChart(params: DashboardQueryParams) {
  const queryParams = normalizedParams(params);

  return useQuery<DashboardChartData>({
    queryKey: ['dashboard', 'chart', queryParams],
    queryFn: async () => {
      const res = await api.get<ApiSuccess<DashboardChartData>>('/dashboard/chart', {
        params: queryParams,
      });
      return res.data.data;
    },
    staleTime: 15_000,
  });
}

