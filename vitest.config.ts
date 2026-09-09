import { defineConfig } from 'vitest/config';
import { cloudflareTest } from '@cloudflare/vitest-plugin';
export default defineConfig({
  plugins: [cloudflareTest({ wrangler: { configPath: './tests/wrangler.jsonc' } })],
  test: { include: ['tests/**/*.test.ts'], fileParallelism: false },
});
