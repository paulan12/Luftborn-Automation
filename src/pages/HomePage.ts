import { Locator, Page, test } from '@playwright/test';
import { ShippingDestination } from './components/ShippingDestination';
import { BasePage } from './BasePage';
import { SearchResultsPage } from './SearchResultsPage';

export class HomePage extends BasePage {
  readonly shippingDestination: ShippingDestination;
  readonly logo: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;

  constructor(page: Page) {
    super(page);
    this.shippingDestination = new ShippingDestination(page);
    this.logo = page.locator('#gh-logo');
    this.searchInput = page.locator('input[name="_nkw"]');
    this.searchButton = page.locator('#gh-search-btn, #gh-btn').first();
  }

  async open(url: string): Promise<void> {
    await this.navigateTo(url);
    await this.waitForPageReady(this.searchInput);
  }

  async setShippingDestination(country: string, postalCode: string): Promise<void> {
    await this.shippingDestination.selectDestination(country, postalCode);
    await this.waitForPageReady(this.searchInput);
  }

  async search(term: string): Promise<SearchResultsPage> {
    return test.step(`Search for "${term}"`, async () => {
      await this.type(this.searchInput, term, 'search box');
      await this.click(this.searchButton, 'search button');
      const resultsPage = new SearchResultsPage(this.page);
      await resultsPage.waitForResults();
      return resultsPage;
    });
  }
}

