import { Hono } from 'hono';
import { equalSecret, limitedJson } from '../adapters/security';
import { updateSchema } from '../adapters/telegram';
import { accept, ownerFor } from '../modules/execution/store';

const app = new Hono<{ Bindings: CloudflareBindings }>();
app.get('/health', c => c.json({status:'ok',service:'telegram-ingress'}));
app.post('/webhooks/telegram', async c => {
  if (!c.env.TELEGRAM_WEBHOOK_SECRET) return c.json({error:'not_configured'},503);
  if (!await equalSecret(c.req.header('X-Telegram-Bot-Api-Secret-Token') ?? '', c.env.TELEGRAM_WEBHOOK_SECRET)) return c.json({error:'unauthorized'},401);
  let raw: unknown;
  try { raw = await limitedJson(c.req.raw); } catch { return c.json({error:'invalid_body'},400); }
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return c.json({error:'invalid_update'},400);
  const update = parsed.data, message = update.message;
  if (!message || message.chat.type !== 'private' || message.from.is_bot || !message.text) return c.json({ok:true});
  try {
    const owner = await ownerFor(c.env.DB);
    let bootstrap = false;
    if (!owner) {
      const code = message.text.match(/^\/start\s+([a-f0-9]{64})$/)?.[1];
      if (!code || Number(c.env.BOOTSTRAP_EXPIRES_AT) <= Date.now() || !Number.isFinite(Number(c.env.BOOTSTRAP_EXPIRES_AT))) return c.json({ok:true});
      bootstrap = await equalSecret(code,c.env.BOOTSTRAP_CODE);
      if (!bootstrap) return c.json({ok:true});
    } else if (owner.user_id !== String(message.from.id) || owner.chat_id !== String(message.chat.id)) return c.json({ok:true});
    const accepted = await accept(c.env.DB,update,bootstrap);
    if (accepted) {
      // A failed publication is recovered from durable jobs by cron.
      c.executionCtx.waitUntil(c.env.JOBS_QUEUE.send({wake:true}).catch(() => { console.error(JSON.stringify({event:'dispatch_failed'})); }));
    }
    return c.json({ok:true});
  } catch { return c.json({error:'storage_unavailable'},503); }
});
app.notFound(c => c.json({error:'not_found'},404));
export default app;
