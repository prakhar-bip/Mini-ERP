import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);

app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'mini-operations-erp-backend',
    timestamp: new Date().toISOString()
  });
});

// Centralized error handling middleware
app.use((err, _req, res, _next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

export default app;
