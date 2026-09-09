# Working on Navi

## Product and scope

Read `docs/personal-assistant-product.md`, `docs/telegram-pilot.md`, and `docs/engineering/infrastructure.md` before changing application behavior. Telegram + Cloudflare Free + DeepSeek through OpenRouter is the current direction. Preserve Vietnamese domain language and distinguish planned capability from running behavior.

The first task slice is implemented: private Telegram pairing, add/list/done commands, durable D1 jobs and outbox, Queue consumer and Cron recovery. See docs/engineering/task-pilot.md for deployment status and limitations. The local environment probe remains separate; never deploy it.

## Local commands

Use npm and `package-lock.json`. Target Node 24.20.0 (`.nvmrc`); do not change the user's global runtime. `npm exec --yes --package=node@24 -- npm run check` can run checks with Node 24 when a version manager is unavailable.

- `npm ci`: restore dependencies.
- `npm run doctor`: show environment readiness without secret values or network calls.
- `npm run dev`: local Wrangler runtime on 127.0.0.1:8787, local D1.
- `npm run check`: regenerate binding types, TypeScript check, workerd/D1 tests, both Worker build dry runs.
- `npm run cloudflare:whoami`: inspect CLI authentication; does not create resources.

Behavior tests live in tests/tasks.test.ts and use isolated D1 with fake Telegram delivery; never load real credentials into tests. Generated types use the matching test bindings with widened variable types so a clean checkout needs no secrets.

## Implementation rules

Keep domain operations independent of Telegram, Hono, OpenRouter and D1 transport details. Use prepared SQL and atomic writes for inbox/job/outbox. Never mark job success from model text alone. Persist state before acknowledging Telegram delivery. Track model spend and reserve budget before paid requests.

Read project skills `.agents/skills/wrangler/SKILL.md` and `.agents/skills/workers-best-practices/SKILL.md` when working on Workers configuration/runtime. Their support files are vendored from `cloudflare/skills` main on 2026-09-08; review changes when updating.

Keep secrets in ignored local files or Cloudflare Secrets. Never print secret values, put them into command arguments, or publish private records in fixtures. Check the exact account/environment/resource before remote mutations. Do not deploy the environment probe or treat the local config as production configuration. Do not auto-upgrade paid plans or auto-top-up API credit.

## Development trace

Maintain the append-only [`docs/engineering/development-log.md`](docs/engineering/development-log.md). After every meaningful product, architecture, data, cost, or deployment change, add a dated entry using its template. Record evidence and limitations separately from plans. Never put secrets or unnecessary private chat content in the log. Use the log with git history, tests, and deployment history when producing a project summary.
