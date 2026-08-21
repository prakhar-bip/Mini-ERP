import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';

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

// Mount modular API routes
app.use('/api', apiRoutes);

// Centralized error handling middleware
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  if (status >= 500) {
    console.error('Server Internal Error:', err);
  }

  res.status(status).json({
    success: false,
    message
  });
});

export default app;
