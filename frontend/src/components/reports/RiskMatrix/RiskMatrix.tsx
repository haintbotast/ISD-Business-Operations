// RiskMatrix.tsx — JIS Q 31000:2019 Risk Matrix (影響度 × 発生可能性 × 影響範囲)
import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RISK_LEVEL_COLORS, IMPACT_SCOPE_WEIGHTS } from '@/lib/colors';
import { useRiskMatrix } from '@/hooks/useReports';
import { currentIsoYear, currentWeekCode } from '@/lib/utils';
import type { RiskMatrixItem } from '@/types';

// ─── Background quadrant colors (JIS Z 9103 with 25% opacity) ────────────────

const BG_COLORS: Record<string, string> = {
  Low:      RISK_LEVEL_COLORS.Low      + '33',  // 20% opacity
  Medium:   RISK_LEVEL_COLORS.Medium   + '33',
  High:     RISK_LEVEL_COLORS.High     + '33',
  Critical: RISK_LEVEL_COLORS.Critical + '33',
};

function cellRiskLevel(likelihood: number, impact: number): string {
  const score = likelihood * impact;
  if (score <= 4) return 'Low';
  if (score <= 8) return 'Medium';
  if (score <= 12) return 'High';
  return 'Critical';
}

// 16 background cells for the 4×4 grid
function buildBgMarkArea() {
  const data: Array<[object, object]> = [];
  for (let l = 1; l <= 4; l++) {
    for (let i = 1; i <= 4; i++) {
      const level = cellRiskLevel(l, i);
      data.push([
        { coord: [l - 0.5, i - 0.5], itemStyle: { color: BG_COLORS[level] } },
        { coord: [l + 0.5, i + 0.5] },
      ]);
    }
  }
  return data;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: string }) {
  return (
    <span
      className="inline-block rounded px-1.5 py-0.5 text-xs font-semibold text-white"
      style={{ backgroundColor: RISK_LEVEL_COLORS[level] ?? '#999' }}
    >
      {level}
    </span>
  );
}

function ScopeBadge({ scope }: { scope: string }) {
  return (
    <span className="inline-block rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
      {scope}
    </span>
  );
}

// ─── Detail Table ─────────────────────────────────────────────────────────────

function RiskDetailTable({ items }: { items: RiskMatrixItem[] }) {
  const { t } = useTranslation();
  return (
    <div className="mt-4 overflow-auto rounded-md border">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-muted/50 text-xs">
            <th className="px-3 py-2 text-left font-semibold">{t('reports.riskMatrixCols.category')}</th>
            <th className="px-3 py-2 text-center font-semibold">{t('reports.riskMatrixCols.eventCount')}</th>
            <th className="px-3 py-2 text-center font-semibold">{t('reports.riskMatrixCols.impact')}</th>
            <th className="px-3 py-2 text-center font-semibold">{t('reports.riskMatrixCols.likelihood')}</th>
            <th className="px-3 py-2 text-center font-semibold">{t('reports.riskMatrixCols.riskScore')}</th>
            <th className="px-3 py-2 text-center font-semibold">{t('reports.riskMatrixCols.riskLevel')}</th>
            <th className="px-3 py-2 text-center font-semibold">{t('reports.riskMatrixCols.dominantScope')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="border-t hover:bg-muted/20">
              <td className="px-3 py-2">
                <div className="text-xs text-muted-foreground">{item.mainGroup}</div>
                <div className="font-medium">{item.category}</div>
              </td>
              <td className="px-3 py-2 text-center">{item.eventCount}</td>
              <td className="px-3 py-2 text-center text-xs">{item.impactLabel}</td>
              <td className="px-3 py-2 text-center text-xs">{item.likelihoodLabel}</td>
              <td className="px-3 py-2 text-center font-bold">{item.riskScore}</td>
              <td className="px-3 py-2 text-center">
                <RiskBadge level={item.riskLevel} />
              </td>
              <td className="px-3 py-2 text-center">
                <ScopeBadge scope={item.dominantScope} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface RiskMatrixProps {
  /** Pre-populate period when embedded in Dashboard tab */
  initialYear?: number;
  initialPeriodStart?: string;
  initialPeriodEnd?: string;
}

export function RiskMatrix({ initialYear, initialPeriodStart, initialPeriodEnd }: RiskMatrixProps = {}) {
  const { t } = useTranslation();
  const curYear = currentIsoYear();
  const curWeek = currentWeekCode();

  const [year, setYear]               = useState(initialYear        ?? curYear);
  const [periodStart, setPeriodStart] = useState(initialPeriodStart ?? curWeek);
  const [periodEnd, setPeriodEnd]     = useState(initialPeriodEnd   ?? curWeek);

  const { data, isLoading } = useRiskMatrix({ year, periodStart, periodEnd });

  const items = data?.items ?? [];

  // ECharts scatter data: [likelihood, impact, riskScore, scope, riskLevel, label, count]
  const scatterData = items.map((item) => [
    item.likelihood,
    item.impact,
    item.riskScore,
    item.dominantScope,
    item.riskLevel,
    item.category.length > 14 ? item.category.slice(0, 12) + '…' : item.category,
    item.eventCount,
  ]);

  const bgMarkAreaData = buildBgMarkArea();

  const LIKELIHOOD_LABELS = ['', 'Rare\n(稀少)', 'Unlikely\n(低)', 'Possible\n(中)', 'Likely\n(高)'];
  const IMPACT_LABELS     = ['', 'Low\n(低)', 'Medium\n(中)', 'High\n(高)', 'Critical\n(最高)'];

  const option = {
    textStyle: { fontFamily: '"Noto Sans JP", "Segoe UI", sans-serif' },
    tooltip: {
      trigger: 'item',
      formatter: (params: { data: unknown[] }) => {
        const d = params.data as [number, number, number, string, string, string, number];
        return [
          `<b>${d[5]}</b>`,
          `リスクスコア / Risk Score: <b>${d[2]}</b>`,
          `リスクレベル / Level: <b>${d[4]}</b>`,
          `影響度 / Impact: <b>${IMPACT_LABELS[d[1]] ?? d[1]}</b>`,
          `発生可能性 / Likelihood: <b>${LIKELIHOOD_LABELS[d[0]] ?? d[0]}</b>`,
          `影響範囲 / Scope: <b>${d[3]}</b>`,
          `件数 / Events: <b>${d[6]}</b>`,
        ].join('<br/>');
      },
      appendToBody: true,
    },
    grid: { left: 70, right: 20, top: 30, bottom: 60, containLabel: false },
    xAxis: {
      type: 'value',
      name: '発生可能性 (Likelihood)',
      nameLocation: 'middle',
      nameGap: 40,
      min: 0.5,
      max: 4.5,
      interval: 1,
      axisLabel: {
        formatter: (v: number) => LIKELIHOOD_LABELS[v] ?? '',
        fontSize: 10,
      },
      splitLine: { lineStyle: { color: '#ddd', type: 'dashed' } },
    },
    yAxis: {
      type: 'value',
      name: '影響度 (Impact)',
      nameLocation: 'middle',
      nameGap: 55,
      min: 0.5,
      max: 4.5,
      interval: 1,
      axisLabel: {
        formatter: (v: number) => IMPACT_LABELS[v] ?? '',
        fontSize: 10,
      },
      splitLine: { lineStyle: { color: '#ddd', type: 'dashed' } },
    },
    series: [
      {
        type: 'scatter',
        symbolSize: (d: unknown[]) => IMPACT_SCOPE_WEIGHTS[(d as string[])[3]] ?? 35,
        itemStyle: {
          color: (params: { data: unknown[] }) =>
            RISK_LEVEL_COLORS[(params.data as string[])[4]] ?? '#999',
          opacity: 0.85,
          borderColor: '#fff',
          borderWidth: 1.5,
        },
        label: {
          show: true,
          formatter: (p: { data: unknown[] }) => {
            const d = p.data as Array<string | number>;
            return `${d[5]}\n(${d[6]})`;
          },
          position: 'top',
          fontSize: 10,
          color: '#333',
        },
        markArea: {
          silent: true,
          data: bgMarkAreaData,
        },
        data: scatterData,
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
            placeholder="W08"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value.toUpperCase())}
          />
        </div>
      </div>

      {/* Risk level legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {(['Critical', 'High', 'Medium', 'Low'] as const).map((level) => (
          <span key={level} className="flex items-center gap-1">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: RISK_LEVEL_COLORS[level] }}
            />
            <span style={{ color: RISK_LEVEL_COLORS[level] }} className="font-semibold">
              {level}:
            </span>
            <span className="text-muted-foreground">{t(`reports.riskLevel.${level}`)}</span>
          </span>
        ))}
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-96 animate-pulse rounded-md bg-muted" />
      ) : items.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
          {t('reports.riskMatrixNoData')}
        </div>
      ) : (
        <>
          <div
            className={cn('rounded-md border bg-card p-2')}
          >
            <ReactECharts
              style={{ height: '400px', width: '100%' }}
              notMerge
              option={option}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t('reports.riskMatrixNote')}</p>
          <RiskDetailTable items={items} />
        </>
      )}
    </div>
  );
}
