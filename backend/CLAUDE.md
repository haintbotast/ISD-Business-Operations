# ISD-OMS Backend — Claude Code Instructions

## Stack

Node.js 20 + TypeScript + Express + Prisma ORM + SQLite 3 (WAL mode) + `puppeteer-core` + JWT + Bcrypt + Zod

> See root `CLAUDE.md` for global rules and project context.

## Directory Structure

```
backend/
├── prisma/
│   ├── schema.prisma        # DB schema — source of truth for data model
│   ├── migrations/          # Prisma migration files
│   └── seed.ts              # Seed: users, locations, categories
├── src/
│   ├── index.ts             # App entry point
│   ├── app.ts               # Express app setup (middleware, routes)
│   ├── config/
│   │   └── database.ts      # Prisma client singleton + SQLite PRAGMA init
│   ├── middleware/
│   │   ├── auth.ts          # JWT auth middleware → req.user
│   │   ├── rbac.ts          # requireRole('Admin'|'Editor'|'Viewer')
│   │   └── errorHandler.ts  # Global error handler → standard error format
│   ├── routes/
│   │   ├── health.routes.ts
│   │   ├── auth.routes.ts
│   │   ├── event.routes.ts  # Includes /stream SSE endpoint
│   │   ├── dashboard.routes.ts
│   │   ├── master.routes.ts # Categories + Locations
│   │   ├── import.routes.ts
│   │   └── export.routes.ts
│   ├── controllers/         # Request parsing → call service → return response
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── event.service.ts   # OCC update logic HERE
│   │   ├── draft.service.ts   # Auto-save draft (upsert per user)
│   │   ├── audit.service.ts   # Write audit_log entries
│   │   ├── dashboard.service.ts
│   │   ├── import.service.ts  # Excel parse + duplicate detection
│   │   └── export.service.ts  # Excel export + Puppeteer PDF
│   ├── utils/
│   │   ├── sseManager.ts    # SSE client registry + broadcast function
│   │   ├── excelParser.ts   # xlsx read/write
│   │   └── pdfGenerator.ts  # Puppeteer PDF generation
│   └── types/
│       └── index.ts         # Shared TypeScript types + DTOs
```

## Commands

```bash
npm run dev              # ts-node-dev — hot reload on port 3001
npm run build            # tsc → ./dist
npm run start:prod       # node ./dist/index.js
npm test                 # Jest
npm run lint             # ESLint

# Prisma
npx prisma migrate dev --name <migration_name>
npx prisma generate                # Regenerate Prisma Client
npx prisma db seed                 # Seed initial data
npx prisma studio                  # GUI for DB inspection
```

## Always / Never

### ALWAYS
- Validate request body/params with **Zod** at controller layer before calling service
- Write **audit log** for every CREATE / UPDATE / DELETE on `events`
- Return errors in standard format: `{ success: false, code: "SCREAMING_SNAKE", message: "..." }`
- Use `prisma.event.updateMany({ where: { id, version: expectedVersion, deletedAt: null } })` for OCC
- Broadcast SSE after every successful event mutation
- Hash passwords with bcrypt (`saltRounds = 10`)
- Set SQLite PRAGMAs at app startup (see `database.ts` pattern below)
- Return paginated list responses as: `{ success: true, data: [...], pagination: { page, limit, total } }`

### NEVER
- NEVER hard-delete from `events` — use soft delete (`deletedAt = new Date()`)
- NEVER use `prisma.event.update()` for event updates — must use `updateMany` with OCC check
- NEVER skip OCC version check on PUT /events/:id
- NEVER hardcode location/category values — read from DB tables
- NEVER implement `field_definitions` API in v1.0 (deferred to v1.1)
- NEVER return raw Prisma errors — wrap in standardized `AppError`
- NEVER skip `authMiddleware` on any business data endpoint
- NEVER use `process.exit()` — let Express error handler catch and respond

## Code Patterns

### SQLite PRAGMA Init (config/database.ts)

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function initDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe('PRAGMA journal_mode=WAL;');
  await prisma.$executeRawUnsafe('PRAGMA synchronous=NORMAL;');
  await prisma.$executeRawUnsafe('PRAGMA busy_timeout=5000;');
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys=ON;');
  await prisma.$executeRawUnsafe('PRAGMA cache_size=-64000;');

  const intervalMs = parseInt(process.env.WAL_CHECKPOINT_INTERVAL_MS ?? '30000', 10);
  if (intervalMs > 0) {
    setInterval(async () => {
      await prisma.$executeRawUnsafe('PRAGMA wal_checkpoint(PASSIVE);');
    }, intervalMs);
  }
}

export default prisma;
```

### Standard Error Class (types/index.ts)

```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

### Global Error Handler (middleware/errorHandler.ts)

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';
import { ZodError } from 'zod';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: err.errors,
    });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
  });
}
```

### OCC Update Pattern (services/event.service.ts)

```typescript
async updateEvent(
  id: string,
  data: UpdateEventDto,
  expectedVersion: number,
  userId: string,
): Promise<Event> {
  const result = await prisma.event.updateMany({
    where: {
      id,
      version: expectedVersion,  // OCC check — CRITICAL, do not remove
      deletedAt: null,
    },
    data: {
      ...data,
      version: { increment: 1 },
      updatedAt: new Date(),
    },
  });

  if (result.count === 0) {
    const exists = await prisma.event.findFirst({ where: { id, deletedAt: null } });
    if (!exists) throw new AppError(404, 'EVENT_NOT_FOUND', 'Sự kiện không tồn tại.');
    throw new AppError(409, 'EVENT_CONFLICT', 'Sự kiện đã bị thay đổi bởi người dùng khác. Vui lòng tải lại.');
  }

  const updated = await prisma.event.findFirst({ where: { id } });
  await auditService.log({ entityId: id, action: 'update', userId, newValues: data });
  sseManager.broadcast('updated', id, userId);

  return updated!;
}
```

### Soft Delete Pattern

```typescript
async deleteEvent(id: string, userId: string): Promise<void> {
  const event = await prisma.event.findFirst({ where: { id, deletedAt: null } });
  if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Sự kiện không tồn tại.');

  await prisma.event.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await auditService.log({ entityId: id, action: 'delete', userId, oldValues: event });
  sseManager.broadcast('deleted', id, userId);
}
```

### SSE Manager (utils/sseManager.ts)

```typescript
import { Response } from 'express';

const clients = new Map<string, Response>();

export const sseManager = {
  add(clientId: string, res: Response): void {
    clients.set(clientId, res);
  },

  remove(clientId: string): void {
    clients.delete(clientId);
  },

  broadcast(action: 'created' | 'updated' | 'deleted', eventId: string, userId: string): void {
    const payload = JSON.stringify({ action, eventId, userId, timestamp: new Date().toISOString() });
    clients.forEach((res) => {
      try {
        res.write(`data: ${payload}\n\n`);
      } catch {
        // Client disconnected — will be cleaned up via req.on('close')
      }
    });
  },
};
```

### SSE Endpoint (routes/event.routes.ts)

```typescript
router.get('/stream', authMiddleware, (req: Request, res: Response) => {
  const clientId = `${(req as any).user.id}-${Date.now()}`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');  // Disable Nginx buffering
  res.flushHeaders();

  // Heartbeat every 30s to keep connection alive through load balancers
  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 30_000);

  sseManager.add(clientId, res);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseManager.remove(clientId);
  });
});
```

### Audit Log (services/audit.service.ts)

```typescript
interface AuditLogParams {
  userId: string;
  action: 'create' | 'update' | 'delete';
  entityId: string;
  oldValues?: unknown;
  newValues?: unknown;
}

async function log({ userId, action, entityId, oldValues, newValues }: AuditLogParams) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType: 'event',
      entityId,
      oldValues: oldValues ? JSON.stringify(oldValues) : null,
      newValues: newValues ? JSON.stringify(newValues) : null,
    },
  });
}
```

### Draft API (services/draft.service.ts)

```typescript
// Upsert per user (user_id + event_id OR user_id + 'new')
// TTL: 24 hours — clean up expired drafts periodically

async saveDraft(userId: string, eventId: string | null, formData: object): Promise<void> {
  const key = eventId ?? 'new';
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.eventDraft.upsert({
    where: { userId_eventKey: { userId, eventKey: key } },
    update: { formData: JSON.stringify(formData), expiresAt },
    create: { userId, eventKey: key, formData: JSON.stringify(formData), expiresAt },
  });
}

async getDraft(userId: string, eventId: string | null): Promise<object | null> {
  const key = eventId ?? 'new';
  const draft = await prisma.eventDraft.findUnique({
    where: { userId_eventKey: { userId, eventKey: key } },
  });

  if (!draft || draft.expiresAt < new Date()) return null;
  return JSON.parse(draft.formData);
}
```

### Auth Middleware (middleware/auth.ts)

```typescript
import jwt from 'jsonwebtoken';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token ?? req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ success: false, code: 'TOKEN_EXPIRED', message: 'Token expired or invalid' });
  }
}
```

### RBAC Middleware (middleware/rbac.ts)

```typescript
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!roles.includes(user?.role)) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Insufficient permissions' });
    }
    next();
  };
}

// Usage:
router.get('/categories', authMiddleware, categoryController.list);
router.post('/categories', authMiddleware, requireRole('Admin'), categoryController.create);
router.delete('/users/:id', authMiddleware, requireRole('Admin'), userController.delete);
```

### Zod Validation in Controller

```typescript
const createEventSchema = z.object({
  weekCode: z.string().regex(/^W\d{2}$/),
  year: z.number().int().min(2024).max(2030),
  date: z.string().datetime(),
  locationCode: z.string().min(1),
  mainGroup: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(5),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
  status: z.enum(['Open', 'In Progress', 'Resolved', 'Closed']).default('Open'),
});

// In controller:
const body = createEventSchema.parse(req.body);  // Throws ZodError → caught by errorHandler
```

### Puppeteer PDF (utils/pdfGenerator.ts)

```typescript
import puppeteer from 'puppeteer-core';

let browser: puppeteer.Browser | null = null;

async function getBrowser(): Promise<puppeteer.Browser> {
  if (!browser) {
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH ?? '/usr/bin/chromium-browser',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: true,
    });
  }
  return browser;
}

export async function generatePdf(htmlContent: string): Promise<Buffer> {
  const b = await getBrowser();
  const page = await b.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({
    format: 'A3',
    landscape: true,
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
  });
  await page.close();
  return Buffer.from(pdf);
}
```

### Health Check Route

```typescript
// routes/health.routes.ts — NO authMiddleware
router.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'ok', version: '1.0.0' });
  } catch {
    res.status(503).json({ status: 'error', db: 'error', version: '1.0.0' });
  }
});
```

## Prisma Schema (Key Models)

```prisma
// backend/prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")  // file:./../../data/isd_oms.db
}

generator client {
  provider = "prisma-client-js"
}

model Event {
  id            String    @id @default(cuid())
  year          Int
  weekCode      String    @map("week_code")
  date          DateTime
  locationCode  String    @map("location_code")
  mainGroup     String    @map("main_group")
  category      String
  systemComponent String? @map("system_component")
  description   String
  impact        String?
  rootCause     String?   @map("root_cause")
  resolution    String?
  downtimeMinutes Int?    @map("downtime_minutes")
  classification String
  severity      String    @default("Medium")
  status        String    @default("Open")
  version       Int       @default(1)  // OCC — NEVER remove this field
  deletedAt     DateTime? @map("deleted_at")  // Soft delete
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  createdBy     String?   @map("created_by")

  weekRef   WeekReference  @relation(fields: [year, weekCode], references: [year, weekCode])
  location  LocationMaster @relation(fields: [locationCode], references: [code])

  @@map("events")
}

model WeekReference {
  year      Int
  weekCode  String   @map("week_code")
  startDate DateTime @map("start_date")
  endDate   DateTime @map("end_date")
  events    Event[]

  @@id([year, weekCode])  // Composite PK — prevents W01/2025 vs W01/2026 collision
  @@map("week_references")
}

model LocationMaster {
  id        String   @id @default(cuid())
  code      String   @unique
  fullName  String   @map("full_name")
  isActive  Boolean  @default(true) @map("is_active")
  sortOrder Int      @default(0) @map("sort_order")
  createdAt DateTime @default(now()) @map("created_at")
  events    Event[]

  @@map("location_master")
}

model User {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String   @map("password_hash")
  displayName  String   @map("display_name")
  role         String   @default("Viewer")  // Admin | Editor | Viewer
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")

  @@map("users")
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String   @map("user_id")
  action     String   // create | update | delete
  entityType String   @map("entity_type")
  entityId   String   @map("entity_id")
  oldValues  String?  @map("old_values")  // JSON string
  newValues  String?  @map("new_values")  // JSON string
  timestamp  DateTime @default(now())

  @@map("audit_log")
}

model EventDraft {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  eventKey  String   @map("event_key")  // event UUID or 'new'
  formData  String   @map("form_data")  // JSON string
  expiresAt DateTime @map("expires_at") // TTL: 24h
  updatedAt DateTime @updatedAt @map("updated_at")

  @@unique([userId, eventKey], name: "userId_eventKey")
  @@map("event_drafts")
}

// CategoryMaster — see schema for full definition
// AuditLog — see schema for full definition
```

## API Response Format

```typescript
// Success — single item
res.json({ success: true, data: event });

// Success — list with pagination
res.json({
  success: true,
  data: events,
  pagination: { page: 1, limit: 20, total: 150 },
});

// Error
res.status(409).json({ success: false, code: 'EVENT_CONFLICT', message: '...' });
res.status(404).json({ success: false, code: 'EVENT_NOT_FOUND', message: '...' });
res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: '...', details: [...] });
res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: '...' });
res.status(403).json({ success: false, code: 'FORBIDDEN', message: '...' });
```

## Environment Variables (.env)

```env
DATABASE_URL="file:./../../data/isd_oms.db"
JWT_SECRET="<strong-random-secret>"
JWT_EXPIRES_IN="8h"
PORT=3001
NODE_ENV=development
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
WAL_CHECKPOINT_INTERVAL_MS=30000
```

## Error Codes Reference

| Code | HTTP | When |
|------|------|------|
| `UNAUTHORIZED` | 401 | No/invalid token |
| `TOKEN_EXPIRED` | 401 | JWT expired |
| `FORBIDDEN` | 403 | Insufficient role |
| `EVENT_NOT_FOUND` | 404 | Event deleted or never existed |
| `VALIDATION_ERROR` | 400 | Zod schema failed |
| `EVENT_CONFLICT` | 409 | OCC version mismatch |
| `DUPLICATE_IMPORT` | 422 | Duplicate detected during import |
| `INTERNAL_ERROR` | 500 | Unhandled exception |
