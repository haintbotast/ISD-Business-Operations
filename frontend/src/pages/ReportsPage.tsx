import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useWeeklyMatrix, useKpiTrend } from '@/hooks/useReports';
import { WeeklyMatrix } from '@/components/reports/WeeklyMatrix';
import { KpiTrendTable } from '@/components/reports/KpiTrendTable';
import { ExportButton } from '@/components/reports/ExportButton';
import { TimeRangeSelector } from '@/components/dashboard/TimeRangeSelector';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { currentIsoYear, currentWeekCode } from '@/lib/utils';
import type { DashboardGranularity } from '@/types';

export default function ReportsPage() {
  const { t } = useTranslation();
  const { granularity, year, periodStart, setTimeRange } = useUIStore();

  // For the weekly matrix tab, use periodStart as the selected week
  const matrixWeek = granularity === 'week' ? periodStart : currentWeekCode();
  const matrixYear = year ?? currentIsoYear();

  // For KPI trend, allow independent granularity selection
  const [trendGranularity, setTrendGranularity] = useState<DashboardGranularity>('week');
  const [trendYear, setTrendYear] = useState<number>(currentIsoYear());

  const matrixQuery = useWeeklyMatrix(matrixWeek, matrixYear);
  const kpiTrendQuery = useKpiTrend(trendGranularity, trendYear);

  const matrixError = matrixQuery.isError;
  const trendError = kpiTrendQuery.isError;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('reports.title')}</h1>

      <Tabs defaultValue="matrix">
        <TabsList>
          <TabsTrigger value="matrix">{t('reports.weeklyMatrix')}</TabsTrigger>
          <TabsTrigger value="kpi">{t('reports.kpiTrend')}</TabsTrigger>
        </TabsList>

        {/* ─── Weekly Matrix Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="matrix" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TimeRangeSelector
              granularity="week"
              year={matrixYear}
              periodStart={matrixWeek}
              periodEnd={matrixWeek}
              onChange={(g, y, start) =>
                setTimeRange(g, y, start, start)
              }
            />
            <ExportButton
              target="weekly-matrix"
              params={{ week: matrixWeek, year: matrixYear }}
              disabled={!matrixQuery.data}
            />
          </div>

          {matrixError ? (
            <div className="flex items-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="flex-1 text-sm text-destructive">{t('reports.loadError')}</span>
              <Button variant="outline" size="sm" onClick={() => void matrixQuery.refetch()}>
                {t('reports.retry')}
              </Button>
            </div>
          ) : (
            <>
              {matrixQuery.data && (
                <p className="text-sm text-muted-foreground">
                  {matrixQuery.data.weekRange}
                </p>
              )}
              <WeeklyMatrix
                data={matrixQuery.data}
                isLoading={matrixQuery.isLoading || matrixQuery.isFetching}
              />
            </>
          )}
        </TabsContent>

        {/* ─── KPI Trend Tab ─────────────────────────────────────────────────────── */}
        <TabsContent value="kpi" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TimeRangeSelector
              granularity={trendGranularity}
              year={trendYear}
              periodStart=""
              periodEnd=""
              onChange={(g, y) => {
                setTrendGranularity(g as DashboardGranularity);
                setTrendYear(y);
              }}
            />
            <ExportButton
              target="events"
              params={{ year: trendYear }}
            />
          </div>

          {trendError ? (
            <div className="flex items-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="flex-1 text-sm text-destructive">{t('reports.loadError')}</span>
              <Button variant="outline" size="sm" onClick={() => void kpiTrendQuery.refetch()}>
                {t('reports.retry')}
              </Button>
            </div>
          ) : (
            <KpiTrendTable
              data={kpiTrendQuery.data}
              isLoading={kpiTrendQuery.isLoading || kpiTrendQuery.isFetching}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
