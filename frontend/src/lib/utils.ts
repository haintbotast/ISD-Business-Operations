import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: vi });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy HH:mm', { locale: vi });
  } catch {
    return dateStr;
  }
}

// ─── Week Helpers ─────────────────────────────────────────────────────────────

/** Returns the ISO week number for a given date. */
export function getIsoWeekCode(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `W${String(weekNo).padStart(2, '0')}`;
}

/** Returns the year for a given ISO date, accounting for week boundary crossing. */
export function getIsoYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

/** Returns today's ISO week code. */
export function currentWeekCode(): string {
  return getIsoWeekCode(new Date());
}

/** Returns today's ISO year. */
export function currentIsoYear(): number {
  return getIsoYear(new Date());
}

// ─── Severity color helper ────────────────────────────────────────────────────

export function severityColor(severity: string): string {
  switch (severity) {
    case 'Critical': return 'text-red-600 bg-red-50';
    case 'High':     return 'text-orange-600 bg-orange-50';
    case 'Medium':   return 'text-yellow-600 bg-yellow-50';
    case 'Low':      return 'text-green-600 bg-green-50';
    default:         return 'text-gray-600 bg-gray-50';
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case 'Open':        return 'text-blue-600 bg-blue-50';
    case 'In Progress': return 'text-purple-600 bg-purple-50';
    case 'Resolved':    return 'text-green-600 bg-green-50';
    case 'Closed':      return 'text-gray-600 bg-gray-50';
    default:            return 'text-gray-600 bg-gray-50';
  }
}
