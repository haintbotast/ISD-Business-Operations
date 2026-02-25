import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { exportService } from '../services/export.service';

const router = Router();

const eventsExportSchema = z.object({
  format: z.enum(['xlsx']).default('xlsx'),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  weekCode: z.string().optional(),
  locationCode: z.string().optional(),
  mainGroup: z.string().optional(),
  category: z.string().optional(),
  classification: z.enum(['Good', 'Bad']).optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});

const matrixExportSchema = z.object({
  format: z.enum(['xlsx', 'pdf']).default('xlsx'),
  week: z.string().regex(/^W\d{2}$/, 'week must match W## format'),
  year: z.coerce.number().int().min(2020).max(2100),
});

// GET /api/v1/export/events?format=xlsx&year=2026&...
router.get(
  '/events',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const query = eventsExportSchema.parse(req.query);
    const buffer = await exportService.buildEventsXlsx(query);
    const filename = `events-${query.year ?? 'all'}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }),
);

// GET /api/v1/export/weekly-matrix?format=pdf|xlsx&week=W08&year=2026
router.get(
  '/weekly-matrix',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const query = matrixExportSchema.parse(req.query);

    if (query.format === 'pdf') {
      const buffer = await exportService.buildWeeklyMatrixPdf(query.week, query.year);
      const filename = `weekly-matrix-${query.week}-${query.year}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } else {
      const buffer = await exportService.buildWeeklyMatrixXlsx(query.week, query.year);
      const filename = `weekly-matrix-${query.week}-${query.year}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    }
  }),
);

export default router;
