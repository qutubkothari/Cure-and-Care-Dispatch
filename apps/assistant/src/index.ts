import Fastify from 'fastify';
import { z } from 'zod';
import { env } from './env.js';
import { createStubWhatsAppProvider } from './providers/whatsappProvider.js';
import { generateReply } from './assistantBrain.js';

const app = Fastify({ logger: { level: 'info' } });
const provider = createStubWhatsAppProvider();

app.get('/health', async () => ({ ok: true }));

// Generic webhook shape (we will map to your provider later)
app.post('/webhooks/whatsapp', async (req) => {
  const body = z
    .object({
      from: z.string().min(1),
      text: z.string().default('')
    })
    .passthrough()
    .parse(req.body);

  const reply = await generateReply({ from: body.from, text: body.text });
  const sendRes = await provider.sendMessage({ to: body.from, text: reply });

  return { ok: true, reply, providerMessageId: sendRes.providerMessageId };
});

app.post('/send', async (req) => {
  const body = z
    .object({ to: z.string().min(1), text: z.string().min(1) })
    .parse(req.body);
  const res = await provider.sendMessage(body);
  return { ok: true, providerMessageId: res.providerMessageId };
});

await app.listen({ port: env.PORT, host: '0.0.0.0' });
app.log.info({ port: env.PORT }, 'Assistant listening');
