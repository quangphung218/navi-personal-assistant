import { Hono } from 'hono';

// Development readiness probe. No Telegram or OpenRouter calls are made here.
const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get('/', (c) => c.text('Personal Assistant: môi trường local. Xem /health để kiểm tra runtime và D1.'));
app.get('/health', async (c) => {
  try {
    await c.env.DB.prepare('SELECT 1').first();
    return c.json({ status: 'ok', stage: c.env.APP_STAGE, database: 'reachable', externalCalls: false });
  } catch {
    return c.json({ status: 'unavailable', database: 'unreachable', externalCalls: false }, 503);
  }
});

// Do not acknowledge real Telegram updates before durable ingestion exists.
app.post('/webhooks/telegram', (c) => c.json({ error: 'telegram_ingestion_not_ready' }, 503));
app.notFound((c) => c.json({ error: 'not_found' }, 404));
export default app;
