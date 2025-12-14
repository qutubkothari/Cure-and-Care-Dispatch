import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from './env.js';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { prisma } from './services/prisma.js';

export function buildServer() {
  const app = Fastify({
    logger: {
      level: 'info'
    }
  });

  app.decorate('prisma', prisma);

  app.register(helmet);
  app.register(rateLimit, { max: 300, timeWindow: '1 minute' });
  app.register(cors, {
    origin: [env.WEB_ORIGIN],
    credentials: true
  });

  app.register(swagger, {
    openapi: {
      info: {
        title: 'Dispatch API',
        version: '0.1.0'
      }
    }
  });
  app.register(swaggerUi, { routePrefix: '/docs' });

  app.register(healthRoutes);
  app.register(authRoutes, { prefix: '/api' });

  return app;
}
