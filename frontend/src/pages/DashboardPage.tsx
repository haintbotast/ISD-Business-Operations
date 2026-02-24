import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useDashboardChart, useDashboardSummary } from '@/hooks/useDashboard';
import { TimeRangeSelector } from '@/components/dashboard/TimeRangeSelector';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { StatusDistribution } from '@/components/dashboard/StatusDistribution';
import { DetailTable } from '@/components/dashboard/DetailTable';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { currentIsoYear, currentWeekCode } from '@/lib/utils';
import type { DashboardMetricFilter, Event } from '@/types';

export default function DashboardPage() {
  const { t } = useTranslation();
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
        const res = await api.get<{ success: true; events: Event[] }>('/events', {
          params: { year, page: 1, limit: 1 },
        });
        const latestWeekCode = res.data.events?.[0]?.weekCode;
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

      <DetailTable
        title={t('dashboard.detailTable')}
        rows={summary?.detailRows}
        isLoading={loadingSummary}
      />
    </div>
  );
}
