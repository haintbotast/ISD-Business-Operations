import prisma from '../config/database';
import {
  AppError,
  DashboardChartResponse,
  DashboardGranularity,
  DashboardMetricFilter,
  DashboardQueryParams,
  DashboardSummaryResponse,
  KpiMetric,
  KpiTrendResponse,
  KpiTrendRow,
  WeeklyMatrixCell,
  WeeklyMatrixResponse,
} from '../types';

const OPEN_STATUSES = new Set(['Open', 'In Progress']);
const CLOSED_STATUSES = new Set(['Resolved', 'Closed']);
const DAY_MS = 24 * 60 * 60 * 1000;

type Bucket = {
  key: string;
  label: string;
  start: Date;
  end: Date;
};

type BucketMetrics = {
  totalEvents: number;
  downtimeMinutes: number;
  closedCount: number;
  severeCount: number;
  openInProgress: number;
};

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function toUtcStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

function toUtcEnd(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

function startOfMonthUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
}

function endOfMonthUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

function startOfQuarterUtc(date: Date): Date {
  const month = date.getUTCMonth();
  const qStart = Math.floor(month / 3) * 3;
  return new Date(Date.UTC(date.getUTCFullYear(), qStart, 1, 0, 0, 0, 0));
}

function endOfQuarterUtc(date: Date): Date {
  const month = date.getUTCMonth();
  const qStart = Math.floor(month / 3) * 3;
  return new Date(Date.UTC(date.getUTCFullYear(), qStart + 3, 0, 23, 59, 59, 999));
}

function startOfYearUtc(year: number): Date {
  return new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
}

function endOfYearUtc(year: number): Date {
  return new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
}

function isoWeekInfo(date: Date): { isoYear: number; week: number } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const isoYear = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
  return { isoYear, week };
}

function startOfIsoWeekUtc(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const delta = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + delta);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function endOfIsoWeekUtc(date: Date): Date {
  const start = startOfIsoWeekUtc(date);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

function addGranularity(date: Date, granularity: DashboardGranularity, amount: number): Date {
  const d = new Date(date);
  if (granularity === 'week') {
    d.setUTCDate(d.getUTCDate() + amount * 7);
    return d;
  }
  if (granularity === 'month') {
    d.setUTCMonth(d.getUTCMonth() + amount);
    return d;
  }
  if (granularity === 'quarter') {
    d.setUTCMonth(d.getUTCMonth() + amount * 3);
    return d;
  }
  d.setUTCFullYear(d.getUTCFullYear() + amount);
  return d;
}

function alignToBucketStart(date: Date, granularity: DashboardGranularity): Date {
  if (granularity === 'week') return startOfIsoWeekUtc(date);
  if (granularity === 'month') return startOfMonthUtc(date);
  if (granularity === 'quarter') return startOfQuarterUtc(date);
  return startOfYearUtc(date.getUTCFullYear());
}

function bucketBounds(date: Date, granularity: DashboardGranularity): { start: Date; end: Date } {
  if (granularity === 'week') return { start: startOfIsoWeekUtc(date), end: endOfIsoWeekUtc(date) };
  if (granularity === 'month') return { start: startOfMonthUtc(date), end: endOfMonthUtc(date) };
  if (granularity === 'quarter') return { start: startOfQuarterUtc(date), end: endOfQuarterUtc(date) };
  return { start: startOfYearUtc(date.getUTCFullYear()), end: endOfYearUtc(date.getUTCFullYear()) };
}

function bucketLabel(date: Date, granularity: DashboardGranularity): string {
  if (granularity === 'week') {
    const { week } = isoWeekInfo(date);
    return `W${pad2(week)}`;
  }
  if (granularity === 'month') return `T${date.getUTCMonth() + 1}`;
  if (granularity === 'quarter') return `Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
  return String(date.getUTCFullYear());
}

function bucketKey(date: Date, granularity: DashboardGranularity): string {
  if (granularity === 'week') {
    const { isoYear, week } = isoWeekInfo(date);
    return `${isoYear}-W${pad2(week)}`;
  }
  if (granularity === 'month') {
    return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;
  }
  if (granularity === 'quarter') {
    return `${date.getUTCFullYear()}-Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
  }
  return String(date.getUTCFullYear());
}

function parseWeekCode(value: string): number {
  const match = /^W(\d{2})$/i.exec(value.trim());
  if (!match) return NaN;
  return Number(match[1]);
}

function parseMonth(value: string): number {
  const normalized = value.trim().toUpperCase().replace(/^T/, '').replace(/^M/, '');
  const month = Number(normalized);
  return Number.isInteger(month) ? month : NaN;
}

function parseQuarter(value: string): number {
  const match = /^Q?([1-4])$/i.exec(value.trim());
  if (!match) return NaN;
  return Number(match[1]);
}

async function resolveDateRange(query: DashboardQueryParams): Promise<{ start: Date; end: Date }> {
  if (query.granularity === 'week') {
    const startWeek = parseWeekCode(query.periodStart);
    const endWeek = parseWeekCode(query.periodEnd);
    if (!Number.isInteger(startWeek) || !Number.isInteger(endWeek) || startWeek < 1 || endWeek < 1 || startWeek > 53 || endWeek > 53) {
      throw new AppError(400, 'INVALID_PERIOD', 'Week range must use format W01-W53');
    }
    if (startWeek > endWeek) {
      throw new AppError(400, 'INVALID_PERIOD', 'periodStart must be <= periodEnd');
    }

    const startRef = await prisma.weekReference.findUnique({
      where: { year_weekCode: { year: query.year, weekCode: `W${pad2(startWeek)}` } },
    });
    const endRef = await prisma.weekReference.findUnique({
      where: { year_weekCode: { year: query.year, weekCode: `W${pad2(endWeek)}` } },
    });
    if (!startRef || !endRef) {
      throw new AppError(400, 'INVALID_PERIOD', 'Week reference not found for selected year');
    }

    return { start: toUtcStart(startRef.startDate), end: toUtcEnd(endRef.endDate) };
  }

  if (query.granularity === 'month') {
    const startMonth = parseMonth(query.periodStart);
    const endMonth = parseMonth(query.periodEnd);
    if (!Number.isInteger(startMonth) || !Number.isInteger(endMonth) || startMonth < 1 || endMonth < 1 || startMonth > 12 || endMonth > 12) {
      throw new AppError(400, 'INVALID_PERIOD', 'Month range must be 1-12');
    }
    if (startMonth > endMonth) {
      throw new AppError(400, 'INVALID_PERIOD', 'periodStart must be <= periodEnd');
    }
    const start = new Date(Date.UTC(query.year, startMonth - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(query.year, endMonth, 0, 23, 59, 59, 999));
    return { start, end };
  }

  if (query.granularity === 'quarter') {
    const startQuarter = parseQuarter(query.periodStart);
    const endQuarter = parseQuarter(query.periodEnd);
    if (!Number.isInteger(startQuarter) || !Number.isInteger(endQuarter)) {
      throw new AppError(400, 'INVALID_PERIOD', 'Quarter range must be Q1-Q4');
    }
    if (startQuarter > endQuarter) {
      throw new AppError(400, 'INVALID_PERIOD', 'periodStart must be <= periodEnd');
    }
    const startMonth = (startQuarter - 1) * 3;
    const endMonth = endQuarter * 3 - 1;
    const start = new Date(Date.UTC(query.year, startMonth, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(query.year, endMonth + 1, 0, 23, 59, 59, 999));
    return { start, end };
  }

  const startYear = Number(query.periodStart);
  const endYear = Number(query.periodEnd);
  if (!Number.isInteger(startYear) || !Number.isInteger(endYear)) {
    throw new AppError(400, 'INVALID_PERIOD', 'Year range must be numeric');
  }
  if (startYear > endYear) {
    throw new AppError(400, 'INVALID_PERIOD', 'periodStart must be <= periodEnd');
  }
  return {
    start: startOfYearUtc(startYear),
    end: endOfYearUtc(endYear),
  };
}

function buildBuckets(granularity: DashboardGranularity, start: Date, end: Date): Bucket[] {
  const buckets: Bucket[] = [];
  let cursor = alignToBucketStart(start, granularity);

  while (cursor <= end) {
    const bounds = bucketBounds(cursor, granularity);
    if (bounds.end >= start) {
      buckets.push({
        key: bucketKey(bounds.start, granularity),
        label: bucketLabel(bounds.start, granularity),
        start: bounds.start,
        end: bounds.end,
      });
    }
    cursor = addGranularity(cursor, granularity, 1);
  }

  return buckets;
}

function buildTrailingBuckets(granularity: DashboardGranularity, end: Date, count: number): Bucket[] {
  const alignedEndStart = alignToBucketStart(end, granularity);
  const startCursor = addGranularity(alignedEndStart, granularity, -(count - 1));
  const buckets: Bucket[] = [];
  let cursor = startCursor;
  for (let i = 0; i < count; i += 1) {
    const bounds = bucketBounds(cursor, granularity);
    buckets.push({
      key: bucketKey(bounds.start, granularity),
      label: bucketLabel(bounds.start, granularity),
      start: bounds.start,
      end: bounds.end,
    });
    cursor = addGranularity(cursor, granularity, 1);
  }
  return buckets;
}

function emptyBucketMetrics(): BucketMetrics {
  return {
    totalEvents: 0,
    downtimeMinutes: 0,
    closedCount: 0,
    severeCount: 0,
    openInProgress: 0,
  };
}

function aggregateBuckets(
  events: Array<{ date: Date; downtimeMinutes: number | null; status: string; severity: string }>,
  granularity: DashboardGranularity,
): Map<string, BucketMetrics> {
  const byBucket = new Map<string, BucketMetrics>();

  for (const event of events) {
    const key = bucketKey(event.date, granularity);
    const entry = byBucket.get(key) ?? emptyBucketMetrics();
    entry.totalEvents += 1;
    entry.downtimeMinutes += event.downtimeMinutes ?? 0;
    if (CLOSED_STATUSES.has(event.status)) entry.closedCount += 1;
    if (event.severity === 'Critical') entry.severeCount += 1;
    if (OPEN_STATUSES.has(event.status)) entry.openInProgress += 1;
    byBucket.set(key, entry);
  }

  return byBucket;
}

function roundOne(value: number): number {
  return Number(value.toFixed(1));
}

function toPercent(part: number, total: number): number {
  if (total <= 0) return 0;
  return roundOne((part / total) * 100);
}

function deltaPercent(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return roundOne(((current - previous) / Math.abs(previous)) * 100);
}

function eventMetrics(events: Array<{ downtimeMinutes: number | null; status: string; severity: string }>): {
  totalEvents: number;
  downtimeMinutes: number;
  closureRate: number;
  severeIncidents: number;
  openInProgress: number;
} {
  const total = events.length;
  const downtime = events.reduce((sum, event) => sum + (event.downtimeMinutes ?? 0), 0);
  const closed = events.filter((event) => CLOSED_STATUSES.has(event.status)).length;
  const severe = events.filter((event) => event.severity === 'Critical').length;
  const openInProgress = events.filter((event) => OPEN_STATUSES.has(event.status)).length;

  return {
    totalEvents: total,
    downtimeMinutes: downtime,
    closureRate: toPercent(closed, total),
    severeIncidents: severe,
    openInProgress,
  };
}

function metricSubset<T extends { status: string; severity: string; downtimeMinutes: number | null }>(
  events: T[],
  metricFilter: DashboardMetricFilter,
): T[] {
  if (metricFilter === 'open') return events.filter((event) => OPEN_STATUSES.has(event.status));
  if (metricFilter === 'severe') return events.filter((event) => event.severity === 'Critical');
  if (metricFilter === 'downtime') return events.filter((event) => (event.downtimeMinutes ?? 0) > 0);
  if (metricFilter === 'closure') return events.filter((event) => CLOSED_STATUSES.has(event.status));
  return events;
}

function buildStatusDistribution(
  events: Array<{ severity: string; status: string }>,
): DashboardSummaryResponse['statusDistribution'] {
  const total = events.length;
  const bySeverity = (severity: string) => {
    const filtered = events.filter((event) => event.severity === severity);
    const count = filtered.length;
    return {
      count,
      pct: toPercent(count, total),
      open: filtered.filter((event) => OPEN_STATUSES.has(event.status)).length,
      closed: filtered.filter((event) => CLOSED_STATUSES.has(event.status)).length,
    };
  };

  return {
    all: { count: total, pct: total === 0 ? 0 : 100 },
    low: bySeverity('Low'),
    medium: bySeverity('Medium'),
    high: bySeverity('High'),
    critical: bySeverity('Critical'),
  };
}

function daysBetween(start: Date, end: Date): number {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / DAY_MS));
}

export const dashboardService = {
  async getSummary(query: DashboardQueryParams): Promise<DashboardSummaryResponse> {
    const { start, end } = await resolveDateRange(query);
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - (end.getTime() - start.getTime()));

    const baseWhere = {
      deletedAt: null as null,
      ...(query.locationCode ? { locationCode: query.locationCode } : {}),
    };

    const [currentEvents, previousEvents] = await Promise.all([
      prisma.event.findMany({
        where: {
          ...baseWhere,
          date: { gte: start, lte: end },
        },
        select: {
          id: true,
          date: true,
          weekCode: true,
          locationCode: true,
          systemComponent: true,
          description: true,
          severity: true,
          status: true,
          downtimeMinutes: true,
        },
      }),
      prisma.event.findMany({
        where: {
          ...baseWhere,
          date: { gte: prevStart, lte: prevEnd },
        },
        select: {
          date: true,
          severity: true,
          status: true,
          downtimeMinutes: true,
        },
      }),
    ]);

    const currentMetrics = eventMetrics(currentEvents);
    const previousMetrics = eventMetrics(previousEvents);

    const trailingBuckets = buildTrailingBuckets(query.granularity, end, 12);
    const sparklineStart = trailingBuckets[0].start;
    const sparklineEvents = await prisma.event.findMany({
      where: {
        ...baseWhere,
        date: { gte: sparklineStart, lte: end },
      },
      select: {
        date: true,
        severity: true,
        status: true,
        downtimeMinutes: true,
      },
    });

    const bucketAgg = aggregateBuckets(sparklineEvents, query.granularity);
    const sparklineFor = (mapper: (bucket: BucketMetrics) => number): number[] =>
      trailingBuckets.map((bucket) => mapper(bucketAgg.get(bucket.key) ?? emptyBucketMetrics()));

    const kpis: Record<keyof DashboardSummaryResponse['kpis'], KpiMetric> = {
      totalEvents: {
        value: currentMetrics.totalEvents,
        deltaPct: deltaPercent(currentMetrics.totalEvents, previousMetrics.totalEvents),
        sparkline: sparklineFor((bucket) => bucket.totalEvents),
      },
      downtimeMinutes: {
        value: currentMetrics.downtimeMinutes,
        deltaPct: deltaPercent(currentMetrics.downtimeMinutes, previousMetrics.downtimeMinutes),
        sparkline: sparklineFor((bucket) => bucket.downtimeMinutes),
      },
      closureRate: {
        value: roundOne(currentMetrics.closureRate),
        deltaPct: deltaPercent(currentMetrics.closureRate, previousMetrics.closureRate),
        sparkline: sparklineFor((bucket) => roundOne(toPercent(bucket.closedCount, bucket.totalEvents))),
      },
      severeIncidents: {
        value: currentMetrics.severeIncidents,
        deltaPct: deltaPercent(currentMetrics.severeIncidents, previousMetrics.severeIncidents),
        sparkline: sparklineFor((bucket) => bucket.severeCount),
      },
      openInProgress: {
        value: currentMetrics.openInProgress,
        deltaPct: deltaPercent(currentMetrics.openInProgress, previousMetrics.openInProgress),
        sparkline: sparklineFor((bucket) => bucket.openInProgress),
      },
    };

    const now = new Date();
    const detailRows = metricSubset(currentEvents, query.metricFilter)
      .map((event) => ({
        id: event.id,
        date: event.date.toISOString(),
        weekCode: event.weekCode,
        locationCode: event.locationCode,
        systemComponent: event.systemComponent ?? null,
        description: event.description,
        severity: event.severity,
        status: event.status,
        daysOpen: daysBetween(event.date, now),
      }))
      .sort((a, b) => b.daysOpen - a.daysOpen || b.date.localeCompare(a.date))
      .slice(0, 50);

    return {
      kpis,
      statusDistribution: buildStatusDistribution(currentEvents),
      detailRows,
    };
  },

  async getChart(query: DashboardQueryParams): Promise<DashboardChartResponse> {
    const { start, end } = await resolveDateRange(query);
    const buckets = buildBuckets(query.granularity, start, end);
    const bucketIndex = new Map<string, number>();
    buckets.forEach((bucket, index) => bucketIndex.set(bucket.key, index));

    const [events, categories] = await Promise.all([
      prisma.event.findMany({
        where: {
          deletedAt: null,
          date: { gte: start, lte: end },
          ...(query.locationCode ? { locationCode: query.locationCode } : {}),
        },
        select: {
          date: true,
          category: true,
          classification: true,
        },
      }),
      prisma.categoryMaster.findMany({
        select: {
          category: true,
          classification: true,
        },
      }),
    ]);

    const categoryClassMap = new Map<string, 'Good' | 'Bad'>();
    for (const category of categories) {
      categoryClassMap.set(category.category, category.classification === 'Good' ? 'Good' : 'Bad');
    }

    const grouped = new Map<string, { classification: 'Good' | 'Bad'; data: number[] }>();
    for (const event of events) {
      const key = bucketKey(event.date, query.granularity);
      const idx = bucketIndex.get(key);
      if (idx === undefined) continue;

      const existing = grouped.get(event.category);
      if (existing) {
        existing.data[idx] += 1;
        continue;
      }

      const classification = categoryClassMap.get(event.category) ?? (event.classification === 'Good' ? 'Good' : 'Bad');
      const data = Array.from({ length: buckets.length }, () => 0);
      data[idx] = 1;
      grouped.set(event.category, { classification, data });
    }

    const series = Array.from(grouped.entries())
      .map(([name, value]) => ({
        name,
        classification: value.classification,
        data: value.data,
      }))
      .sort((a, b) => {
        if (a.classification !== b.classification) return a.classification === 'Bad' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    return {
      xAxis: buckets.map((bucket) => bucket.label),
      series,
    };
  },

  async getWeeklyMatrix(week: string, year: number): Promise<WeeklyMatrixResponse> {
    const weekNum = parseWeekCode(week);
    if (!Number.isInteger(weekNum) || weekNum < 1 || weekNum > 53) {
      throw new AppError(400, 'INVALID_WEEK', 'Week must be in format W01-W53');
    }
    const weekCode = `W${pad2(weekNum)}`;

    const weekRef = await prisma.weekReference.findUnique({
      where: { year_weekCode: { year, weekCode } },
    });
    if (!weekRef) {
      throw new AppError(400, 'WEEK_NOT_FOUND', `Week ${weekCode} not found for year ${year}`);
    }

    const [locations, categories, events] = await Promise.all([
      prisma.locationMaster.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
        select: { code: true },
      }),
      prisma.categoryMaster.findMany({
        where: { isActive: true },
        orderBy: [{ mainGroup: 'asc' }, { sortOrder: 'asc' }, { category: 'asc' }],
        select: { mainGroup: true, category: true, classification: true },
      }),
      prisma.event.findMany({
        where: { year, weekCode, deletedAt: null },
        select: {
          id: true,
          locationCode: true,
          category: true,
          description: true,
          severity: true,
          status: true,
          downtimeMinutes: true,
          classification: true,
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    const cells: Record<string, WeeklyMatrixCell[]> = {};
    for (const event of events) {
      const key = `${event.locationCode}|||${event.category}`;
      if (!cells[key]) cells[key] = [];
      cells[key].push({
        id: event.id,
        description: event.description,
        severity: event.severity,
        status: event.status,
        downtimeMinutes: event.downtimeMinutes,
        classification: (event.classification === 'Good' ? 'Good' : 'Bad') as 'Good' | 'Bad',
      });
    }

    const fmt = (d: Date): string => {
      const day = String(d.getUTCDate()).padStart(2, '0');
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      return `${day}/${month}/${d.getUTCFullYear()}`;
    };

    return {
      week: weekCode,
      year,
      weekRange: `${fmt(weekRef.startDate)} – ${fmt(weekRef.endDate)}`,
      locations: locations.map((loc: { code: string }) => loc.code),
      categories: categories.map((cat: { mainGroup: string; category: string; classification: string }) => ({
        mainGroup: cat.mainGroup,
        category: cat.category,
        classification: (cat.classification === 'Good' ? 'Good' : 'Bad') as 'Good' | 'Bad',
      })),
      cells,
    };
  },

  async getKpiTrend(granularity: DashboardGranularity, year: number): Promise<KpiTrendResponse> {
    const yearStart = startOfYearUtc(year);
    const yearEnd = endOfYearUtc(year);
    const allBuckets = buildBuckets(granularity, yearStart, yearEnd);

    const events = await prisma.event.findMany({
      where: { date: { gte: yearStart, lte: yearEnd }, deletedAt: null },
      select: { date: true, downtimeMinutes: true, status: true, severity: true },
    });

    const byBucket = aggregateBuckets(events, granularity);
    const now = new Date();
    const currentPeriod = bucketLabel(now, granularity);

    const rows: KpiTrendRow[] = allBuckets.map((bucket) => {
      const m = byBucket.get(bucket.key) ?? emptyBucketMetrics();
      return {
        period: bucket.label,
        totalEvents: m.totalEvents,
        downtimeMinutes: m.downtimeMinutes,
        closureRate: toPercent(m.closedCount, m.totalEvents),
        severeIncidents: m.severeCount,
        openInProgress: m.openInProgress,
      };
    });

    return {
      granularity,
      year,
      currentPeriod,
      columns: ['totalEvents', 'downtimeMinutes', 'closureRate', 'severeIncidents', 'openInProgress'],
      rows,
    };
  },
};

