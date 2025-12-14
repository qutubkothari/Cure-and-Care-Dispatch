import { env } from './env.js';
import { buildServer } from './server.js';

const app = buildServer();

await app.listen({
  port: env.PORT,
  host: '0.0.0.0'
});

app.log.info({ port: env.PORT }, 'API listening');
