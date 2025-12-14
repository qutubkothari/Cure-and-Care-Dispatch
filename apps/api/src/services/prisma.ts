import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: ['warn', 'error']
});

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
