import { useTranslation } from 'react-i18next';

// Reports will be implemented in Sprint 3
export default function ReportsPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('nav.reports')}</h1>
      <p className="text-muted-foreground">Reports — Sprint 3</p>
    </div>
  );
}
