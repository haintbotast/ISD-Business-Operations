import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface ClassificationBadgeProps {
  value: 'Good' | 'Bad';
  className?: string;
}

export function ClassificationBadge({ value, className }: ClassificationBadgeProps) {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        value === 'Good'
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-red-100 text-red-700',
        className,
      )}
    >
      {t(`event.classification.${value}`)}
    </span>
  );
}
