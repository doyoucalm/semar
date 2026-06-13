import { defineConfig } from 'vitest/config';

// Web-app safety net. Scope: pure logic in lib/ (no DOM, no React) — the layer
// that gets refactored most and is cheapest to pin. Component/DOM behavior is
// deliberately NOT tested here; extract pure logic into lib/ and pin it there
// (see docs/WEB_BUILD_STRUCTURE.md §5).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'test/**/*.test.ts'],
  },
});
