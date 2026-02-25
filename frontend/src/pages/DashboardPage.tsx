import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useDashboardChart, useDashboardSummary } from '@/hooks/useDashboard';
import { TimeRangeSelector } from '@/components/dashboard/TimeRangeSelector';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { StatusDistribution } from '@/components/dashboard/StatusDistribution';
import { TopIssues } from '@/components/dashboard/TopIssues';
import { AlertPanel } from '@/components/dashboard/AlertPanel';
import { DetailTable } from '@/components/dashboard/DetailTable';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { currentIsoYear, currentWeekCode } from '@/lib/utils';
import type { ApiList, DashboardMetricFilter, Event } from '@/types';

export default function DashboardPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { granularity, year, periodStart, periodEnd, setTimeRange } = useUIStore();
  const [metricFilter, setMetricFilter] = useState<DashboardMetricFilter>('all');
  const [autoAdjustedRange, setAutoAdjustedRange] = useState(false);
  const hasTriedAutoAdjustRef = useRef(false);

  const queryParams = useMemo(
    () => ({
      granularity,
      year,
      periodStart,
      periodEnd,
    }),
    [granularity, year, periodStart, periodEnd],
  );

  const summaryQuery = useDashboardSummary(queryParams, metricFilter);
  const chartQuery = useDashboardChart(queryParams);

  const summary = summaryQuery.data;
  const chart = chartQuery.data;
  const loadingSummary = summaryQuery.isLoading || summaryQuery.isFetching;
  const loadingChart = chartQuery.isLoading || chartQuery.isFetching;
  const hasError = summaryQuery.isError || chartQuery.isError;

  useEffect(() => {
    if (hasTriedAutoAdjustRef.current) return;
    if (granularity !== 'week') return;

    const currentYear = currentIsoYear();
    const currentWeek = currentWeekCode();
    const isDefaultCurrentWeek = year === currentYear && periodStart === currentWeek && periodEnd === currentWeek;
    if (!isDefaultCurrentWeek) return;

    if (summaryQuery.isLoading || summaryQuery.isFetching || summaryQuery.isError) return;
    if ((summary?.kpis.totalEvents.value ?? 0) > 0) return;

    hasTriedAutoAdjustRef.current = true;

    const loadLatestWeek = async () => {
      try {
        // Use fetchQuery so the result is stored in / served from the TanStack
        // Query cache with the same key that EventList uses — avoids a
        // duplicate network request if the list was already fetched.
        const latestParams = { page: 1, limit: 1, year };
        const cached = await queryClient.fetchQuery<ApiList<Event>>({
          queryKey: ['events', latestParams],
          queryFn: () =>
            api.get('/events', { params: latestParams }).then((r) => ({
              success: true as const,
              data: Array.isArray(r.data.events) ? (r.data.events as Event[]) : [],
              pagination: r.data.pagination,
            })),
          staleTime: 30_000,
        });
        const latestWeekCode = cached.data[0]?.weekCode;
        if (!latestWeekCode || latestWeekCode === currentWeek) return;
        setTimeRange('week', year, latestWeekCode, latestWeekCode);
        setAutoAdjustedRange(true);
      } catch {
        // Keep current selection if fallback query fails
      }
    };

    void loadLatestWeek();
  }, [
    granularity,
    periodEnd,
    periodStart,
    setTimeRange,
    summary?.kpis.totalEvents.value,
    summaryQuery.isError,
    summaryQuery.isFetching,
    summaryQuery.isLoading,
    year,
  ]);

  const kpiCards = [
    {
      key: 'totalEvents',
      title: t('dashboard.kpis.totalEvents'),
      filter: 'all' as DashboardMetricFilter,
    },
    {
      key: 'downtimeMinutes',
      title: t('dashboard.kpis.downtimeMinutes'),
      filter: 'downtime' as DashboardMetricFilter,
    },
    {
      key: 'closureRate',
      title: t('dashboard.kpis.closureRate'),
      filter: 'closure' as DashboardMetricFilter,
    },
    {
      key: 'severeIncidents',
      title: t('dashboard.kpis.severeIncidents'),
      filter: 'severe' as DashboardMetricFilter,
    },
    {
      key: 'openInProgress',
      title: t('dashboard.kpis.openInProgress'),
      filter: 'open' as DashboardMetricFilter,
    },
  ] as const;

  if (hasError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
        <div className="flex items-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div className="flex-1 text-sm text-destructive">{t('dashboard.loadError')}</div>
          <Button
            variant="outline"
            onClick={() => {
              void summaryQuery.refetch();
              void chartQuery.refetch();
            }}
          >
            {t('dashboard.retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
      </div>

      <TimeRangeSelector
        granularity={granularity}
        year={year}
        periodStart={periodStart}
        periodEnd={periodEnd}
        onChange={setTimeRange}
      />

      {autoAdjustedRange && (
        <p className="text-xs text-muted-foreground">{t('dashboard.autoAdjustedRange')}</p>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {kpiCards.map((card) => {
          const metric = summary?.kpis[card.key];
          return (
            <KpiCard
              key={card.key}
              title={card.title}
              value={metric?.value ?? 0}
              deltaPct={metric?.deltaPct ?? 0}
              sparkline={metric?.sparkline ?? Array.from({ length: 12 }, () => 0)}
              onClick={() => setMetricFilter(card.filter)}
              active={metricFilter === card.filter}
            />
          );
        })}
      </div>

      {/* Row 2: Trend chart (2/3) + Severity donut (1/3) */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TrendChart
            title={t('dashboard.trendChart')}
            xAxis={chart?.xAxis ?? []}
            series={chart?.series ?? []}
            isLoading={loadingChart}
          />
        </div>
        <StatusDistribution
          title={t('dashboard.statusDistribution')}
          distribution={summary?.statusDistribution}
          isLoading={loadingSummary}
        />
      </div>

      {/* Row 3: Top issues (2/3) + Alert panel (1/3) */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TopIssues
            year={year}
            periodStart={periodStart}
            periodEnd={periodEnd}
            enabled={granularity === 'week'}
          />
        </div>
        <AlertPanel
          distribution={summary?.statusDistribution}
          isLoading={loadingSummary}
        />
      </div>

      <DetailTable
        title={t('dashboard.detailTable')}
        rows={summary?.detailRows}
        isLoading={loadingSummary}
      />
    </div>
  );
}
