import { expect, Locator, Page, test } from '@playwright/test';
import { SearchResultsLocators } from '../locators/SearchResultsLocators';
import { logger } from '../utils/logger';
import { BasePage } from './BasePage';

export class SearchResultsPage extends BasePage {
  readonly locators: SearchResultsLocators;

  constructor(page: Page) {
    super(page);
    this.locators = new SearchResultsLocators(page);
  }

  async assertSearchResults(term: string, minimum: number): Promise<void> {
    await test.step('Assert search results before filtering', async () => {
      await expect(this.page).toHaveURL(/\/sch\//);
      expect(new URL(this.page.url()).searchParams.get('_nkw')).toBe(term);
      await expect(this.locators.resultCountHeading).toContainText(term, { ignoreCase: true });
      await expect(this.locators.resultItems.first()).toBeVisible();
      const count = await this.getResultCount();
      expect(count).toBeGreaterThanOrEqual(minimum);
      logger.carCount(count);
      logger.info(await this.getResultCountText());
      logger.info(`Results listed on the first page: ${await this.getDisplayedItemCount()}`);
      await this.takeScreenshot('search-results');
    });
  }

  async assertFilterAvailable(group: string, value: string, minimum: number): Promise<void> {
    await test.step('Assert sidebar count before selecting the filter', async () => {
      await expect(this.locators.resultItems.first()).toBeVisible();
      const count = await this.getFilterResultCount(group, value);
      expect(count).toBeGreaterThanOrEqual(minimum);
      logger.info(`Cars shown beside ${value} before selection: ${count}`);
      logger.carCount(count);
      await this.takeScreenshot('manual-count-before-filter');
    });
  }

  async assertFilteredResults(group: string, value: string, minimum: number): Promise<void> {
    await test.step('Assert selected filter and filtered results', async () => {
      await expect(this.locators.filterGroup(group)).toBeAttached();
      await expect(this.locators.filterCheckbox(group, value)).toBeChecked();
      await expect(this.locators.resultItems.first()).toBeVisible();
      const count = await this.getFilterResultCount(group, value);
      expect(count).toBeGreaterThanOrEqual(minimum);
      logger.info(`Number of cars from the count beside ${value}: ${count}`);
      logger.carCount(count);
      logger.info(`Filtered results heading (separate from sidebar count): ${await this.getResultCountText()}`);
      await this.takeScreenshot('filtered-results');
    });
  }

  async waitForResults(): Promise<void> {
    await this.waitForPageReady(this.locators.resultCountHeading);
  }

  /** Full heading text, e.g. "7,000+ results for mazda mx-5". */
  async getResultCountText(): Promise<string> {
    return this.getText(this.locators.resultCountHeading);
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
    return this.locators.resultItems.count();
  }

  /** Read the car count beside the sidebar option, for example Manual (47). */
  async getFilterResultCount(group: string, value: string): Promise<number> {
    return test.step(`Read count beside ${group} -> ${value}`, async () => {
      const option = this.locators.filterOption(group, value);
      if (!(await this.isVisible(option, 2_000)) && await this.isVisible(this.locators.filterGroupHeading(group))) {
        await this.click(this.locators.filterGroupHeading(group), `"${group}" filter group`);
      }
      const label = (await this.getText(option)).replace(/\s+/g, ' ').trim();
      const match = label.match(/\(\s*([\d,]+)\s*\)/);
      if (!match) {
        throw new Error(`Cannot read the count beside "${value}" in "${group}": "${label}"`);
      }
      return Number(match[1].replace(/,/g, ''));
    });
  }

  /** The assignment requires an actual click in the left sidebar. */
  async selectFilterFromLeftSidebar(group: string, value: string): Promise<void> {
    await test.step(`Apply left-sidebar filter ${group} -> ${value}`, async () => {
      if (!(await this.applyFilterFromLeftRail(group, value))) {
        throw new Error(`The left sidebar does not offer ${group} -> ${value}. Select the vehicle category or check the site's available inventory. No URL fallback is allowed.`);
      }
    });
  }

  private async applyFilterFromLeftRail(group: string, value: string): Promise<boolean> {
    const heading = this.locators.filterGroupHeading(group);
    if (!(await this.isVisible(heading)) && (await this.locators.filterGroup(group).count()) === 0) return false;

    const option = this.locators.filterOption(group, value);
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

}
