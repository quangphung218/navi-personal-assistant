import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

const localSecrets = parseEnv(readFileSync('.dev.vars', 'utf8'));
const token = localSecrets.TELEGRAM_BOT_TOKEN?.trim();
const secretToken = localSecrets.TELEGRAM_WEBHOOK_SECRET?.trim();
if (!token || !secretToken) throw new Error('TELEGRAM_BOT_TOKEN or TELEGRAM_WEBHOOK_SECRET is missing from .dev.vars');

async function call(method, body) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(10_000),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result || result.ok !== true) throw new Error(`Telegram ${method} failed with HTTP ${response.status}`);
  return result.result;
}

const current = await call('getWebhookInfo', {});
if (!current.url) throw new Error('Telegram webhook URL is not configured');
const allowedUpdates = ['message', 'callback_query'];
await call('setWebhook', { url: current.url, secret_token: secretToken, allowed_updates: allowedUpdates, drop_pending_updates: false });
const installed = await call('getWebhookInfo', {});
if (JSON.stringify(installed.allowed_updates ?? []) !== JSON.stringify(allowedUpdates)) throw new Error('Telegram webhook allowed_updates verification failed');
console.log(`Telegram webhook updated (${allowedUpdates.join(', ')}).`);
