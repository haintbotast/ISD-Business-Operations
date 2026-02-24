import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

/**
 * Opens an SSE connection to /api/v1/events/stream and invalidates
 * TanStack Query caches on every event mutation broadcast.
 *
 * Call once in the main Layout component.
 */
export function useEventStream() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const es = new EventSource('/api/v1/events/stream', { withCredentials: true });

    es.onmessage = (e) => {
      try {
        const { action, eventId } = JSON.parse(e.data) as {
          action: 'created' | 'updated' | 'deleted';
          eventId: string;
        };

        // Invalidate list + dashboard queries
        queryClient.invalidateQueries({ queryKey: ['events'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });

        // Flag for EventForm to show warning if same event is open
        if (action === 'updated') {
          queryClient.setQueryData(['event-modified', eventId], true);
        }
      } catch {
        // Ignore parse errors (e.g. heartbeat comments)
      }
    };

    es.onerror = () => {
      // Browser automatically reconnects on error — no manual retry needed
    };

    return () => es.close();
  }, [user, queryClient]);
}
