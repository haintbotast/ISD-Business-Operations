import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Role-based access control middleware factory.
 * Must be used after authMiddleware (requires req.user to be set).
 *
 * @example
 * router.post('/categories', authMiddleware, requireRole('Admin'), handler);
 * router.delete('/users/:id', authMiddleware, requireRole('Admin'), handler);
 */
export function requireRole(...roles: string[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
      return;
    }
    next();
  };
}

/**
 * Convenience: Editor or Admin can write data; Viewer is read-only.
 */
export function requireEditor(): RequestHandler {
  return requireRole('Admin', 'Editor');
}
