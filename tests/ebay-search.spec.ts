import { test } from '../src/fixtures';
import { EbaySearchData, readJson } from '../src/utils/testDataReader';

const data = readJson<EbaySearchData>('ebay-search.json');

for (const scenario of data.scenarios) {
  test.describe(`eBay search: ${scenario.name}`, () => {
    test('TC01 - Navigate to eBay and validate landing on the main page', async ({ homePage }) => {
      await homePage.open(data.baseUrl);
      await homePage.assertMainPage(data.homePage);
    });

    test(`TC02 - Search for "${scenario.searchTerm}" and validate results before filtering`, async ({ homePage }) => {
      await homePage.open(data.baseUrl);
      await homePage.setShippingDestination(data.shippingDestination.country, data.shippingDestination.postalCode);
      const resultsPage = await homePage.search(scenario.searchTerm);
      await resultsPage.assertSearchResults(scenario.searchTerm, scenario.minimumExpectedResults);
    });

    test(`TC03 - Apply "${scenario.filter.group}" -> "${scenario.filter.value}" and validate filtered results`, async ({ homePage }) => {
      await homePage.open(data.baseUrl);
      await homePage.setShippingDestination(data.shippingDestination.country, data.shippingDestination.postalCode);
      const resultsPage = await homePage.search(scenario.searchTerm);
      const { group, value } = scenario.filter;
      await resultsPage.assertFilterAvailable(group, value, scenario.minimumExpectedResults);
      await resultsPage.applyFilter(group, value);
      await resultsPage.assertFilteredResults(group, value, scenario.minimumExpectedResults);
    });
  });
}
