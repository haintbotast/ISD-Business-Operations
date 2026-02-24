import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler so that rejected Promises are forwarded
 * to Express's next(err) — required in Express 4.x which does not
 * automatically catch async errors.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
