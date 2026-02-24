import app from './app';
import { initDatabase } from './config/database';
import { draftService } from './services/draft.service';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

async function bootstrap() {
  try {
    // 1. Initialize SQLite with WAL mode and PRAGMAs
    await initDatabase();

    // 2. Clean up expired drafts on startup (then every hour)
    const cleanupDrafts = async () => {
      const count = await draftService.cleanupExpired();
      if (count > 0) console.log(`[DRAFT] Cleaned up ${count} expired drafts`);
    };
    await cleanupDrafts();
    setInterval(cleanupDrafts, 60 * 60 * 1000);

    // 3. Start Express server
    app.listen(PORT, () => {
      console.log(`[SERVER] ISD-OMS backend running on port ${PORT}`);
      console.log(`[SERVER] Environment: ${process.env.NODE_ENV ?? 'development'}`);
      console.log(`[SERVER] Health: http://localhost:${PORT}/api/v1/health`);
    });
  } catch (error) {
    console.error('[SERVER] Failed to start:', error);
    process.exit(1);
  }
}

bootstrap();
