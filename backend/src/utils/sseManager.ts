import { Response } from 'express';

type SseAction = 'created' | 'updated' | 'deleted';

interface SsePayload {
  action: SseAction;
  eventId: string;
  userId: string;
  timestamp: string;
}

// In-memory registry of active SSE connections
const clients = new Map<string, Response>();

export const sseManager = {
  /**
   * Register a new SSE client connection.
   */
  add(clientId: string, res: Response): void {
    clients.set(clientId, res);
  },

  /**
   * Remove an SSE client (called on connection close).
   */
  remove(clientId: string): void {
    clients.delete(clientId);
  },

  /**
   * Broadcast an event mutation to all connected SSE clients.
   * Clients use this to invalidate TanStack Query cache.
   */
  broadcast(action: SseAction, eventId: string, userId: string): void {
    const payload: SsePayload = {
      action,
      eventId,
      userId,
      timestamp: new Date().toISOString(),
    };
    const data = `data: ${JSON.stringify(payload)}\n\n`;

    clients.forEach((res, clientId) => {
      try {
        res.write(data);
      } catch {
        // Client disconnected — clean up silently
        clients.delete(clientId);
      }
    });
  },

  /**
   * Returns the number of active SSE connections (for health check / monitoring).
   */
  count(): number {
    return clients.size;
  },
};
