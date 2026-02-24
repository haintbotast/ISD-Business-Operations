import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardChartSeries } from '@/types';

interface TrendChartProps {
  title: string;
  xAxis: string[];
  series: DashboardChartSeries[];
  isLoading?: boolean;
}

const BAD_COLORS = ['#C00000', '#FF6666', '#FF9999', '#FFCCCC'];
const GOOD_COLORS = ['#375623', '#70AD47', '#AADEAA', '#E2F0D9'];

function seriesColor(classification: 'Good' | 'Bad', index: number): string {
  const palette = classification === 'Bad' ? BAD_COLORS : GOOD_COLORS;
  return palette[index % palette.length];
}

export function TrendChart({ title, xAxis, series, isLoading = false }: TrendChartProps) {
  const mappedSeries = series.map((item, index) => ({
    name: item.name,
    type: 'bar',
    stack: 'total',
    emphasis: { focus: 'series' },
    itemStyle: { color: seriesColor(item.classification, index) },
    data: item.data,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-80 animate-pulse rounded-md bg-muted" />
        ) : (
          <ReactECharts
            style={{ height: '320px', width: '100%' }}
            notMerge
            option={{
              animation: true,
              textStyle: {
                fontFamily: 'Segoe UI, Noto Sans, Helvetica Neue, Arial, sans-serif',
              },
              tooltip: { trigger: 'axis', appendToBody: true },
              legend: { type: 'scroll', top: 0 },
              grid: { left: 24, right: 16, bottom: 24, top: 56, containLabel: true },
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
