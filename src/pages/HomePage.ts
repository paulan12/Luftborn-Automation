import { Locator, Page, test } from '@playwright/test';
import { registerPopupHandlers } from '../utils/popupHandlers';
import { BasePage } from './BasePage';
import { SearchResultsPage } from './SearchResultsPage';

export class HomePage extends BasePage {
  readonly logo: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;

  constructor(page: Page) {
    super(page);
    this.logo = page.locator('#gh-logo');
    this.searchInput = page.locator('input[name="_nkw"]');
    this.searchButton = page.locator('#gh-search-btn, #gh-btn').first();
  }

  async open(url: string): Promise<void> {
    await this.navigateTo(url);
    await this.waitForPageReady(this.searchInput);
  }

  async setShippingDestination(country: string, postalCode: string): Promise<void> {
    await test.step(`Set test shipping destination to ${country}, ${postalCode}`, async () => {
      const locationButton = this.page.locator('button.gh-ship-to__menu');
      await this.click(locationButton, 'shipping destination');
      // Keep the handler active during the click so an existing or late popup cannot block it.
      // Disable it only after opening the intentional dialog, and always restore it.
      await this.page.removeLocatorHandler(this.page.locator('[role="dialog"].address-dialog__lightbox'));
      try {
        const dialog = this.page.frameLocator('[role="dialog"] iframe');
        await dialog.getByRole('combobox', { name: 'Country or Region' }).selectOption({ label: country });
        await dialog.getByRole('textbox', { name: 'Zipcode' }).fill(postalCode);
        await dialog.getByRole('button', { name: 'Confirm', exact: true }).click();
        await this.page.locator('[role="dialog"] iframe').waitFor({ state: 'hidden' });
        await this.waitForPageReady(this.searchInput);
      } finally {
        await registerPopupHandlers(this.page);
      }
    });
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

