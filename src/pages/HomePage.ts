import { expect, Page, test } from '@playwright/test';
import { ShippingDestination } from './components/ShippingDestination';
import { HomeLocators } from '../locators/HomeLocators';
import { BasePage } from './BasePage';
import { SearchResultsPage } from './SearchResultsPage';

export class HomePage extends BasePage {
  readonly shippingDestination: ShippingDestination;
  readonly locators: HomeLocators;

  constructor(page: Page) {
    super(page);
    this.shippingDestination = new ShippingDestination(page);
    this.locators = new HomeLocators(page);
  }

  async assertMainPage(expected: { expectedUrlPattern: string; expectedTitle: string }): Promise<void> {
    await test.step('Assert successful homepage landing', async () => {
      await expect(this.page).toHaveURL(new RegExp(expected.expectedUrlPattern));
      await expect(this.page).toHaveTitle(expected.expectedTitle);
      await expect(this.locators.logo).toBeVisible();
      await expect(this.locators.searchInput).toBeVisible();
      await expect(this.locators.searchButton).toBeVisible();
      await this.takeScreenshot('home-page');
    });
  }

  async open(url: string): Promise<void> {
    await this.navigateTo(url);
    await this.waitForPageReady(this.locators.searchInput);
  }

  async setShippingDestination(country: string, postalCode: string): Promise<void> {
    await this.shippingDestination.selectDestination(country, postalCode);
    await this.waitForPageReady(this.locators.searchInput);
  }

  async search(term: string): Promise<SearchResultsPage> {
    return test.step(`Search for "${term}"`, async () => {
      await this.type(this.locators.searchInput, term, 'search box');
      await this.click(this.locators.searchButton, 'search button');
      const resultsPage = new SearchResultsPage(this.page);
      await resultsPage.waitForResults();
      return resultsPage;
    });
  }
}

