import { defineConfig } from '@playwright/test';

// Dev-mode e2e config. The main suite (playwright.config.ts) runs against the
// production `npm run preview` build, where the React (Keystatic) integration is
// NOT loaded — so it can't catch dev-only hydration regressions. This config runs
// a small suite against `astro dev` (React + Preact both active) on a separate
// port, guarding the Preact search island's hydration.
const PORT = 4330;

export default defineConfig({
  testDir: './tests/e2e-dev',
  fullyParallel: false,
  use: { baseURL: `http://127.0.0.1:${PORT}/` },
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 90_000,
  },
});
