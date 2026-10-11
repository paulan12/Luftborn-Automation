import { Locator, Page } from '@playwright/test';

export class HomeLocators {
  readonly logo: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;

  constructor(page: Page) {
    this.logo = page.locator('#gh-logo');
    this.searchInput = page.locator('input[name="_nkw"]');
    this.searchButton = page.locator('#gh-search-btn, #gh-btn').first();
  }
}
