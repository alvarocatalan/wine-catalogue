import { defineConfig } from '@playwright/test';

// The site is served under the GitHub Pages base path.
const baseURL = 'http://127.0.0.1:4321/wine-catalog/';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: { baseURL },
  webServer: {
    command: 'npm run preview',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
