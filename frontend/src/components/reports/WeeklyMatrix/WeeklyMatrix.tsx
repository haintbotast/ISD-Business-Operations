import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { WeeklyMatrixData, WeeklyMatrixCell } from '@/types';

interface WeeklyMatrixProps {
  data: WeeklyMatrixData | undefined;
  isLoading?: boolean;
}

function CellContent({ events }: { events: WeeklyMatrixCell[] }) {
  const MAX_VISIBLE = 5;
  const visible = events.slice(0, MAX_VISIBLE);
  const extra = events.length - MAX_VISIBLE;

  return (
    <ul className="space-y-1 text-xs">
      {visible.map((e) => (
        <li
          key={e.id}
          className={cn(
            'border-l-2 pl-1.5',
            e.classification === 'Good' ? 'border-green-400' : 'border-red-400',
          )}
        >
          <span className="font-medium">{e.description}</span>
          <br />
          <span className="text-muted-foreground">
            {e.severity} / {e.status}
            {e.downtimeMinutes ? ` · ${e.downtimeMinutes}'` : ''}
          </span>
        </li>
      ))}
      {extra > 0 && (
        <li className="text-xs text-muted-foreground italic">+{extra} khác</li>
      )}
    </ul>
  );
}

export function WeeklyMatrix({ data, isLoading }: WeeklyMatrixProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 w-full animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  if (!data || data.categories.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
        {t('reports.matrixNoData')}
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-md border">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="sticky left-0 z-10 min-w-[180px] border border-border bg-muted/50 px-3 py-2 text-left font-semibold">
              {t('event.fields.category')}
            </th>
            {data.locations.map((loc) => (
              <th
                key={loc}
                className="min-w-[160px] border border-border px-3 py-2 text-left font-semibold"
              >
                {loc}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.categories.map((cat, idx) => {
            return (
              <tr key={idx} className="hover:bg-muted/20">
                <td className="sticky left-0 z-10 border border-border bg-muted/30 px-3 py-2 font-medium">
                  <div className="text-xs text-muted-foreground">{cat.mainGroup}</div>
                  <div>{cat.category}</div>
                </td>
                {data.locations.map((loc) => {
                  const key = `${loc}|||${cat.category}`;
                  const events = data.cells[key] ?? [];
                  return (
                    <td key={loc} className="border border-border px-3 py-2 align-top">
                      {events.length > 0 ? (
                        <>
                          <CellContent events={events} />
                          <div className="mt-1 text-right text-xs text-muted-foreground">
                            ({events.length})
                          </div>
                        </>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
