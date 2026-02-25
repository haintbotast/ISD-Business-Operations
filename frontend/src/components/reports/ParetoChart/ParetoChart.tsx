// ParetoChart.tsx — JIS Z 8115 Pareto Analysis (パレート図)
import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePareto } from '@/hooks/useReports';
import { currentIsoYear, currentWeekCode } from '@/lib/utils';

// ─── Color palettes (reuse TrendChart tones) ──────────────────────────────────

const BAD_COLORS  = ['#C00000', '#E04040', '#FF6666', '#FF9999'];
const GOOD_COLORS = ['#375623', '#70AD47', '#AADEAA', '#C6E9AE'];

// ─── Component ────────────────────────────────────────────────────────────────

export function ParetoChart() {
  const { t } = useTranslation();
  const curYear = currentIsoYear();
  const curWeek = currentWeekCode();

  const [year, setYear]             = useState(curYear);
  const [periodStart, setPeriodStart] = useState('W01');
  const [periodEnd, setPeriodEnd]   = useState(curWeek);

  const { data, isLoading } = usePareto({ year, periodStart, periodEnd });

  const items = data?.items ?? [];

  // Counters for alternating palette index per classification
  const badIdx: Record<string, number>  = {};
  const goodIdx: Record<string, number> = {};
  let badCount = 0;
  let goodCount = 0;

  const barColors = items.map((item) => {
    if (item.classification === 'Bad') {
      badIdx[item.category] = badCount++;
      return BAD_COLORS[badIdx[item.category] % BAD_COLORS.length];
    } else {
      goodIdx[item.category] = goodCount++;
      return GOOD_COLORS[goodIdx[item.category] % GOOD_COLORS.length];
    }
  });

  const option = {
    textStyle: { fontFamily: '"Noto Sans JP", "Segoe UI", sans-serif' },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      appendToBody: true,
      formatter: (params: Array<{ axisValueLabel: string; seriesName: string; value: number; color: string }>) => {
        if (!params.length) return '';
        const idx = items.findIndex((it) => it.category === params[0]?.axisValueLabel);
        const item = items[idx];
        if (!item) return '';
        return [
          `<b>${item.category}</b> <small style="color:#999">${item.mainGroup}</small>`,
          `${t('reports.paretoCols.count')}: <b>${item.count}</b>`,
          `${t('reports.paretoCols.percentage')}: <b>${item.percentage}%</b>`,
          `${t('reports.paretoCols.cumulative')}: <b>${item.cumulative}%</b>`,
        ].join('<br/>');
      },
    },
    legend: {
      data: [t('reports.paretoCols.count'), t('reports.paretoCols.cumulative')],
      top: 0,
    },
    grid: { left: 16, right: 60, bottom: 80, top: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: items.map((item) => item.category),
      axisLabel: {
        rotate: 35,
        fontSize: 10,
        overflow: 'truncate',
        width: 80,
      },
    },
    yAxis: [
      {
        type: 'value',
        name: t('reports.paretoCols.count'),
        nameLocation: 'end',
        minInterval: 1,
      },
      {
        type: 'value',
        name: '%',
        nameLocation: 'end',
        max: 100,
        axisLabel: { formatter: '{value}%' },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: t('reports.paretoCols.count'),
        type: 'bar',
        yAxisIndex: 0,
        data: items.map((item) => item.count),
        itemStyle: {
          color: (params: { dataIndex: number }) => barColors[params.dataIndex] ?? '#999',
        },
        barMaxWidth: 40,
      },
      {
        name: t('reports.paretoCols.cumulative'),
        type: 'line',
        yAxisIndex: 1,
        data: items.map((item) => item.cumulative),
        smooth: false,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: '#1e3a5f', width: 2 },
        itemStyle: { color: '#1e3a5f' },
        markLine: {
          silent: true,
          lineStyle: { color: GOOD_COLORS[0], type: 'dashed', width: 1.5 },
          label: {
            formatter: `80% — ${t('reports.paretoRule')}`,
            position: 'insideEndTop',
            color: GOOD_COLORS[0],
            fontSize: 10,
          },
          data: [{ yAxis: 80 }],
        },
      },
    ],
  };

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

      {/* Chart */}
      {isLoading ? (
        <div className="h-96 animate-pulse rounded-md bg-muted" />
      ) : items.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
          {t('reports.paretoNoData')}
        </div>
      ) : (
        <>
          <div className="rounded-md border bg-card p-2">
            <ReactECharts
              style={{ height: '400px', width: '100%' }}
              notMerge
              option={option}
            />
          </div>

          {/* Summary table */}
          <div className="overflow-auto rounded-md border">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-xs">
                  <th className="px-3 py-2 text-left font-semibold">#</th>
                  <th className="px-3 py-2 text-left font-semibold">{t('reports.paretoCols.category')}</th>
                  <th className="px-3 py-2 text-center font-semibold">{t('reports.paretoCols.count')}</th>
                  <th className="px-3 py-2 text-center font-semibold">{t('reports.paretoCols.percentage')}</th>
                  <th className="px-3 py-2 text-center font-semibold">{t('reports.paretoCols.cumulative')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-t hover:bg-muted/20"
                    style={{
                      borderLeft: `3px solid ${item.classification === 'Bad' ? BAD_COLORS[0] : GOOD_COLORS[1]}`,
                    }}
                  >
                    <td className="px-3 py-1.5 text-xs text-muted-foreground">{idx + 1}</td>
                    <td className="px-3 py-1.5">
                      <div className="text-xs text-muted-foreground">{item.mainGroup}</div>
                      <div className="font-medium">{item.category}</div>
                    </td>
                    <td className="px-3 py-1.5 text-center font-bold">{item.count}</td>
                    <td className="px-3 py-1.5 text-center">{item.percentage}%</td>
                    <td className="px-3 py-1.5 text-center">
                      <span
                        className={item.cumulative <= 80 ? 'font-semibold text-green-700' : 'text-muted-foreground'}
                      >
                        {item.cumulative}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
