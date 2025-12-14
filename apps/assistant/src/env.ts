import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  PORT: z.coerce.number().default(4100),
  WHATSAPP_PROVIDER: z.enum(['stub']).default('stub')
});

export const env = envSchema.parse(process.env);
