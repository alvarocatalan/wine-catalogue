import { defineConfig } from '@playwright/test';

// Normal (local) e2e runs against the built static preview under the Pages base.
// The post-deploy smoke (deploy-smoke.spec.ts) runs against the LIVE site when
// DEPLOY_URL is set — in that case we do NOT start a local server.
const DEPLOY_URL = process.env.DEPLOY_URL;
const LOCAL_URL = 'http://127.0.0.1:4321/wine-catalog/';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: { baseURL: DEPLOY_URL ?? LOCAL_URL },
  webServer: DEPLOY_URL
    ? undefined
    : {
        command: 'npm run preview',
        url: LOCAL_URL,
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
