import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';
import { importService } from '../services/import.service';

const router = Router();

const executeSchema = z.object({
  duplicateAction: z.enum(['skip', 'replace']).default('skip'),
});

// POST /api/v1/import/excel?preview=true
// POST /api/v1/import/excel?duplicateAction=skip|replace
//
// Body: raw binary xlsx file (express.raw() applied in app.ts for /api/v1/import routes)
router.post(
  '/excel',
  authMiddleware,
  requireRole('Admin', 'Editor'),
  asyncHandler(async (req: Request, res: Response) => {
    // express.raw() puts parsed buffer in req.body
    const body = req.body as Buffer;
    if (!Buffer.isBuffer(body) || body.length === 0) {
      return res.status(400).json({ success: false, code: 'NO_FILE', message: 'No file uploaded' });
    }

    const isPreview = req.query.preview === 'true';

    if (isPreview) {
      const data = await importService.preview(body);
      return res.json({ success: true, data });
    }

    const { duplicateAction } = executeSchema.parse(req.query);
    const importedBy = req.user!.username;
    const data = await importService.execute(body, duplicateAction, importedBy);
    return res.json({ success: true, data });
  }),
);

export default router;
