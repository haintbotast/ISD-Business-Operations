import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

/**
 * Verifies JWT from httpOnly cookie or Authorization header.
 * Attaches decoded payload to req.user on success.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Prefer cookie (httpOnly, not accessible by JS); fall back to Bearer token
  const token =
    (req.cookies as Record<string, string> | undefined)?.token ??
    req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[AUTH] JWT_SECRET is not set');
    res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'Server misconfiguration' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({
      success: false,
      code: 'TOKEN_EXPIRED',
      message: 'Token expired or invalid. Please log in again.',
    });
  }
}
