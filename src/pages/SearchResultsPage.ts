import { Locator, Page, test } from '@playwright/test';
import { BasePage } from './BasePage';

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class SearchResultsPage extends BasePage {
  readonly resultCountHeading: Locator;
  readonly resultItems: Locator;
  readonly leftRail: Locator;

  constructor(page: Page) {
    super(page);
    this.resultCountHeading = page.locator('.srp-controls__count-heading').first();
    this.resultItems = page.locator('ul.srp-results > li.s-card, ul.srp-results > li.s-item');
    this.leftRail = page.locator('.srp-rail__left');
  }

  async waitForResults(): Promise<void> {
    await this.waitForPageReady(this.resultCountHeading);
  }

  /** Full heading text, e.g. "7,000+ results for mazda mx-5". */
  async getResultCountText(): Promise<string> {
    return this.getText(this.resultCountHeading);
  }

  /** Numeric part of the result count heading, e.g. 7000 for "7,000+ results". */
  async getResultCount(): Promise<number> {
    const text = await this.getResultCountText();
    const match = text.match(/^\s*([\d,]+)\+?\s+results?\b/i);
    if (!match) {
      throw new Error(`Could not read a result count from heading: "${text}"`);
    }
    return Number(match[1].replace(/,/g, ''));
  }

  /** eBay rounds large counts down and appends "+", e.g. "7,000+ results". */
  async isResultCountApproximate(): Promise<boolean> {
    return /\d\+/.test(await this.getResultCountText());
  }

  async getDisplayedItemCount(): Promise<number> {
    return this.resultItems.count();
  }

  // ---------- Left-rail filter locators ----------
  // eBay renders each item-specific refinement as:
  //   <fieldset><legend class="clipped">aspect-Transmission</legend>
  //     <a class="su-selection-group__link"><input type="checkbox" value="Manual" ...> Manual</a> ...

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

  /** The assignment requires an actual click in the left sidebar. */
  async applyFilter(group: string, value: string): Promise<void> {
    await test.step(`Apply left-sidebar filter ${group} -> ${value}`, async () => {
      if (!(await this.applyFilterFromLeftRail(group, value))) {
        throw new Error(`The left sidebar does not offer ${group} -> ${value}. Select the vehicle category or check the site's available inventory. No URL fallback is allowed.`);
      }
    });
  }

  private async applyFilterFromLeftRail(group: string, value: string): Promise<boolean> {
    const heading = this.filterGroupHeading(group);
    if (!(await this.isVisible(heading)) && (await this.filterGroup(group).count()) === 0) return false;

    const option = this.filterOption(group, value);
    if (!(await this.isVisible(option, 2_000)) && (await this.isVisible(heading, 1_000))) {
      // Collapsed group: expand it by clicking its heading.
      await this.click(heading, `"${group}" filter group`);
    }
    if (!(await this.isVisible(option))) return false;

    await this.clickAndWaitForNavigation(option, `"${value}" option under "${group}"`);
    return true;
  }

  private async clickAndWaitForNavigation(locator: Locator, description: string): Promise<void> {
    const urlBefore = this.getUrl();
    await this.click(locator, description);
    await this.page.waitForURL((url) => url.href !== urlBefore);
    await this.waitForResults();
  }

  /** The refinement is in eBay's query string, e.g. "&Transmission=Manual". */
  isFilterInUrl(group: string, value: string): boolean {
    const params = new URL(this.getUrl()).searchParams;
    return (params.get(group) ?? '')
      .split('|')
      .some((v) => v.toLowerCase() === value.toLowerCase());
  }

}
