import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { eventService } from '../services/event.service';
import { draftService } from '../services/draft.service';
import { authMiddleware } from '../middleware/auth';
import { requireEditor } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';
import { sseManager } from '../utils/sseManager';

const router = Router();

// ─── Validation Schemas ───────────────────────────────────────────────────────

const createEventSchema = z.object({
  year: z.number().int().min(2020).max(2040),
  weekCode: z.string().regex(/^W\d{2}$/, 'weekCode must be format W01-W53'),
  date: z.string().datetime({ message: 'date must be ISO 8601 datetime' }),
  locationCode: z.string().min(1),
  mainGroup: z.string().min(1),
  category: z.string().min(1),
  systemComponent: z.string().optional(),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  impact: z.string().optional(),
  rootCause: z.string().optional(),
  resolution: z.string().optional(),
  downtimeMinutes: z.number().int().min(0).optional(),
  classification: z.enum(['Good', 'Bad']),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low']).optional(),
  status: z.enum(['Open', 'In Progress', 'Resolved', 'Closed']).optional(),
});

const updateEventSchema = createEventSchema.partial().extend({
  version: z.number().int().min(1, 'version is required for OCC'),
});

const draftSchema = z.object({
  event_id: z.string().optional().nullable(),
  form_data: z.record(z.unknown()),
});

// ─── Routes (order matters: specific before :id) ──────────────────────────────

/**
 * GET /api/v1/events/stream
 * SSE endpoint — long-lived connection, broadcasts event mutations to all clients.
 * Must be declared BEFORE GET /:id to avoid "stream" being treated as an ID.
 */
router.get('/stream', authMiddleware, (req: Request, res: Response) => {
  const clientId = `${req.user!.id}-${Date.now()}`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering for SSE
  res.flushHeaders();

  // Heartbeat every 30s — keeps connection alive through load balancers / proxies
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch { /* ignore */ }
  }, 30_000);

  sseManager.add(clientId, res);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseManager.remove(clientId);
  });
});

/**
 * POST /api/v1/events/draft — auto-save form state (FR-001)
 * GET  /api/v1/events/draft?event_id=xxx — restore draft on form open
 * Also declared BEFORE /:id.
 */
router.post(
  '/draft',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { event_id, form_data } = draftSchema.parse(req.body);
    const eventKey = event_id ?? 'new';
    await draftService.save(req.user!.id, eventKey, form_data);
    res.json({ success: true });
  }),
);

router.get(
  '/draft',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const eventKey = (req.query.event_id as string | undefined) ?? 'new';
    const draft = await draftService.get(req.user!.id, eventKey);
    res.json({ success: true, data: draft });
  }),
);

// ─── Standard CRUD ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/events
 * List events with filtering and pagination. Viewer+ can access.
 */
router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      year: req.query.year ? parseInt(req.query.year as string, 10) : undefined,
      weekCode: req.query.weekCode as string | undefined,
      locationCode: req.query.locationCode as string | undefined,
      mainGroup: req.query.mainGroup as string | undefined,
      category: req.query.category as string | undefined,
      status: req.query.status as string | undefined,
      classification: req.query.classification as string | undefined,
      search: req.query.search as string | undefined,
    };

    const result = await eventService.list(filters);
    res.json({ success: true, ...result });
  }),
);

/**
 * GET /api/v1/events/:id
 */
router.get(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const event = await eventService.getById(req.params.id);
    res.json({ success: true, data: event });
  }),
);

/**
 * POST /api/v1/events — Editor+ only
 */
router.post(
  '/',
  authMiddleware,
  requireEditor(),
  asyncHandler(async (req: Request, res: Response) => {
    const data = createEventSchema.parse(req.body);
    const event = await eventService.create(data, req.user!.id);

    // Clean up draft on successful create
    await draftService.delete(req.user!.id, 'new');

    res.status(201).json({ success: true, data: event });
  }),
);

/**
 * PUT /api/v1/events/:id — Editor+ only
 * Body MUST include version for OCC. Returns 409 on version conflict.
 */
router.put(
  '/:id',
  authMiddleware,
  requireEditor(),
  asyncHandler(async (req: Request, res: Response) => {
    const data = updateEventSchema.parse(req.body);
    const event = await eventService.update(req.params.id, data, req.user!.id);

    // Clean up draft on successful update
    await draftService.delete(req.user!.id, req.params.id);

    res.json({ success: true, data: event });
  }),
);

/**
 * DELETE /api/v1/events/:id — Editor+ only (soft delete)
 */
router.delete(
  '/:id',
  authMiddleware,
  requireEditor(),
  asyncHandler(async (req: Request, res: Response) => {
    await eventService.delete(req.params.id, req.user!.id);
    res.json({ success: true, message: 'Event deleted' });
  }),
);

export default router;
