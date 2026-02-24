import { useTranslation } from 'react-i18next';

// Dashboard panels will be implemented in Sprint 2
// Placeholder to keep routing functional
export default function DashboardPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
      <p className="text-muted-foreground">Dashboard — Sprint 2</p>
    </div>
  );
}
