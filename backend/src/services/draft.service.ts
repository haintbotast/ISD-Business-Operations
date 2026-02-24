import prisma from '../config/database';

const DRAFT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const draftService = {
  /**
   * Upsert a draft for the given user + event key.
   * eventKey = event UUID when editing, or literal "new" for create form.
   */
  async save(userId: string, eventKey: string, formData: unknown): Promise<void> {
    const expiresAt = new Date(Date.now() + DRAFT_TTL_MS);

    await prisma.eventDraft.upsert({
      where: { userId_eventKey: { userId, eventKey } },
      update: { formData: JSON.stringify(formData), expiresAt },
      create: { userId, eventKey, formData: JSON.stringify(formData), expiresAt },
    });
  },

  /**
   * Retrieve a draft for the given user + event key.
   * Returns null if no draft exists or if it has expired.
   */
  async get(userId: string, eventKey: string): Promise<unknown | null> {
    const draft = await prisma.eventDraft.findUnique({
      where: { userId_eventKey: { userId, eventKey } },
    });

    if (!draft) return null;
    if (draft.expiresAt < new Date()) {
      // Expired — clean up silently
      await prisma.eventDraft.delete({ where: { userId_eventKey: { userId, eventKey } } }).catch(() => null);
      return null;
    }

    return JSON.parse(draft.formData) as unknown;
  },

  /**
   * Delete draft after successful form submit.
   */
  async delete(userId: string, eventKey: string): Promise<void> {
    await prisma.eventDraft
      .delete({ where: { userId_eventKey: { userId, eventKey } } })
      .catch(() => null); // Ignore if not found
  },

  /**
   * Clean up all expired drafts across all users.
   * Called periodically from app startup.
   */
  async cleanupExpired(): Promise<number> {
    const result = await prisma.eventDraft.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  },
};
