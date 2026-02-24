import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { currentIsoYear, currentWeekCode } from '@/lib/utils';
import type { DashboardGranularity } from '@/types';

interface TimeRangeSelectorProps {
  granularity: DashboardGranularity;
  year: number;
  periodStart: string;
  periodEnd: string;
  onChange: (granularity: DashboardGranularity, year: number, periodStart: string, periodEnd: string) => void;
}

function weekNumber(weekCode: string): number {
  const match = /^W(\d{2})$/i.exec(weekCode);
  return match ? Number(match[1]) : 0;
}

function monthNumber(month: string): number {
  return Number(month.replace(/^T/i, ''));
}

function quarterNumber(quarter: string): number {
  return Number(quarter.replace(/^Q/i, ''));
}

function comparePeriod(granularity: DashboardGranularity, left: string, right: string): number {
  if (granularity === 'week') return weekNumber(left) - weekNumber(right);
  if (granularity === 'month') return monthNumber(left) - monthNumber(right);
  if (granularity === 'quarter') return quarterNumber(left) - quarterNumber(right);
  return Number(left) - Number(right);
}

function currentQuarter(): string {
  const month = new Date().getMonth();
  return `Q${Math.floor(month / 3) + 1}`;
}

function currentMonth(): string {
  return String(new Date().getMonth() + 1).padStart(2, '0');
}

function buildPeriodOptions(granularity: DashboardGranularity, year: number): Array<{ value: string; label: string }> {
  if (granularity === 'week') {
    const maxWeeks = year === 2026 ? 53 : 52;
    return Array.from({ length: maxWeeks }, (_v, idx) => {
      const week = `W${String(idx + 1).padStart(2, '0')}`;
      return { value: week, label: week };
    });
  }
  if (granularity === 'month') {
    return Array.from({ length: 12 }, (_v, idx) => {
      const month = String(idx + 1).padStart(2, '0');
      return { value: month, label: `T${idx + 1}` };
    });
  }
  if (granularity === 'quarter') {
    return Array.from({ length: 4 }, (_v, idx) => {
      const quarter = `Q${idx + 1}`;
      return { value: quarter, label: quarter };
    });
  }
  const currentYear = currentIsoYear();
  return Array.from({ length: 8 }, (_v, idx) => {
    const value = String(currentYear - 3 + idx);
    return { value, label: value };
  });
}

export function TimeRangeSelector({
  granularity,
  year,
  periodStart,
  periodEnd,
  onChange,
}: TimeRangeSelectorProps) {
  const { t } = useTranslation();

  const periodOptions = useMemo(() => buildPeriodOptions(granularity, year), [granularity, year]);

  const yearOptions = useMemo(() => {
    const currentYear = currentIsoYear();
    return Array.from({ length: 6 }, (_v, idx) => currentYear - 2 + idx);
  }, []);

  const applyGranularity = (next: DashboardGranularity) => {
    if (next === 'week') {
      const currentWeek = currentWeekCode();
      onChange(next, year, currentWeek, currentWeek);
      return;
    }
    if (next === 'month') {
      const month = currentMonth();
      onChange(next, year, month, month);
      return;
    }
    if (next === 'quarter') {
      const quarter = currentQuarter();
      onChange(next, year, quarter, quarter);
      return;
    }
    const thisYear = String(currentIsoYear());
    onChange(next, year, thisYear, thisYear);
  };

  const applyStart = (value: string) => {
    if (comparePeriod(granularity, value, periodEnd) > 0) {
      onChange(granularity, year, value, value);
      return;
    }
    onChange(granularity, year, value, periodEnd);
  };

  const applyEnd = (value: string) => {
    if (comparePeriod(granularity, periodStart, value) > 0) {
      onChange(granularity, year, value, value);
      return;
    }
    onChange(granularity, year, periodStart, value);
  };

  const applyPresetCurrent = () => {
    if (granularity === 'week') {
      const week = currentWeekCode();
      onChange(granularity, currentIsoYear(), week, week);
      return;
    }
    if (granularity === 'month') {
      const month = currentMonth();
      onChange(granularity, currentIsoYear(), month, month);
      return;
    }
    if (granularity === 'quarter') {
      const quarter = currentQuarter();
      onChange(granularity, currentIsoYear(), quarter, quarter);
      return;
    }
    const thisYear = String(currentIsoYear());
    onChange(granularity, currentIsoYear(), thisYear, thisYear);
  };

  const applyPresetRecent = () => {
    if (granularity === 'week') {
      const y = currentIsoYear();
      const currentWeek = weekNumber(currentWeekCode());
      const startWeek = Math.max(1, currentWeek - 3);
      onChange(granularity, y, `W${String(startWeek).padStart(2, '0')}`, `W${String(currentWeek).padStart(2, '0')}`);
      return;
    }
    if (granularity === 'month') {
      const y = currentIsoYear();
      const m = Number(currentMonth());
      const start = Math.max(1, m - 2);
      onChange(granularity, y, String(start).padStart(2, '0'), String(m).padStart(2, '0'));
      return;
    }
    if (granularity === 'quarter') {
      const y = currentIsoYear();
      const q = quarterNumber(currentQuarter());
      const start = Math.max(1, q - 1);
      onChange(granularity, y, `Q${start}`, `Q${q}`);
      return;
    }
    const y = currentIsoYear();
    onChange(granularity, y, String(y - 1), String(y));
  };

  const applyPresetYtd = () => {
    const y = currentIsoYear();
    if (granularity === 'week') {
      onChange(granularity, y, 'W01', currentWeekCode());
      return;
    }
    if (granularity === 'month') {
      onChange(granularity, y, '01', currentMonth());
      return;
    }
    if (granularity === 'quarter') {
      onChange(granularity, y, 'Q1', currentQuarter());
      return;
    }
    onChange(granularity, y, String(y), String(y));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-3">
      <Select value={granularity} onValueChange={(value) => applyGranularity(value as DashboardGranularity)}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="week">{t('dashboard.granularity.week')}</SelectItem>
          <SelectItem value="month">{t('dashboard.granularity.month')}</SelectItem>
          <SelectItem value="quarter">{t('dashboard.granularity.quarter')}</SelectItem>
          <SelectItem value="year">{t('dashboard.granularity.year')}</SelectItem>
        </SelectContent>
      </Select>

      {granularity !== 'year' && (
        <Select value={String(year)} onValueChange={(value) => onChange(granularity, Number(value), periodStart, periodEnd)}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value={periodStart} onValueChange={applyStart}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {periodOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="px-1 text-muted-foreground">-</span>

      <Select value={periodEnd} onValueChange={applyEnd}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {periodOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={applyPresetCurrent}>
          {t('dashboard.presets.current')}
        </Button>
        <Button variant="outline" size="sm" onClick={applyPresetRecent}>
          {t('dashboard.presets.recent')}
        </Button>
        <Button variant="outline" size="sm" onClick={applyPresetYtd}>
          {t('dashboard.presets.ytd')}
        </Button>
      </div>
    </div>
  );
}

