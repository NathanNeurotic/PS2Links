const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: __dirname,
  timeout: 60000, // Global timeout for tests in milliseconds
  use: {
    headless: true,
    baseURL: 'http://localhost:3000',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000, // Default is 5000ms
    navigationTimeout: 45000, // Default is 30000ms, increased further
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    // Add other browser configurations if needed
  ],
  webServer: {
    command: 'npx http-server -p 3000',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});
