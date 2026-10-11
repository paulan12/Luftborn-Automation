import { test, expect } from '../src/fixtures';
import { SearchResultsPage } from '../src/pages/SearchResultsPage';

test('selects the sidebar option through a real click without constructing a filter URL', async ({ page }) => {
  await page.route('https://example.test/**', route => {
    const selected = new URL(route.request().url()).pathname === '/selected';
    return route.fulfill({ contentType: 'text/html', body: `
      <h1 class="srp-controls__count-heading">2 results for mazda mx-5</h1>
      <aside class="srp-rail__left"><fieldset><legend>aspect-Transmission</legend>
        <a href="/selected" onclick="sessionStorage.setItem('sidebarClicked','yes')"><input style="display:none" type="checkbox" value="Manual" ${selected ? 'checked' : ''}>Manual (2)</a>
      </fieldset></aside>
      <ul class="srp-results"><li class="s-item">Mazda MX-5</li></ul>
    ` });
  });
  await page.goto('https://example.test/search');
  const results = new SearchResultsPage(page);
  await results.selectFilterFromLeftSidebar('Transmission', 'Manual');
  await results.assertFilteredResults('Transmission', 'Manual', 1);
  expect(await page.evaluate(() => sessionStorage.getItem('sidebarClicked'))).toBe('yes');
  await expect(page).toHaveURL('https://example.test/selected');
});

