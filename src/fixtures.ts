import { test as base, expect, Response } from '@playwright/test';
import { registerPopupHandlers } from './utils/popupHandlers';
import { logger } from './utils/logger';
import { HomePage } from './pages/HomePage';

export const test = base.extend<{ homePage: HomePage }>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  page: async ({ page }, use, testInfo) => {
    const documents: { url: string; status: number }[] = [];
    const onResponse = (response: Response) => {
      if (response.request().isNavigationRequest() && response.frame() === page.mainFrame()) {
        const entry = { url: response.url(), status: response.status() };
        documents.push(entry);
        if (entry.status >= 400) logger.warn(`Page response HTTP ${entry.status}: ${entry.url}`);
      }
    };
    page.on('response', onResponse);
    await registerPopupHandlers(page);
    try {
      await use(page);
    } finally {
      page.off('response', onResponse);
      await testInfo.attach('page-response-statuses', {
        body: Buffer.from(JSON.stringify(documents, null, 2)), contentType: 'application/json',
      });
    }
  },
});
export { expect };
