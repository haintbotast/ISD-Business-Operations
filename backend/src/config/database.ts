import { PrismaClient } from '@prisma/client';
import { mkdirSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';

// Singleton Prisma client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

/**
 * Initialize SQLite with WAL mode and performance PRAGMAs.
 * Must be called once at app startup before handling requests.
 */
export async function initDatabase(): Promise<void> {
  // Ensure data directory exists (for local dev without Docker volume mount)
  const dbUrl = process.env.DATABASE_URL ?? '';
  if (dbUrl.startsWith('file:')) {
    const dbPath = resolve(dbUrl.replace('file:', ''));
    const dbDir = dirname(dbPath);
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }
  }

  // SQLite WAL mode — concurrent reads while writing, crash-safe
  // Use $queryRawUnsafe for all PRAGMAs — SQLite returns result rows even for setters
  await prisma.$queryRawUnsafe('PRAGMA journal_mode=WAL;');
  await prisma.$queryRawUnsafe('PRAGMA synchronous=NORMAL;');
  await prisma.$queryRawUnsafe('PRAGMA busy_timeout=5000;');
  await prisma.$queryRawUnsafe('PRAGMA foreign_keys=ON;');
  await prisma.$queryRawUnsafe('PRAGMA cache_size=-64000;');
  await prisma.$queryRawUnsafe('PRAGMA temp_store=MEMORY;');

  // Periodic WAL checkpoint — merge WAL into main DB file
  // Set WAL_CHECKPOINT_INTERVAL_MS=0 to disable (SQLite auto-checkpoints at 1000 pages)
  const intervalMs = parseInt(process.env.WAL_CHECKPOINT_INTERVAL_MS ?? '30000', 10);
  if (intervalMs > 0) {
    setInterval(async () => {
      try {
        await prisma.$queryRawUnsafe('PRAGMA wal_checkpoint(PASSIVE);');
      } catch (error) {
        console.error('[DB] WAL checkpoint error:', error);
      }
    }, intervalMs);
  }

  console.log('[DB] SQLite initialized — WAL mode, foreign_keys=ON');
}

export default prisma;
