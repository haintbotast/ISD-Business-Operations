import { useTranslation } from 'react-i18next';

// Admin panel will be expanded in Sprint 4
export default function AdminPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('admin.title')}</h1>
      <p className="text-muted-foreground">Admin — Sprint 4</p>
    </div>
  );
}
