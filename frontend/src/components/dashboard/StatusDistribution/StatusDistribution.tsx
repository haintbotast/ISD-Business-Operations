import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardSummaryData } from '@/types';

interface StatusDistributionProps {
  title: string;
  distribution: DashboardSummaryData['statusDistribution'] | undefined;
  isLoading?: boolean;
}

const rowConfig: Array<{ key: 'low' | 'medium' | 'high' | 'critical'; color: string }> = [
  { key: 'low', color: '#16a34a' },
  { key: 'medium', color: '#d97706' },
  { key: 'high', color: '#ea580c' },
  { key: 'critical', color: '#dc2626' },
];

export function StatusDistribution({ title, distribution, isLoading = false }: StatusDistributionProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading || !distribution ? (
          <div className="h-80 animate-pulse rounded-md bg-muted" />
        ) : (
          <>
            <div className="space-y-1 rounded-md border p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{t('common.all')}</span>
                <span>{distribution.all.count.toLocaleString('vi-VN')}</span>
              </div>
              <div className="h-2 rounded bg-muted">
                <div className="h-2 w-full rounded bg-primary" />
              </div>
              <div className="text-xs text-muted-foreground">{distribution.all.pct.toFixed(1)}%</div>
            </div>

            {rowConfig.map((row) => {
              const data = distribution[row.key];
              const label = t(`event.severity.${row.key === 'critical' ? 'Critical' : row.key === 'high' ? 'High' : row.key === 'medium' ? 'Medium' : 'Low'}`);
              return (
                <div key={row.key} className="space-y-1 rounded-md border p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{label}</span>
                    <span>{data.count.toLocaleString('vi-VN')}</span>
                  </div>

                  <div className="h-2 rounded bg-muted">
                    <div
                      className="h-2 rounded"
                      style={{
                        width: `${Math.min(100, Math.max(0, data.pct))}%`,
                        backgroundColor: row.color,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{data.pct.toFixed(1)}%</span>
                    <span>{t('dashboard.statusSplit', { open: data.open, closed: data.closed })}</span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </CardContent>
    </Card>
  );
}

