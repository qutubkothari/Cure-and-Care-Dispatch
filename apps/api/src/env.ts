import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgresql://dispatch:dispatch@localhost:5432/dispatch'),
  JWT_SECRET: z.string().min(16).default('change_me_change_me'),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000')
});

export const env = envSchema.parse(process.env);
