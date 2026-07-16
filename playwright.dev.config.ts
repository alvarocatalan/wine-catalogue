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
    // Bind to 127.0.0.1 explicitly so it matches the polled URL (on CI the default
    // host can resolve to IPv6 ::1 while the poll uses IPv4 → a webServer timeout).
    command: `npm run dev -- --host 127.0.0.1 --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
