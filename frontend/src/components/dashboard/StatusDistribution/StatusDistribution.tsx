import ReactECharts from 'echarts-for-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardSummaryData } from '@/types';

// JIS Z 9103 colours (same as SEVERITY_COLORS in colors.ts)
const SEV_COLORS = {
  Critical: '#C00000',
  High:     '#FF6600',
  Medium:   '#FFC000',
  Low:      '#70AD47',
};

interface StatusDistributionProps {
  title: string;
  distribution: DashboardSummaryData['statusDistribution'] | undefined;
  isLoading?: boolean;
}

export function StatusDistribution({ title, distribution, isLoading = false }: StatusDistributionProps) {
  const { t } = useTranslation();

  const total = distribution?.all.count ?? 0;

  const chartData = distribution
    ? [
        { value: distribution.critical.count, name: t('event.severity.Critical'), itemStyle: { color: SEV_COLORS.Critical } },
        { value: distribution.high.count,     name: t('event.severity.High'),     itemStyle: { color: SEV_COLORS.High } },
        { value: distribution.medium.count,   name: t('event.severity.Medium'),   itemStyle: { color: SEV_COLORS.Medium } },
        { value: distribution.low.count,      name: t('event.severity.Low'),      itemStyle: { color: SEV_COLORS.Low } },
      ].filter((d) => d.value > 0)
    : [];

  const option = {
    textStyle: { fontFamily: '"Noto Sans JP", "Segoe UI", sans-serif' },
    tooltip: {
      trigger: 'item',
      appendToBody: true,
      formatter: (params: { name: string; value: number; percent: number }) =>
        `${params.name}: <b>${params.value}</b> (${params.percent.toFixed(1)}%)`,
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontSize: 11 },
    },
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '38%',
        style: {
          text: `${total.toLocaleString('vi-VN')}`,
          textAlign: 'center',
          fill: '#1a1a1a',
          fontSize: 22,
          fontWeight: 'bold',
        },
      },
      {
        type: 'text',
        left: 'center',
        top: '51%',
        style: {
          text: t('dashboard.events'),
          textAlign: 'center',
          fill: '#888',
          fontSize: 11,
        },
      },
    ],
    series: [
      {
        type: 'pie',
        radius: ['38%', '65%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 11, fontWeight: 'bold' },
          itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.15)' },
        },
        labelLine: { show: false },
        data: chartData,
      },
    ],
  };

  // Open vs closed summary rows (below chart)
  const rows = distribution
    ? [
        { key: 'critical', label: t('event.severity.Critical'), color: SEV_COLORS.Critical, ...distribution.critical },
        { key: 'high',     label: t('event.severity.High'),     color: SEV_COLORS.High,     ...distribution.high },
        { key: 'medium',   label: t('event.severity.Medium'),   color: SEV_COLORS.Medium,   ...distribution.medium },
        { key: 'low',      label: t('event.severity.Low'),      color: SEV_COLORS.Low,       ...distribution.low },
      ]
    : [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading || !distribution ? (
          <div className="h-80 animate-pulse rounded-md bg-muted" />
        ) : (
          <>
            {/* Donut chart */}
            <ReactECharts
              style={{ height: '200px', width: '100%' }}
              notMerge
              option={option}
            />

            {/* Open / Closed breakdown */}
            <div className="space-y-1.5">
              {rows.filter((r) => r.count > 0).map((row) => (
                <div key={row.key} className="flex items-center justify-between rounded-md px-2 py-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="font-medium">{row.label}</span>
                    <span className="text-muted-foreground">({row.count})</span>
                  </div>
                  <span className="text-muted-foreground">
                    {t('dashboard.statusSplit', { open: row.open, closed: row.closed })}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
