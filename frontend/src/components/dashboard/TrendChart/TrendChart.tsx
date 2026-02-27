import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CATEGORY_PALETTE } from '@/lib/colors';
import type { DashboardChartSeries } from '@/types';

interface TrendChartProps {
  title: string;
  xAxis: string[];
  series: DashboardChartSeries[];
  isLoading?: boolean;
}

// Assign each unique series name a stable palette index so colors don't shift on re-render.
function buildColorMap(series: DashboardChartSeries[]): Map<string, string> {
  const map = new Map<string, string>();
  let idx = 0;
  for (const s of series) {
    if (!map.has(s.name)) {
      map.set(s.name, CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length]);
      idx++;
    }
  }
  return map;
}

export function TrendChart({ title, xAxis, series, isLoading = false }: TrendChartProps) {
  const colorMap = buildColorMap(series);

  const mappedSeries = series.map((item) => ({
    name: item.name,
    type: 'bar',
    stack: 'total',
    emphasis: { focus: 'series' },
    itemStyle: { color: colorMap.get(item.name) },
    data: item.data,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-96 animate-pulse rounded-md bg-muted" />
        ) : (
          <ReactECharts
            style={{ height: '380px', width: '100%' }}
            notMerge
            option={{
              animation: true,
              textStyle: {
                fontFamily: '"Noto Sans JP", "Segoe UI", "Noto Sans", "Helvetica Neue", Arial, sans-serif',
              },
              tooltip: { trigger: 'axis', appendToBody: true },
              legend: {
                type: 'plain',
                orient: 'horizontal',
                bottom: 0,
                textStyle: { fontSize: 10 },
              },
              grid: { left: 24, right: 16, bottom: 64, top: 16, containLabel: true },
              xAxis: {
                type: 'category',
                data: xAxis,
                axisTick: { alignWithLabel: true },
              },
              yAxis: {
                type: 'value',
                minInterval: 1,
              },
              series: mappedSeries,
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
