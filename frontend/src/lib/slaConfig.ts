// SLA configuration — v1.0 hardcoded; v1.1 will be admin-configurable.
export const SLA_CONFIG = {
  uptimePct: 99.5,        // target uptime % (= 50.4 min downtime/week max)
  closureRatePct: 80,     // target closure rate %
  severeIncidentTarget: 0,
} as const;

// Period total minutes for uptime % calculation
export const PERIOD_TOTAL_MINUTES: Record<string, number> = {
  week:    7 * 24 * 60,   // 10 080
  month:   30 * 24 * 60,  // 43 200
  quarter: 91 * 24 * 60,  // 130 560
  year:    365 * 24 * 60, // 525 600
};
