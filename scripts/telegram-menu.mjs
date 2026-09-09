import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

const localSecrets = parseEnv(readFileSync('.dev.vars', 'utf8'));
const token = localSecrets.TELEGRAM_BOT_TOKEN?.trim();
if (!token) throw new Error('TELEGRAM_BOT_TOKEN is missing from .dev.vars');
const commands = JSON.parse(readFileSync('config/telegram-commands.json', 'utf8'));

async function call(method, body) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(10_000),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result || result.ok !== true) throw new Error(`Telegram ${method} failed with HTTP ${response.status}`);
  return result.result;
}

await call('setMyCommands', { commands, scope: { type: 'all_private_chats' } });
await call('setChatMenuButton', { menu_button: { type: 'commands' } });
const installed = await call('getMyCommands', { scope: { type: 'all_private_chats' } });
if (JSON.stringify(installed) !== JSON.stringify(commands)) throw new Error('Telegram command menu verification failed');
console.log(`Telegram command menu updated (${commands.length} commands).`);
