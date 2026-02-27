// reports.service.ts — JIS Q 31000 Risk Matrix + JIS Z 8115 Pareto analysis
import prisma from '../config/database';
import type { RiskMatrixItem, RiskMatrixResponse, ParetoItem, ParetoResponse, ImpactScope } from '../types';

// ─── Severity → numeric impact ────────────────────────────────────────────────

const SEVERITY_MAP: Record<string, number> = {
  Low: 1, Medium: 2, High: 3, Critical: 4,
};

const IMPACT_LABELS: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Critical',
};

// ─── Likelihood from event count ──────────────────────────────────────────────

function likelihoodFromCount(count: number): { value: number; label: string } {
  if (count <= 1) return { value: 1, label: 'Rare' };
  if (count <= 3) return { value: 2, label: 'Unlikely' };
  if (count <= 6) return { value: 3, label: 'Possible' };
  return { value: 4, label: 'Likely' };
}

// ─── Risk Level from score 1–16 ───────────────────────────────────────────────

function riskLevelFromScore(score: number): 'Low' | 'Medium' | 'High' | 'Critical' {
  if (score <= 4) return 'Low';
  if (score <= 8) return 'Medium';
  if (score <= 12) return 'High';
  return 'Critical';
}

// ─── Mode (最頻値) of impact scopes ───────────────────────────────────────────

function dominantScope(scopes: string[]): ImpactScope {
  const counts: Record<string, number> = {};
  for (const s of scopes) counts[s] = (counts[s] ?? 0) + 1;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return (top?.[0] ?? 'Site') as ImpactScope;
}

// ─── Build week code array from range (e.g. W01–W08) ─────────────────────────

function buildWeekCodes(periodStart: string, periodEnd: string): string[] {
  const parse = (s: string) => parseInt(s.replace(/^W/i, ''), 10);
  const start = parse(periodStart);
  const end = parse(periodEnd);
  if (isNaN(start) || isNaN(end) || start > end) return [];
  const codes: string[] = [];
  for (let i = start; i <= end; i++) {
    codes.push(`W${String(i).padStart(2, '0')}`);
  }
  return codes;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const reportsService = {
  /**
   * FR-012: Risk Matrix — JIS Q 31000:2019
   * Calculates Impact × Likelihood per category (Bad events only).
   * Bubble size = dominant impactScope.
   */
  async getRiskMatrix(params: {
    year: number;
    weekCode?: string;
    periodStart?: string;
    periodEnd?: string;
  }): Promise<RiskMatrixResponse> {
    const { year } = params;
    let weekCodes: string[] | undefined;
    let period: string;

    if (params.weekCode) {
      const wc = `W${params.weekCode.replace(/^W/i, '').padStart(2, '0')}`;
      weekCodes = [wc];
      period = `${wc}/${year}`;
    } else if (params.periodStart && params.periodEnd) {
      weekCodes = buildWeekCodes(params.periodStart, params.periodEnd);
      period = `${params.periodStart}–${params.periodEnd}/${year}`;
    } else {
      period = `${year}`;
    }

    const where: Record<string, unknown> = {
      year,
      deletedAt: null,
      // Risk Matrix: Incidents and Problems represent operational risks (ITIL v4)
      // Existing events before eventType field default to 'Incident'
      eventType: { in: ['Incident', 'Problem'] },
    };
    if (weekCodes?.length) where.weekCode = { in: weekCodes };

    const events = await prisma.event.findMany({
      where,
      select: {
        category: true,
        mainGroup: true,
        severity: true,
        impactScope: true,
        classification: true,
      },
    });

    // Group by category
    type CategoryGroup = {
      mainGroup: string;
      severities: string[];
      scopes: string[];
    };

    const groups = new Map<string, CategoryGroup>();
    for (const event of events) {
      const existing = groups.get(event.category);
      if (existing) {
        existing.severities.push(event.severity);
        existing.scopes.push(event.impactScope);
      } else {
        groups.set(event.category, {
          mainGroup: event.mainGroup,
          severities: [event.severity],
          scopes: [event.impactScope],
        });
      }
    }

    const items: RiskMatrixItem[] = Array.from(groups.entries()).map(([category, g]) => {
      const eventCount = g.severities.length;
      const maxSeverityNum = Math.max(...g.severities.map((s) => SEVERITY_MAP[s] ?? 1));
      const maxSeverity = Object.keys(SEVERITY_MAP).find((k) => SEVERITY_MAP[k] === maxSeverityNum) ?? 'Low';
      const { value: likelihood, label: likelihoodLabel } = likelihoodFromCount(eventCount);
      const impact = maxSeverityNum;
      const riskScore = impact * likelihood;
      return {
        category,
        mainGroup: g.mainGroup,
        eventCount,
        maxSeverity,
        impact,
        impactLabel: IMPACT_LABELS[impact] ?? String(impact),
        likelihood,
        likelihoodLabel,
        riskScore,
        riskLevel: riskLevelFromScore(riskScore),
        dominantScope: dominantScope(g.scopes),
        classification: 'Bad' as const,
      };
    });

    // Sort by riskScore desc, then eventCount desc
    items.sort((a, b) => b.riskScore - a.riskScore || b.eventCount - a.eventCount);
    return { period, items };
  },

  /**
   * FR-013: Pareto Analysis — JIS Z 8115
   * Groups by (category, systemComponent) for specific patterns.
   * Supports classificationFilter='Bad' (used by TopIssues) or 'all' (full Pareto chart).
   */
  async getPareto(params: {
    year: number;
    periodStart?: string;
    periodEnd?: string;
    classificationFilter?: 'Bad' | 'all';
  }): Promise<ParetoResponse> {
    const { year, classificationFilter = 'all' } = params;
    let weekCodes: string[] | undefined;
    let period: string;

    if (params.periodStart && params.periodEnd) {
      weekCodes = buildWeekCodes(params.periodStart, params.periodEnd);
      period = `${params.periodStart}–${params.periodEnd}/${year}`;
    } else {
      period = `${year}`;
    }

    const where: Record<string, unknown> = { year, deletedAt: null };
    if (weekCodes?.length) where.weekCode = { in: weekCodes };
    if (classificationFilter === 'Bad') where.classification = 'Bad';

    // Period-filtered events for count/pareto — group by (category, systemComponent)
    const events = await prisma.event.findMany({
      where,
      select: { category: true, mainGroup: true, classification: true, systemComponent: true },
    });

    // Year-wide recurrence: distinct weeks per (category|systemComponent) key
    const yearEvents = await prisma.event.findMany({
      where: { year, deletedAt: null },
      select: { category: true, systemComponent: true, weekCode: true },
    });

    const recurrenceMap = new Map<string, Set<string>>();
    const yearWeekSet = new Set<string>();
    for (const e of yearEvents) {
      const key = `${e.category}|${e.systemComponent ?? ''}`;
      if (!recurrenceMap.has(key)) recurrenceMap.set(key, new Set());
      recurrenceMap.get(key)!.add(e.weekCode);
      yearWeekSet.add(e.weekCode);
    }
    const totalWeeksInYear = yearWeekSet.size;

    type Group = {
      mainGroup: string;
      systemComponent?: string;
      classification: 'Good' | 'Bad' | 'Neutral';
      count: number;
    };

    const groups = new Map<string, Group>();
    for (const event of events) {
      const key = `${event.category}|${event.systemComponent ?? ''}`;
      const existing = groups.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        groups.set(key, {
          mainGroup: event.mainGroup,
          systemComponent: event.systemComponent ?? undefined,
          classification: event.classification as 'Good' | 'Bad' | 'Neutral',
          count: 1,
        });
      }
    }

    const total = events.length;
    const sorted = Array.from(groups.entries()).sort((a, b) => b[1].count - a[1].count);

    let cumCount = 0;
    const items: ParetoItem[] = sorted.map(([key, g]) => {
      const category = key.split('|')[0];
      cumCount += g.count;
      return {
        category,
        mainGroup: g.mainGroup,
        systemComponent: g.systemComponent,
        classification: g.classification,
        count: g.count,
        percentage: total > 0 ? Number(((g.count / total) * 100).toFixed(1)) : 0,
        cumulative: total > 0 ? Number(((cumCount / total) * 100).toFixed(1)) : 0,
        weeksAppeared: recurrenceMap.get(key)?.size ?? 0,
      };
    });

    return { period, total, totalWeeksInYear, items };
  },
};
