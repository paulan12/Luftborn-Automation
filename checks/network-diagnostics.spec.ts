import { test, expect } from '../src/fixtures';

test('records forbidden iframe and fetch responses separately from transport failures', async ({ page, networkDiagnostics }) => {
  await page.route('https://example.test/**', route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === '/offline') return route.abort('connectionfailed');
    return route.fulfill({
      status: pathname === '/' ? 200 : 403,
      contentType: 'text/html',
      body: pathname === '/' ? '<iframe src="/forbidden-frame"></iframe>' : 'Forbidden',
    });
  });
  await page.goto('https://example.test/');
  await page.evaluate(async () => {
    await fetch('/forbidden-api');
    await fetch('/offline').catch(() => undefined);
  });
  await expect.poll(() => networkDiagnostics.httpErrors.length).toBe(2);
  expect(networkDiagnostics.httpErrors).toEqual(expect.arrayContaining([
    expect.objectContaining({ url: 'https://example.test/forbidden-frame', status: 403, resourceType: 'document' }),
    expect.objectContaining({ url: 'https://example.test/forbidden-api', status: 403, resourceType: 'fetch' }),
  ]));
  await expect.poll(() => networkDiagnostics.failedRequests.length).toBe(1);
  expect(networkDiagnostics.failedRequests[0].url).toBe('https://example.test/offline');
});
