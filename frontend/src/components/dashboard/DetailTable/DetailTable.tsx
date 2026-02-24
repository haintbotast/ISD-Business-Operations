import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, severityColor, statusColor } from '@/lib/utils';
import type { DashboardDetailRow } from '@/types';

interface DetailTableProps {
  title: string;
  rows: DashboardDetailRow[] | undefined;
  isLoading?: boolean;
}

export function DetailTable({ title, rows, isLoading = false }: DetailTableProps) {
  const { t } = useTranslation();

  const sortedRows = useMemo(() => {
    const data = [...(rows ?? [])];
    data.sort((a, b) => b.daysOpen - a.daysOpen || b.date.localeCompare(a.date));
    return data;
  }, [rows]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-72 animate-pulse rounded-md bg-muted" />
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="w-20">{t('event.fields.weekCode')}</TableHead>
                  <TableHead className="w-24">{t('event.fields.date')}</TableHead>
                  <TableHead className="w-24">{t('event.fields.location')}</TableHead>
                  <TableHead className="w-40">{t('event.fields.systemComponent')}</TableHead>
                  <TableHead>{t('event.fields.description')}</TableHead>
                  <TableHead className="w-24">{t('event.fields.severity')}</TableHead>
                  <TableHead className="w-28">{t('event.fields.status')}</TableHead>
                  <TableHead className="w-20">{t('dashboard.daysOpen')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      {t('common.noData')}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedRows.map((row, index) => (
                    <TableRow key={row.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{row.weekCode}</TableCell>
                      <TableCell>{formatDate(row.date)}</TableCell>
                      <TableCell>{row.locationCode}</TableCell>
                      <TableCell className="max-w-[12rem] truncate">{row.systemComponent ?? '-'}</TableCell>
                      <TableCell className="max-w-[22rem] truncate">{row.description}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityColor(row.severity)}`}>
                          {t(`event.severity.${row.severity}`)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(row.status)}`}>
                          {t(`event.status.${row.status}`)}
                        </span>
                      </TableCell>
                      <TableCell>{row.daysOpen}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

