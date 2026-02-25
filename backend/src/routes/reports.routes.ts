import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { reportsService } from '../services/reports.service';

const router = Router();

const weekCodePattern = /^W\d{1,2}$/i;

const riskMatrixSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  weekCode: z.string().regex(weekCodePattern).optional(),
  periodStart: z.string().regex(weekCodePattern).optional(),
  periodEnd: z.string().regex(weekCodePattern).optional(),
});

const paretoSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  periodStart: z.string().regex(weekCodePattern).optional(),
  periodEnd: z.string().regex(weekCodePattern).optional(),
});

/**
 * GET /api/v1/reports/risk-matrix
 * FR-012: JIS Q 31000:2019 Risk Matrix
 * Query: ?year=2026&weekCode=W08  OR  ?year=2026&periodStart=W01&periodEnd=W08
 */
router.get(
  '/risk-matrix',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const query = riskMatrixSchema.parse(req.query);
    const data = await reportsService.getRiskMatrix(query);
    res.json({ success: true, data });
  }),
);

/**
 * GET /api/v1/reports/pareto
 * FR-013: JIS Z 8115 Pareto Analysis
 * Query: ?year=2026&periodStart=W01&periodEnd=W08
 */
router.get(
  '/pareto',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const query = paretoSchema.parse(req.query);
    const data = await reportsService.getPareto(query);
    res.json({ success: true, data });
  }),
);

export default router;
