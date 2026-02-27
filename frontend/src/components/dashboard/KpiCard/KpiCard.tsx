import ReactECharts from 'echarts-for-react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: number;
  deltaPct: number;
  sparkline: number[];
  onClick?: () => void;
  active?: boolean;
  /** Override the displayed value string (e.g. "99.8%") */
  displayValue?: string;
  /** Small subtitle below the value (e.g. "0 phút · SLA ≤ 50 phút/tuần") */
  subLabel?: string;
  /** SLA badge shown next to delta (e.g. { label: 'SLA ≥ 99.5%', met: true }) */
  slaInfo?: { label: string; met: boolean };
}

function formatNumber(value: number): string {
  return value.toLocaleString('vi-VN');
}

function formatDelta(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function KpiCard({
  title, value, deltaPct, sparkline, onClick, active = false,
  displayValue, subLabel, slaInfo,
}: KpiCardProps) {
  const isPositive = deltaPct > 0;
  const isNegative = deltaPct < 0;
  const deltaClass = isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-muted-foreground';
  const DeltaIcon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : Minus;

  return (
    <Card
      className={cn(
        'transition-colors',
        onClick && 'cursor-pointer hover:border-primary/40 hover:bg-primary/5',
        active && 'border-primary bg-primary/5',
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-bold">{displayValue ?? formatNumber(value)}</div>
        {subLabel && (
          <div className="text-xs text-muted-foreground leading-tight">{subLabel}</div>
        )}

        <div className="flex items-center gap-2">
          <div className={cn('flex items-center gap-1 text-xs font-medium', deltaClass)}>
            <DeltaIcon className="h-3.5 w-3.5" />
            <span>{formatDelta(deltaPct)}</span>
          </div>
          {slaInfo && (
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-xs font-medium',
                slaInfo.met ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
              )}
            >
              {slaInfo.label}
            </span>
          )}
        </div>

        <div className="h-14">
          <ReactECharts
            style={{ height: '56px', width: '100%' }}
            notMerge
            option={{
              animation: true,
              textStyle: { fontFamily: '"Noto Sans JP", "Segoe UI", sans-serif' },
              grid: { top: 2, right: 0, bottom: 2, left: 0 },
              xAxis: {
                type: 'category',
                show: false,
                data: sparkline.map((_v, idx) => idx + 1),
              },
              yAxis: {
                type: 'value',
                show: false,
              },
              tooltip: {
                trigger: 'axis',
                appendToBody: true,
              },
              series: [
                {
                  data: sparkline,
                  type: 'line',
                  smooth: true,
                  symbol: 'none',
                  lineStyle: {
                    width: 2,
                    color: isNegative ? '#dc2626' : '#2563eb',
                  },
                  areaStyle: {
                    opacity: 0.18,
                    color: isNegative ? '#fca5a5' : '#93c5fd',
                  },
                },
              ],
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

