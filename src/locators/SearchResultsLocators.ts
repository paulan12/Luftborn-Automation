import { Locator, Page } from '@playwright/test';

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class SearchResultsLocators {
  readonly resultCountHeading: Locator;
  readonly resultItems: Locator;
  readonly leftRail: Locator;

  constructor(private readonly page: Page) {
    this.resultCountHeading = page.locator('.srp-controls__count-heading').first();
    this.resultItems = page.locator('ul.srp-results > li.s-card, ul.srp-results > li.s-item');
    this.leftRail = page.locator('.srp-rail__left');
  }

  filterGroup(group: string): Locator {
    return this.leftRail
      .locator('fieldset')
      .filter({ has: this.page.locator('legend', { hasText: new RegExp(`^\\s*aspect-${escapeRegExp(group)}\\s*$`, 'i') }) });
  }

  filterGroupHeading(group: string): Locator {
    return this.leftRail.getByText(group, { exact: true }).first();
  }

  filterOption(group: string, value: string): Locator {
    return this.filterGroup(group)
      .locator('a')
      .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(value)}\\b`, 'i') })
      .first();
  }

  filterCheckbox(group: string, value: string): Locator {
    return this.filterGroup(group).locator(`input[type="checkbox"][value="${value}"]`);
  }

}
