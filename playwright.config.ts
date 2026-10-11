import path from 'node:path';
import { defineConfig } from '@playwright/test';

/**
 * Runtime behaviour is driven by environment variables so the same suite can run
 * headed (for demos / video recording) or headless (CI) without code changes.
 *
 *   HEADLESS=true          run without a visible browser window (default: headed)
 *   SLOW_MO=300            delay in ms between browser actions (default: 300 headed, 0 headless)
 *   BROWSER_CHANNEL=chrome select chrome | msedge | chromium (bundled, default)
 *   PROXY_SERVER=...       route traffic through a proxy, e.g. http://host:port
 */
process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.join(__dirname, '.playwright');

const headless = process.env.HEADLESS === 'true';
const slowMo = Number(process.env.SLOW_MO ?? (headless ? 0 : 300));
const channel = process.env.BROWSER_CHANNEL ?? 'chromium';

export default defineConfig({
  testDir: './tests',
  // Home, search and filter pages can each sit out eBay's throttling for up to 3 minutes.
  timeout: 600_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  outputDir: 'reports/artifacts',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['junit', { outputFile: 'reports/junit/results.xml' }],
  ],
  use: {
    channel: channel === 'chromium' ? undefined : channel,
    headless,
    viewport: { width: 1366, height: 768 },
    locale: 'en-US',
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
    screenshot: 'only-on-failure',
    video: 'on',
    trace: 'on',
    proxy: process.env.PROXY_SERVER ? { server: process.env.PROXY_SERVER } : undefined,
    launchOptions: { slowMo, args: ['--start-maximized'] },
  },
});
