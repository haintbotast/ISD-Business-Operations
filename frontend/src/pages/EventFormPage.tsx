import { useParams } from 'react-router-dom';
import { EventForm } from '@/components/events/EventForm';

export default function EventFormPage() {
  const { id } = useParams<{ id?: string }>();
  return <EventForm eventId={id} />;
}
