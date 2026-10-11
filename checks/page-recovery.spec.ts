import { test, expect } from '../src/fixtures';

// Exercise the same server-error recovery branch observed in the failed TC03 report.
test('page object reloads a transient server error and waits for the real page', async ({ page, homePage }) => {
  let requests = 0;
  await page.route('https://example.test/', route => {
    requests++;
    return route.fulfill({
      status: requests === 1 ? 503 : 200,
      contentType: 'text/html',
      body: requests === 1 ? '<h1>Something went wrong on our end</h1>' : '<input name="_nkw">',
    });
  });
  await page.goto('https://example.test/');
  await homePage.waitForPageReady(homePage.locators.searchInput, 1);
  await expect(homePage.locators.searchInput).toBeVisible();
  expect(requests).toBe(2);
});

test('persistent server errors fail rather than masquerade as successful results', async ({ page, homePage }) => {
  await page.setContent('<h1>Something went wrong on our end</h1>');
  await expect(homePage.waitForPageReady(homePage.locators.searchInput, 0)).rejects.toThrow('eBay kept returning its error page');
});

test('persistent error stops after one retry even with a large backoff budget', async ({ page, homePage }) => {
  let requests = 0;
  await page.route('https://example.test/', route => {
    requests++;
    return route.fulfill({ status: 503, contentType: 'text/html', body: '<h1>Something went wrong on our end</h1>' });
  });
  await page.goto('https://example.test/');
  await expect(homePage.waitForPageReady(homePage.locators.searchInput, 180_000)).rejects.toThrow('across 1 reloads');
  expect(requests).toBe(2);
});
