import { defineConfig } from '@playwright/test';
import config from './playwright.config';

export default defineConfig({
  ...config,
  testDir: './checks',
  outputDir: 'reports/checks-artifacts',
  reporter: [['list']],
  use: { ...config.use, headless: true, video: 'off', trace: 'off', launchOptions: { slowMo: 0 } },
});
