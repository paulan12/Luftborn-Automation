import { expect, test } from '../src/fixtures';
import { logger } from '../src/utils/logger';
import { EbaySearchData, readJson } from '../src/utils/testDataReader';

const data = readJson<EbaySearchData>('ebay-search.json');

for (const scenario of data.scenarios) {
  test.describe(`eBay search: ${scenario.name}`, () => {

    test('TC01 - Navigate to eBay and validate landing on the main page', async ({ page, homePage }) => {
      await homePage.open(data.baseUrl);

      await expect(page).toHaveURL(new RegExp(data.homePage.expectedUrlPattern));
      await expect(page).toHaveTitle(data.homePage.expectedTitle);
      await expect(homePage.logo).toBeVisible();
      await expect(homePage.searchInput).toBeVisible();
      await expect(homePage.searchButton).toBeVisible();
      await homePage.takeScreenshot('home-page');
    });

    test(`TC02 - Search for "${scenario.searchTerm}" and validate results before filtering`, async ({ page, homePage }) => {
      await homePage.open(data.baseUrl);
      await homePage.setShippingDestination(data.shippingDestination.country, data.shippingDestination.postalCode);
      const resultsPage = await homePage.search(scenario.searchTerm);

      await expect(page).toHaveURL(/\/sch\//);
      expect(new URL(page.url()).searchParams.get('_nkw')).toBe(scenario.searchTerm);
      await expect(resultsPage.resultCountHeading).toContainText(scenario.searchTerm, { ignoreCase: true });
      await expect(resultsPage.resultItems.first()).toBeVisible();

      const total = await resultsPage.getResultCount();
      expect(total).toBeGreaterThanOrEqual(scenario.minimumExpectedResults);

      const heading = await resultsPage.getResultCountText();
      const listedOnPage = await resultsPage.getDisplayedItemCount();
      const approximate = await resultsPage.isResultCountApproximate();
      logger.info(
        `Number of search results for "${scenario.searchTerm}": ${total}` +
          (approximate ? ' (eBay rounds large counts; this is a lower bound, e.g. "7,000+")' : ' (exact)') +
          ` | heading: "${heading}"`,
      );
      logger.info(`Results listed on the first page: ${listedOnPage}`);
      await resultsPage.takeScreenshot('search-results');
    });

    test(`TC03 - Apply "${scenario.filter.group}" -> "${scenario.filter.value}" and validate filtered results`, async ({ page, homePage }) => {
      await homePage.open(data.baseUrl);
      await homePage.setShippingDestination(data.shippingDestination.country, data.shippingDestination.postalCode);
      const resultsPage = await homePage.search(scenario.searchTerm);
      await expect(resultsPage.resultItems.first()).toBeVisible();
      const { group, value } = scenario.filter;
      const carsBefore = await resultsPage.getFilterResultCount(group, value);
      expect(carsBefore).toBeGreaterThanOrEqual(scenario.minimumExpectedResults);
      logger.info(`Cars shown beside ${value} before selection: ${carsBefore}`);
      await resultsPage.takeScreenshot('manual-count-before-filter');

      await resultsPage.applyFilter(group, value);

      expect(resultsPage.isFilterInUrl(group, value), `URL should contain ${group}=${value}`).toBe(true);
      await expect(resultsPage.filterGroup(group), `"${group}" group should be in the left rail`).toBeAttached();
      await expect(resultsPage.filterCheckbox(group, value)).toBeChecked();
      await expect(resultsPage.resultItems.first()).toBeVisible();

      const manualCars = await resultsPage.getFilterResultCount(group, value);
      expect(manualCars).toBeGreaterThanOrEqual(scenario.minimumExpectedResults);
      logger.info(`Number of cars from the count beside ${value}: ${manualCars}`);
      logger.info(`Filtered results heading (separate from sidebar count): ${await resultsPage.getResultCountText()}`);
      await resultsPage.takeScreenshot('filtered-results');
    });
  });
}
