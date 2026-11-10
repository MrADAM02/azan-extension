import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

// WxtVitest adds the @/ alias, auto-imports and an in-memory fake `browser` API.
export default defineConfig({
  plugins: [WxtVitest()],
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
