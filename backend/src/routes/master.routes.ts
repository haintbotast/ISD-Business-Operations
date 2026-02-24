import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { masterService } from '../services/master.service';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

const createCategorySchema = z.object({
  mainGroup: z.string().min(1),
  category: z.string().min(1),
  classification: z.enum(['Good', 'Bad']).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const updateCategorySchema = z.object({
  classification: z.enum(['Good', 'Bad']).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const createLocationSchema = z.object({
  code: z.string().min(1).max(20).toUpperCase(),
  fullName: z.string().min(1),
  sortOrder: z.number().int().min(0).optional(),
});

const updateLocationSchema = z.object({
  fullName: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

// ─── Category Routes ──────────────────────────────────────────────────────────

router.get(
  '/categories',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const includeInactive = req.query.all === 'true' && req.user!.role === 'Admin';
    const categories = await masterService.listCategories(includeInactive);
    res.json({ success: true, data: categories });
  }),
);

router.post(
  '/categories',
  authMiddleware,
  requireRole('Admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const data = createCategorySchema.parse(req.body);
    const category = await masterService.createCategory(data);
    res.status(201).json({ success: true, data: category });
  }),
);

router.put(
  '/categories/:id',
  authMiddleware,
  requireRole('Admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const data = updateCategorySchema.parse(req.body);
    const category = await masterService.updateCategory(req.params.id, data);
    res.json({ success: true, data: category });
  }),
);

// ─── Location Routes ──────────────────────────────────────────────────────────

router.get(
  '/locations',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const includeInactive = req.query.all === 'true' && req.user!.role === 'Admin';
    const locations = await masterService.listLocations(includeInactive);
    res.json({ success: true, data: locations });
  }),
);

router.post(
  '/locations',
  authMiddleware,
  requireRole('Admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const data = createLocationSchema.parse(req.body);
    const location = await masterService.createLocation(data);
    res.status(201).json({ success: true, data: location });
  }),
);

router.put(
  '/locations/:id',
  authMiddleware,
  requireRole('Admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const data = updateLocationSchema.parse(req.body);
    const location = await masterService.updateLocation(req.params.id, data);
    res.json({ success: true, data: location });
  }),
);

export default router;
