import app from './app.js';
import { env } from './config/env.js';
import prisma from './config/database.js';

const PORT = parseInt(env.PORT, 10) || 5000;

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL Database successfully.');

    app.listen(PORT, () => {
      console.log(`Mini Operations ERP API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
