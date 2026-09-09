import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

const major = Number(process.versions.node.split('.')[0]);
console.log(`Node: ${process.versions.node}${major === 24 ? ' (target LTS)' : ' (target: Node 24 LTS)'}`);
console.log(`Dependencies: ${existsSync('node_modules/wrangler/package.json') ? 'installed' : 'missing; run npm ci'}`);
console.log(`Git: ${existsSync('.git') ? 'initialized locally' : 'not initialized'}`);
const secrets = existsSync('.dev.vars') ? parseEnv(readFileSync('.dev.vars', 'utf8')) : {};
for (const name of ['TELEGRAM_BOT_TOKEN', 'OPENROUTER_API_KEY']) {
  console.log(`${name}: ${secrets[name]?.trim() ? 'present (not verified)' : 'not configured; local probe does not need it'}`);
}
console.log('Cloudflare: account created by user; authentication/resources not verified by this check.');
console.log('This command never prints secret values or calls external APIs.');
