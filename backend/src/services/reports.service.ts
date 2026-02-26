// reports.service.ts — JIS Q 31000 Risk Matrix + JIS Z 8115 Pareto analysis
import prisma from '../config/database';
import type { RiskMatrixItem, RiskMatrixResponse, ParetoItem, ParetoResponse, ImpactScope } from '../types';

// ─── Severity → numeric impact ────────────────────────────────────────────────

const SEVERITY_MAP: Record<string, number> = {
  Low: 1, Medium: 2, High: 3, Critical: 4,
};

const IMPACT_LABELS: Record<number, string> = {
  1: 'Low (低)',
  2: 'Medium (中)',
  3: 'High (高)',
  4: 'Critical (最高)',
};

// ─── Likelihood (発生可能性) from event count ──────────────────────────────────

function likelihoodFromCount(count: number): { value: number; label: string } {
  if (count <= 1) return { value: 1, label: 'Rare (稀少)' };
  if (count <= 3) return { value: 2, label: 'Unlikely (低)' };
  if (count <= 6) return { value: 3, label: 'Possible (中)' };
  return { value: 4, label: 'Likely (高)' };
}

// ─── Risk Level (リスクレベル) from score 1–16 ─────────────────────────────────

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
      classification: 'Bad', // Risk Matrix focuses on Bad (incident/problem) events
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
   * All events (Bad + Good) sorted by count desc with cumulative %.
   */
  async getPareto(params: {
    year: number;
    periodStart?: string;
    periodEnd?: string;
  }): Promise<ParetoResponse> {
    const { year } = params;
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

    // Period-filtered events for count/pareto
    const events = await prisma.event.findMany({
      where,
      select: { category: true, mainGroup: true, classification: true },
    });

    // Year-wide recurrence: count distinct weeks per category (closed events included)
    // This is a separate query with NO period filter so closed incidents still count.
    const yearEvents = await prisma.event.findMany({
      where: { year, deletedAt: null },
      select: { category: true, weekCode: true },
    });

    // Build recurrence map: category → Set<weekCode>
    const recurrenceMap = new Map<string, Set<string>>();
    const yearWeekSet = new Set<string>();
    for (const e of yearEvents) {
      if (!recurrenceMap.has(e.category)) recurrenceMap.set(e.category, new Set());
      recurrenceMap.get(e.category)!.add(e.weekCode);
      yearWeekSet.add(e.weekCode);
    }
    const totalWeeksInYear = yearWeekSet.size;

    type Group = { mainGroup: string; classification: 'Good' | 'Bad' | 'Neutral'; count: number };
    const groups = new Map<string, Group>();
    for (const event of events) {
      const existing = groups.get(event.category);
      if (existing) {
        existing.count += 1;
      } else {
        groups.set(event.category, {
          mainGroup: event.mainGroup,
          classification: event.classification as 'Good' | 'Bad' | 'Neutral',
          count: 1,
        });
      }
    }

    const total = events.length;
    const sorted = Array.from(groups.entries()).sort((a, b) => b[1].count - a[1].count);

    let cumCount = 0;
    const items: ParetoItem[] = sorted.map(([category, g]) => {
      cumCount += g.count;
      return {
        category,
        mainGroup: g.mainGroup,
        classification: g.classification,
        count: g.count,
        percentage: total > 0 ? Number(((g.count / total) * 100).toFixed(1)) : 0,
        cumulative: total > 0 ? Number(((cumCount / total) * 100).toFixed(1)) : 0,
        weeksAppeared: recurrenceMap.get(category)?.size ?? 0,
      };
    });

    return { period, total, totalWeeksInYear, items };
  },
};
