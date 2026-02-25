import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { errorHandler } from './middleware/errorHandler';
import healthRouter from './routes/health.routes';
import authRouter from './routes/auth.routes';
import eventRouter from './routes/event.routes';
import masterRouter from './routes/master.routes';
import dashboardRouter from './routes/dashboard.routes';
import exportRouter from './routes/export.routes';
import importRouter from './routes/import.routes';
import userRouter from './routes/user.routes';
import reportsRouter from './routes/reports.routes';

const app = express();

// ─── Security & Logging Middleware ────────────────────────────────────────────

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true, // Required for httpOnly cookie
  }),
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Body Parsing ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Raw binary for file uploads (import route reads req.rawBody internally)
app.use('/api/v1/import', express.raw({ type: '*/*', limit: '50mb' }));
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/events', eventRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/export', exportRouter);
app.use('/api/v1/import', importRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1', masterRouter); // /categories, /locations

// 404 handler for unknown routes
app.use((_req, res) => {
  res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Route not found' });
});

// Global error handler — must be last
app.use(errorHandler);

export default app;
