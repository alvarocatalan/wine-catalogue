import { defineConfig } from '@playwright/test';

// Normal (local) e2e runs against the built static preview under the Pages base.
// The post-deploy smoke (deploy-smoke.spec.ts) runs against the LIVE site when
// DEPLOY_URL is set — in that case we do NOT start a local server.
const DEPLOY_URL = process.env.DEPLOY_URL;
const LOCAL_URL = 'http://127.0.0.1:4321/wine-catalogue/';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: { baseURL: DEPLOY_URL ?? LOCAL_URL },
  webServer: DEPLOY_URL
    ? undefined
    : {
        // Bind the preview to 127.0.0.1 explicitly so it matches the URL Playwright
        // polls — on CI the default host can resolve to IPv6 (::1) while the poll
        // uses IPv4, which manifests as a 60s "webServer" timeout.
        command: 'npm run preview -- --host 127.0.0.1',
        url: LOCAL_URL,
        // In CI always start a fresh server; locally reuse one if already running.
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: 'pipe',
        stderr: 'pipe',
      },
});
