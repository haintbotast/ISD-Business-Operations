import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { dashboardService } from '../services/dashboard.service';

const router = Router();

const querySchema = z.object({
  granularity: z.enum(['week', 'month', 'quarter', 'year']).default('week'),
  year: z.coerce.number().int().min(2020).max(2100),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  locationCode: z.string().optional(),
  metricFilter: z.enum(['all', 'open', 'severe', 'downtime', 'closure']).optional().default('all'),
});

const weeklyMatrixSchema = z.object({
  week: z.string().regex(/^W\d{2}$/, 'week must match W## format'),
  year: z.coerce.number().int().min(2020).max(2100),
});

const kpiTrendSchema = z.object({
  granularity: z.enum(['week', 'month', 'quarter', 'year']).default('week'),
  year: z.coerce.number().int().min(2020).max(2100),
});

router.get(
  '/summary',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const query = querySchema.parse(req.query);
    const data = await dashboardService.getSummary({
      ...query,
      locationCode: query.locationCode?.trim() || undefined,
    });
    res.json({ success: true, data });
  }),
);

router.get(
  '/chart',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const query = querySchema.parse(req.query);
    const data = await dashboardService.getChart({
      ...query,
      locationCode: query.locationCode?.trim() || undefined,
    });
    res.json({ success: true, data });
  }),
);


router.get(
  '/weekly-matrix',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const query = weeklyMatrixSchema.parse(req.query);
    const data = await dashboardService.getWeeklyMatrix(query.week, query.year);
    res.json({ success: true, data });
  }),
);

router.get(
  '/kpi-trend',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const query = kpiTrendSchema.parse(req.query);
    const data = await dashboardService.getKpiTrend(query.granularity, query.year);
    res.json({ success: true, data });
  }),
);

export default router;

