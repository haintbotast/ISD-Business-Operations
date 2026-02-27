import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
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
import { SEVERITY_COLORS, STATUS_COLORS } from '@/lib/colors';
import type { DashboardDetailRow } from '@/types';

interface DetailTableProps {
  title: string;
  rows: DashboardDetailRow[] | undefined;
  isLoading?: boolean;
}

// ── FilterChipGroup ────────────────────────────────────────────────────────────
interface FilterChipGroupProps<T extends string> {
  options: T[];
  value: T | 'all';
  onChange: (v: T | 'all') => void;
  labelFn?: (v: T) => string;
  colorFn?: (v: T) => string;
  counts: Record<string, number>;
}

function FilterChipGroup<T extends string>({
  options, value, onChange, labelFn, colorFn, counts,
}: FilterChipGroupProps<T>) {
  const allCount = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <div className="flex flex-wrap gap-1">
      <button
        onClick={() => onChange('all')}
        className={cn(
          'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
          value === 'all'
            ? 'border-foreground/30 bg-foreground text-background'
            : 'border-border bg-background text-muted-foreground hover:bg-muted',
        )}
      >
        Tất cả ({allCount})
      </button>
      {options.map((opt) => {
        const active = value === opt;
        const bg = colorFn?.(opt);
        return (
          <button
            key={opt}
            onClick={() => onChange(active ? 'all' : opt)}
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
              active ? 'border-transparent text-white' : 'border-border bg-background text-muted-foreground hover:bg-muted',
            )}
            style={active && bg ? { backgroundColor: bg, borderColor: bg } : undefined}
          >
            {labelFn ? labelFn(opt) : opt} ({counts[opt] ?? 0})
          </button>
        );
      })}
    </div>
  );
}

const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'] as const;
const STATUSES   = ['Open', 'In Progress', 'Resolved', 'Closed'] as const;

export function DetailTable({ title, rows, isLoading = false }: DetailTableProps) {
  const { t } = useTranslation();

  const [severityFilter, setSeverityFilter] = useState<typeof SEVERITIES[number] | 'all'>('all');
  const [statusFilter,   setStatusFilter]   = useState<typeof STATUSES[number] | 'all'>('all');
  const [locationFilter, setLocationFilter] = useState<string | 'all'>('all');

  // Reset filters when rows change (period change)
  useEffect(() => {
    setSeverityFilter('all');
    setStatusFilter('all');
    setLocationFilter('all');
  }, [rows]);

  const sortedRows = useMemo(() => {
    const data = [...(rows ?? [])];
    data.sort((a, b) => b.daysOpen - a.daysOpen || b.date.localeCompare(a.date));
    return data;
  }, [rows]);

  const locations = useMemo(
    () => [...new Set(sortedRows.map((r) => r.locationCode))].sort(),
    [sortedRows],
  );

  const filteredRows = useMemo(() => {
    return sortedRows.filter((r) => {
      if (severityFilter !== 'all' && r.severity !== severityFilter) return false;
      if (statusFilter   !== 'all' && r.status   !== statusFilter)   return false;
      if (locationFilter !== 'all' && r.locationCode !== locationFilter) return false;
      return true;
    });
  }, [sortedRows, severityFilter, statusFilter, locationFilter]);

  // Count helpers (based on already-filtered subset excluding the dimension being counted)
  const severityCounts = useMemo(() => {
    const base = sortedRows.filter(
      (r) =>
        (statusFilter   === 'all' || r.status      === statusFilter) &&
        (locationFilter === 'all' || r.locationCode === locationFilter),
    );
    return Object.fromEntries(SEVERITIES.map((s) => [s, base.filter((r) => r.severity === s).length]));
  }, [sortedRows, statusFilter, locationFilter]);

  const statusCounts = useMemo(() => {
    const base = sortedRows.filter(
      (r) =>
        (severityFilter === 'all' || r.severity      === severityFilter) &&
        (locationFilter === 'all' || r.locationCode  === locationFilter),
    );
    return Object.fromEntries(STATUSES.map((s) => [s, base.filter((r) => r.status === s).length]));
  }, [sortedRows, severityFilter, locationFilter]);

  const locationCounts = useMemo(() => {
    const base = sortedRows.filter(
      (r) =>
        (severityFilter === 'all' || r.severity === severityFilter) &&
        (statusFilter   === 'all' || r.status   === statusFilter),
    );
    return Object.fromEntries(locations.map((l) => [l, base.filter((r) => r.locationCode === l).length]));
  }, [sortedRows, severityFilter, statusFilter, locations]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="h-72 animate-pulse rounded-md bg-muted" />
        ) : (
          <>
            {/* ── Filter chips ── */}
            <div className="space-y-1.5">
              <FilterChipGroup
                options={[...SEVERITIES]}
                value={severityFilter}
                onChange={setSeverityFilter}
                labelFn={(v) => t(`event.severity.${v}`)}
                colorFn={(v) => SEVERITY_COLORS[v]}
                counts={severityCounts}
              />
              <FilterChipGroup
                options={[...STATUSES]}
                value={statusFilter}
                onChange={setStatusFilter}
                labelFn={(v) => t(`event.status.${v}`)}
                colorFn={(v) => STATUS_COLORS[v]}
                counts={statusCounts}
              />
              {locations.length > 1 && (
                <FilterChipGroup
                  options={locations}
                  value={locationFilter}
                  onChange={setLocationFilter}
                  counts={locationCounts}
                />
              )}
            </div>

            {/* ── Table ── */}
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
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                        {t('common.noData')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row, index) => (
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
          </>
        )}
      </CardContent>
    </Card>
  );
}

