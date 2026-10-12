import { test as base, expect, Request, Response } from '@playwright/test';
import { registerPopupHandlers } from './utils/popupHandlers';
import { logger } from './utils/logger';
import { HomePage } from './pages/HomePage';

type NetworkDiagnostics = {
  httpErrors: { url: string; status: number; method: string; resourceType: string; timestamp: string }[];
  failedRequests: { url: string; method: string; resourceType: string; error: string | undefined }[];
};

export const test = base.extend<{ homePage: HomePage; networkDiagnostics: NetworkDiagnostics }>({
  networkDiagnostics: async ({}, use) => {
    await use({ httpErrors: [], failedRequests: [] });
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  page: async ({ page, context, networkDiagnostics }, use, testInfo) => {
    const documents: { url: string; status: number }[] = [];
    const onResponse = (response: Response) => {
      const request = response.request();
      if (response.status() >= 400) {
        const entry = {
          url: response.url(), status: response.status(), method: request.method(),
          resourceType: request.resourceType(), timestamp: new Date().toISOString(),
        };
        networkDiagnostics.httpErrors.push(entry);
        logger.warn(`Network HTTP ${entry.status} (${entry.resourceType}, ${entry.method}): ${entry.url}`);
      }
      if (response.request().isNavigationRequest() && response.frame() === page.mainFrame()) {
        const entry = { url: response.url(), status: response.status() };
        documents.push(entry);
      }
    };
    const onRequestFailed = (request: Request) => {
      networkDiagnostics.failedRequests.push({
        url: request.url(), method: request.method(), resourceType: request.resourceType(),
        error: request.failure()?.errorText,
      });
    };
    context.on('response', onResponse);
    context.on('requestfailed', onRequestFailed);
    try {
      await registerPopupHandlers(page);
      await use(page);
    } finally {
      context.off('response', onResponse);
      context.off('requestfailed', onRequestFailed);
      await testInfo.attach('page-response-statuses', {
        body: Buffer.from(JSON.stringify(documents, null, 2)), contentType: 'application/json',
      });
      await testInfo.attach('network-diagnostics', {
        body: Buffer.from(JSON.stringify(networkDiagnostics, null, 2)), contentType: 'application/json',
      });
      logger.info(`Network summary: ${networkDiagnostics.httpErrors.filter(entry => entry.status === 403).length} HTTP 403 responses, ${networkDiagnostics.httpErrors.length} HTTP errors, ${networkDiagnostics.failedRequests.length} failed requests`);
    }
  },
});
export { expect };
