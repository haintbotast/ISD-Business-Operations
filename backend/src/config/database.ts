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
  await prisma.$executeRawUnsafe('PRAGMA journal_mode=WAL;');
  // NORMAL: data flushed to WAL file per commit — safe + faster than FULL
  await prisma.$executeRawUnsafe('PRAGMA synchronous=NORMAL;');
  // Wait up to 5s when another connection holds a write lock
  await prisma.$executeRawUnsafe('PRAGMA busy_timeout=5000;');
  // Enforce foreign key constraints
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys=ON;');
  // 64MB page cache for performance
  await prisma.$executeRawUnsafe('PRAGMA cache_size=-64000;');
  // Store temp tables in memory
  await prisma.$executeRawUnsafe('PRAGMA temp_store=MEMORY;');

  // Periodic WAL checkpoint — merge WAL into main DB file
  // Set WAL_CHECKPOINT_INTERVAL_MS=0 to disable (SQLite auto-checkpoints at 1000 pages)
  const intervalMs = parseInt(process.env.WAL_CHECKPOINT_INTERVAL_MS ?? '30000', 10);
  if (intervalMs > 0) {
    setInterval(async () => {
      try {
        await prisma.$executeRawUnsafe('PRAGMA wal_checkpoint(PASSIVE);');
      } catch (error) {
        console.error('[DB] WAL checkpoint error:', error);
      }
    }, intervalMs);
  }

  console.log('[DB] SQLite initialized — WAL mode, foreign_keys=ON');
}

export default prisma;
