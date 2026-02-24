import { useTranslation } from 'react-i18next';
import { EventFilters } from '@/components/events/EventFilters';
import { EventList } from '@/components/events/EventList';

export default function EventsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('event.title')}</h1>
      <EventFilters />
      <EventList />
    </div>
  );
}
