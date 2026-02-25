import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';
import { userService } from '../services/user.service';

const router = Router();

const createUserSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-z0-9_]+$/, 'Username must be lowercase alphanumeric or underscore'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1).max(100),
  role: z.enum(['Admin', 'Editor', 'Viewer']),
});

const updateUserSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  role: z.enum(['Admin', 'Editor', 'Viewer']).optional(),
  isActive: z.boolean().optional(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// GET /api/v1/users
router.get(
  '/',
  authMiddleware,
  requireRole('Admin'),
  asyncHandler(async (_req: Request, res: Response) => {
    const users = await userService.list();
    res.json({ success: true, data: users });
  }),
);

// POST /api/v1/users
router.post(
  '/',
  authMiddleware,
  requireRole('Admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const data = createUserSchema.parse(req.body);
    const user = await userService.create(data);
    res.status(201).json({ success: true, data: user });
  }),
);

// PUT /api/v1/users/:id
router.put(
  '/:id',
  authMiddleware,
  requireRole('Admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const data = updateUserSchema.parse(req.body);
    const user = await userService.update(req.params.id, data);
    res.json({ success: true, data: user });
  }),
);

// PUT /api/v1/users/:id/password
router.put(
  '/:id/password',
  authMiddleware,
  requireRole('Admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const { newPassword } = resetPasswordSchema.parse(req.body);
    await userService.resetPassword(req.params.id, newPassword);
    res.json({ success: true, data: null });
  }),
);

export default router;
