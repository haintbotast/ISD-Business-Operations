import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/v1/auth/login
 * Returns JWT in httpOnly cookie + user info in body.
 */
router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = loginSchema.parse(req.body);
    const result = await authService.login(username, password);

    // Set JWT as httpOnly cookie — not accessible by JavaScript
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8h in ms
    });

    res.json({ success: true, data: result.user });
  }),
);

/**
 * POST /api/v1/auth/logout
 * Clears the auth cookie.
 */
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * GET /api/v1/auth/me
 * Returns current user info from JWT.
 */
router.get(
  '/me',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getById(req.user!.id);
    res.json({ success: true, data: user });
  }),
);

export default router;
