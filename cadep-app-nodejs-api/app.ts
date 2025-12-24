// app.ts
import express from 'express';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { securityMiddlewares } from './middlewares/security.js';
import { globalLimiter } from './middlewares/rateLimiter.js';
import { sanitize } from './middlewares/sanitize.js';

const app = express();

// Sécurité
app.use(securityMiddlewares);
app.use(globalLimiter);

// Parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Sanitization
app.use(sanitize);

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use(errorHandler);

export default app;