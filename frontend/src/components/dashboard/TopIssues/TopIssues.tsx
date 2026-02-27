// TopIssues.tsx — "Vấn đề nổi bật" panel (plain-language Pareto summary for leadership)
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePareto } from '@/hooks/useReports';
import { cn } from '@/lib/utils';

// Recurrence badge color thresholds (weeks appeared / total weeks in year)
function recurrenceColor(weeksAppeared: number, totalWeeks: number): string {
  if (totalWeeks === 0) return 'text-muted-foreground';
  const ratio = weeksAppeared / totalWeeks;
  if (ratio >= 0.75) return 'text-red-600';
  if (ratio >= 0.5)  return 'text-orange-500';
  return 'text-muted-foreground';
}

interface TopIssuesProps {
  year: number;
  periodStart: string;
  periodEnd: string;
  enabled?: boolean;
}

const BAD_COLOR  = '#C00000';
const GOOD_COLOR = '#70AD47';

export function TopIssues({ year, periodStart, periodEnd, enabled = true }: TopIssuesProps) {
  const { t } = useTranslation();
  const { data, isLoading } = usePareto({ year, periodStart, periodEnd, classificationFilter: 'Bad' }, enabled);

  const items = (data?.items ?? []).slice(0, 5);
  const maxCount = items[0]?.count ?? 1;
  const totalWeeks = data?.totalWeeksInYear ?? 0;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{t('dashboard.topIssues.title')}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">{t('dashboard.topIssues.subtitle')}</p>
          </div>
          <Link
            to="/reports"
            className="flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
          >
            {t('dashboard.topIssues.viewAll')}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-1.5 animate-pulse rounded-full bg-muted" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            {t('dashboard.topIssues.noData')}
          </div>
        ) : (
          <>
            <div className="space-y-2.5">
              {items.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="w-4 shrink-0 text-right text-xs font-semibold text-muted-foreground">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="block truncate font-medium leading-tight">{item.category}</span>
                        {item.systemComponent && (
                          <span className="block truncate text-xs text-foreground/70">{item.systemComponent}</span>
                        )}
                        <span className="block truncate text-xs text-muted-foreground">{item.mainGroup}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {/* Recurrence indicator: X/Y weeks in year (closed included) */}
                      {totalWeeks > 0 && item.weeksAppeared > 0 && (
                        <span
                          className={cn(
                            'flex items-center gap-0.5 text-xs font-medium',
                            recurrenceColor(item.weeksAppeared, totalWeeks),
                          )}
                          title={t('dashboard.topIssues.recurrenceTooltip', {
                            weeks: item.weeksAppeared,
                            total: totalWeeks,
                          })}
                        >
                          <RefreshCw className="h-2.5 w-2.5" />
                          {item.weeksAppeared}/{totalWeeks}T
                        </span>
                      )}
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.5 text-xs font-medium',
                          item.classification === 'Bad'
                            ? 'bg-red-50 text-red-700'
                            : item.classification === 'Neutral'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-green-50 text-green-700',
                        )}
                      >
                        {item.count}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${(item.count / maxCount) * 100}%`,
                        backgroundColor: item.classification === 'Bad' ? BAD_COLOR : GOOD_COLOR,
                        opacity: 0.85,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Plain-language 80/20 hint — no jargon */}
            <p className="border-t pt-2 text-xs italic text-muted-foreground">
              {t('dashboard.topIssues.hint')}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
