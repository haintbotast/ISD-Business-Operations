// Express Request augmentation — adds req.user after authMiddleware
import { JwtPayload } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
