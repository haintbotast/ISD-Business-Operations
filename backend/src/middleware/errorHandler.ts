import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../types';

/**
 * Global Express error handler.
 * Must be registered last (after all routes) in app.ts.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: err.errors,
    });
    return;
  }

  // Log unexpected errors but don't leak internals to client
  console.error('[ERROR]', err);
  res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
  });
}
