// AlertPanel.tsx — "Sự cố cần chú ý" — leadership-friendly alert summary
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AlertTriangle, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardSummaryData } from '@/types';

interface AlertPanelProps {
  distribution: DashboardSummaryData['statusDistribution'] | undefined;
  isLoading?: boolean;
}

export function AlertPanel({ distribution, isLoading = false }: AlertPanelProps) {
  const { t } = useTranslation();

  const criticalOpen = distribution?.critical.open ?? 0;
  const highOpen     = distribution?.high.open     ?? 0;
  const criticalTotal = distribution?.critical.count ?? 0;
  const highTotal     = distribution?.high.count     ?? 0;
  const allGood = criticalOpen === 0 && highOpen === 0;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{t('dashboard.alertPanel.title')}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">{t('dashboard.alertPanel.subtitle')}</p>
          </div>
          <Link
            to="/reports"
            className="flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
          >
            {t('dashboard.alertPanel.viewReport')}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {isLoading || !distribution ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : (
          <>
            {allGood ? (
              /* ── All good state ── */
              <div className="flex items-center gap-3 rounded-md bg-green-50 p-3 text-sm text-green-800">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                <span className="font-medium">{t('dashboard.alertPanel.allGood')}</span>
              </div>
            ) : (
              /* ── Alert rows ── */
              <div className="space-y-2">
                {criticalOpen > 0 && (
                  <div className="flex items-start gap-3 rounded-md border-l-4 bg-red-50 p-3"
                    style={{ borderLeftColor: '#C00000' }}
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: '#C00000' }} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold" style={{ color: '#C00000' }}>
                        {criticalOpen} {t('dashboard.alertPanel.criticalOpen')}
                      </div>
                      <div className="text-xs text-muted-foreground">{t('dashboard.alertPanel.actNow')}</div>
                    </div>
                  </div>
                )}
                {highOpen > 0 && (
                  <div className="flex items-start gap-3 rounded-md border-l-4 bg-orange-50 p-3"
                    style={{ borderLeftColor: '#FF6600' }}
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: '#FF6600' }} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold" style={{ color: '#FF6600' }}>
                        {highOpen} {t('dashboard.alertPanel.highOpen')}
                      </div>
                      <div className="text-xs text-muted-foreground">{t('dashboard.alertPanel.reviewSoon')}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Summary stats ── */}
            <div className="rounded-md border p-3 space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t('dashboard.alertPanel.periodSummary')}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md p-2 text-center" style={{ backgroundColor: '#C0000015' }}>
                  <div className="text-xl font-bold" style={{ color: '#C00000' }}>{criticalTotal}</div>
                  <div className="text-xs text-muted-foreground">{t('event.severity.Critical')}</div>
                </div>
                <div className="rounded-md p-2 text-center" style={{ backgroundColor: '#FF660015' }}>
                  <div className="text-xl font-bold" style={{ color: '#FF6600' }}>{highTotal}</div>
                  <div className="text-xs text-muted-foreground">{t('event.severity.High')}</div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('dashboard.alertPanel.closedLabel')}</span>
                <span className="font-medium">
                  {(distribution.critical.closed + distribution.high.closed)}/
                  {(criticalTotal + highTotal)}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
