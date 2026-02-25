import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { KpiTrendData } from '@/types';

interface KpiTrendTableProps {
  data: KpiTrendData | undefined;
  isLoading?: boolean;
}

function fmt(value: number, col: string): string {
  if (col === 'closureRate') return `${value.toFixed(1)}%`;
  return value.toLocaleString('vi-VN');
}

function isAlert(value: number, col: string): boolean {
  if (col === 'closureRate') return value < 60;
  if (col === 'severeIncidents') return value > 0;
  return false;
}

const COLUMNS = ['totalEvents', 'downtimeMinutes', 'closureRate', 'severeIncidents', 'openInProgress'] as const;

export function KpiTrendTable({ data, isLoading }: KpiTrendTableProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 w-full animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  if (!data || data.rows.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
        {t('common.noData')}
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 bg-background font-semibold">
              {t('reports.kpiColumns.period')}
            </TableHead>
            {COLUMNS.map((col) => (
              <TableHead key={col} className="text-right whitespace-nowrap">
                {t(`reports.kpiColumns.${col}`)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.rows.map((row) => {
            const isCurrent = row.period === data.currentPeriod;
            return (
              <TableRow
                key={row.period}
                className={cn(isCurrent && 'bg-blue-50 font-semibold')}
              >
                <TableCell className="sticky left-0 z-10 bg-background font-mono">
                  {row.period}
                  {isCurrent && (
                    <span className="ml-1 rounded bg-blue-200 px-1 text-xs text-blue-800">
                      now
                    </span>
                  )}
                </TableCell>
                {COLUMNS.map((col) => {
                  const value = row[col];
                  const alert = isAlert(value, col);
                  return (
                    <TableCell
                      key={col}
                      className={cn(
                        'text-right tabular-nums',
                        alert && 'text-destructive font-semibold',
                      )}
                    >
                      {fmt(value, col)}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
