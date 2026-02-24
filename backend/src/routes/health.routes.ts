import { Router } from 'express';
import prisma from '../config/database';

const router = Router();

/**
 * GET /api/v1/health
 * No auth required. Used by Docker health check and monitoring.
 */
router.get('/', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'ok', version: '1.0.0' });
  } catch {
    res.status(503).json({ status: 'error', db: 'error', version: '1.0.0' });
  }
});

export default router;
