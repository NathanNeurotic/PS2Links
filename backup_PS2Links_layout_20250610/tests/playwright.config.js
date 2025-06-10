const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: __dirname,
  use: {
    headless: true,
    baseURL: 'http://localhost:3000',
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: 'python3 -m http.server 3000',
    port: 3000,
    cwd: path.resolve(__dirname, '..'),
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});
