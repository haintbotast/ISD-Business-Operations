// ParetoChart.tsx — simplified Pareto (plain-language, no dual-axis confusion)
import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTranslation } from 'react-i18next';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePareto } from '@/hooks/useReports';
import { currentIsoYear, currentWeekCode } from '@/lib/utils';
import { cn } from '@/lib/utils';

// ─── Colour palette ────────────────────────────────────────────────────────────

// Priority zone  (cumulative ≤ 80%)  — vivid
const BAD_PRI  = '#C00000';
const GOOD_PRI = '#375623';
const NEU_PRI  = '#2F5496';
// Remaining zone (cumulative  > 80%) — muted
const BAD_REM  = '#FF9999';
const GOOD_REM = '#A8D08D';
const NEU_REM  = '#9DC3E6';

function barColor(classification: string, isPriority: boolean): string {
  if (classification === 'Bad')     return isPriority ? BAD_PRI  : BAD_REM;
  if (classification === 'Neutral') return isPriority ? NEU_PRI  : NEU_REM;
  return isPriority ? GOOD_PRI : GOOD_REM;
}

// ─── Recurrence colour helper ──────────────────────────────────────────────────

function recurrenceColor(weeksAppeared: number, totalWeeks: number): string {
  if (totalWeeks === 0) return 'text-muted-foreground';
  const r = weeksAppeared / totalWeeks;
  if (r >= 0.75) return 'text-red-600';
  if (r >= 0.5)  return 'text-orange-500';
  return 'text-muted-foreground';
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ParetoChartProps {
  /** Pre-populate period when embedded in Dashboard tab */
  initialYear?: number;
  initialPeriodStart?: string;
  initialPeriodEnd?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ParetoChart({ initialYear, initialPeriodStart, initialPeriodEnd }: ParetoChartProps = {}) {
  const { t } = useTranslation();
  const curYear = currentIsoYear();
  const curWeek = currentWeekCode();

  const [year, setYear]               = useState(initialYear        ?? curYear);
  const [periodStart, setPeriodStart] = useState(initialPeriodStart ?? 'W01');
  const [periodEnd, setPeriodEnd]     = useState(initialPeriodEnd   ?? curWeek);

  const { data, isLoading } = usePareto({ year, periodStart, periodEnd });
  const items            = data?.items ?? [];
  const totalWeeksInYear = data?.totalWeeksInYear ?? 0;

  // ── Find the 80/20 split ──────────────────────────────────────────────────────
  const splitIdx      = items.findIndex((item) => item.cumulative >= 80);
  const priorityCount = splitIdx === -1 ? items.length : splitIdx + 1;
  const priorityPct   = splitIdx === -1
    ? (items.at(-1)?.cumulative ?? 0)
    : (items[splitIdx]?.cumulative ?? 0);
  const remainderPct   = Number((100 - priorityPct).toFixed(1));
  const remainderCount = items.length - priorityCount;

  // ── Chart option (single Y-axis, no cumulative line) ─────────────────────────

  const option = {
    textStyle: { fontFamily: '"Noto Sans JP", "Segoe UI", sans-serif' },
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      formatter: (params: Array<{ dataIndex: number }>) => {
        const idx  = params[0]?.dataIndex ?? 0;
        const item = items[idx];
        if (!item) return '';
        const isPriority = idx < priorityCount;
        return [
          `<b>${item.category}</b> <span style="color:#999;font-size:11px">${item.mainGroup}</span>`,
          `${t('reports.paretoCols.count')}: <b>${item.count}</b> (${item.percentage}%)`,
          totalWeeksInYear > 0
            ? `${t('reports.paretoCols.recurrence')}: <b>${item.weeksAppeared}/${totalWeeksInYear}T</b>`
            : '',
          isPriority
            ? `<span style="color:#C00000;font-size:11px">▲ ${t('reports.paretoPriorityTag')}</span>`
            : `<span style="color:#999;font-size:11px">— ${t('reports.paretoRemainderTag')}</span>`,
        ].filter(Boolean).join('<br/>');
      },
    },
    grid: { left: 16, right: 16, bottom: 80, top: 28, containLabel: true },
    xAxis: {
      type: 'category',
      data: items.map((item) => item.category),
      axisLabel: { rotate: 35, fontSize: 10, overflow: 'truncate', width: 80 },
    },
    yAxis: {
      type: 'value',
      name: t('reports.paretoCols.count'),
      nameLocation: 'end',
      minInterval: 1,
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 44,
        data: items.map((item, idx) => ({
          value: item.count,
          label: {
            show: true,
            position: 'top',
            fontSize: 9,
            color: '#555',
            formatter: String(item.count),
          },
          itemStyle: {
            color: barColor(item.classification, idx < priorityCount),
            opacity: idx < priorityCount ? 1 : 0.6,
            borderRadius: [2, 2, 0, 0],
          },
        })),
      },
    ],
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Period selector */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs">{t('reports.year')}</Label>
          <Input
            type="number"
            className="w-24"
            value={year}
            min={2020}
            max={2040}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t('reports.periodStart')}</Label>
          <Input
            className="w-24"
            placeholder="W01"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value.toUpperCase())}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t('reports.periodEnd')}</Label>
          <Input
            className="w-24"
            placeholder="W52"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value.toUpperCase())}
          />
        </div>
        {data && (
          <span className="text-xs text-muted-foreground">
            {t('reports.paretoCols.count')}: <b>{data.total}</b>
          </span>
        )}
      </div>

      {/* ── Insight box — always visible, plain language, no jargon ── */}
      {!isLoading && data && items.length > 0 && (
        <div className="flex items-start gap-3 rounded-md border-l-4 border-l-amber-400 bg-amber-50 px-4 py-3">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="space-y-1 text-sm text-amber-900">
            <p>
              <strong>{priorityCount} {t('reports.paretoInsightGroups')}</strong>{' '}
              {t('reports.paretoInsightMain', {
                pct: priorityPct,
                total: data.total,
                period: data.period,
              })}
            </p>
            {remainderCount > 0 && (
              <p className="text-xs text-amber-700">
                {t('reports.paretoInsightRemainder', { count: remainderCount, pct: remainderPct })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Chart / loading / empty ── */}
      {isLoading ? (
        <div className="h-96 animate-pulse rounded-md bg-muted" />
      ) : items.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
          {t('reports.paretoNoData')}
        </div>
      ) : (
        <>
          {/* Bar chart */}
          <div className="rounded-md border bg-card p-2">
            <ReactECharts
              style={{ height: '360px', width: '100%' }}
              notMerge
              option={option}
            />
          </div>

          {/* Summary table with zone dividers */}
          <div className="overflow-auto rounded-md border">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-xs">
                  <th className="px-3 py-2 text-left font-semibold">#</th>
                  <th className="px-3 py-2 text-left font-semibold">{t('reports.paretoCols.category')}</th>
                  <th className="px-3 py-2 text-center font-semibold">{t('reports.paretoCols.count')}</th>
                  <th className="px-3 py-2 text-center font-semibold">{t('reports.paretoCols.percentage')}</th>
                  <th
                    className="px-3 py-2 text-center font-semibold"
                    title={t('reports.paretoCols.recurrenceTooltip')}
                  >
                    {t('reports.paretoCols.recurrence')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Priority zone header row */}
                <tr className="bg-red-50/70">
                  <td colSpan={5} className="px-3 py-1.5 text-xs font-semibold text-red-800">
                    ▲ {t('reports.paretoPriorityZone', { count: priorityCount, pct: priorityPct })}
                  </td>
                </tr>

                {items.map((item, idx) => (
                  <>
                    {/* Remainder zone divider — inserted before first remainder item */}
                    {idx === priorityCount && (
                      <tr key="zone-divider">
                        <td colSpan={5} className="bg-muted/40 px-3 py-1.5 text-xs italic text-muted-foreground">
                          ↓ {t('reports.paretoRemainderZone', { count: remainderCount, pct: remainderPct })}
                        </td>
                      </tr>
                    )}

                    <tr
                      key={idx}
                      className={cn('border-t hover:bg-muted/20', idx >= priorityCount && 'opacity-70')}
                      style={{
                        borderLeft: `3px solid ${barColor(item.classification, idx < priorityCount)}`,
                      }}
                    >
                      <td className="px-3 py-1.5 text-xs text-muted-foreground">{idx + 1}</td>
                      <td className="px-3 py-1.5">
                        <div className="text-xs text-muted-foreground">{item.mainGroup}</div>
                        <div className={cn('font-medium', idx >= priorityCount && 'text-muted-foreground')}>
                          {item.category}
                        </div>
                      </td>
                      <td className={cn(
                        'px-3 py-1.5 text-center',
                        idx < priorityCount ? 'font-bold' : 'text-muted-foreground',
                      )}>
                        {item.count}
                      </td>
                      <td className="px-3 py-1.5 text-center text-muted-foreground">
                        {item.percentage}%
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        {totalWeeksInYear > 0 ? (
                          <span
                            className={cn(
                              'inline-flex items-center gap-0.5 text-xs font-medium',
                              recurrenceColor(item.weeksAppeared, totalWeeksInYear),
                            )}
                            title={t('reports.paretoCols.recurrenceTooltip')}
                          >
                            <RefreshCw className="h-2.5 w-2.5" />
                            {item.weeksAppeared}/{totalWeeksInYear}T
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
