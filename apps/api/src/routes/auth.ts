import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    '/auth/login',
    {
      schema: {
        summary: 'Login (stub)',
        body: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            password: { type: 'string' }
          },
          required: ['email', 'password']
        }
      }
    },
    async (req) => {
      const body = z
        .object({
          email: z.string().email(),
          password: z.string().min(1)
        })
        .parse(req.body);

      // TODO: replace with real auth (hashed passwords + refresh tokens)
      return {
        token: `stub.${Buffer.from(body.email).toString('base64url')}.token`,
        user: {
          email: body.email,
          role: 'ADMIN'
        }
      };
    }
  );
};
