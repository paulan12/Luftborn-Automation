import { Locator, Page, test } from '@playwright/test';
import { logger } from '../utils/logger';

/**
 * Common browser actions shared by every page object.
 * Page objects call these instead of the raw Playwright API so that every action
 * is logged, waited for consistently, and appears as a named step in the report.
 */
export abstract class BasePage {
  readonly errorPageMessage: Locator;
  readonly botChallengeHeading: Locator;

  protected constructor(protected readonly page: Page) {
    this.errorPageMessage = page.getByText('Something went wrong on our end');
    this.botChallengeHeading = page.getByText('Pardon Our Interruption');
  }

  /**
   * Waits until `readyLocator` is visible. eBay intermittently serves a "Something went wrong"
   * page (especially after many requests in a row from the same IP), so reload with a growing
   * back-off before giving up.
   */
  async waitForPageReady(readyLocator: Locator, maxReloads = 4): Promise<void> {
    await this.waitForPageLoad();
    for (let attempt = 1; ; attempt++) {
      await readyLocator.or(this.errorPageMessage).or(this.botChallengeHeading).first().waitFor({ state: 'visible' });
      if (await readyLocator.first().isVisible()) return;

      if (await this.botChallengeHeading.isVisible()) {
        throw new Error('eBay is showing a bot-check page ("Pardon Our Interruption"). Wait a few minutes and re-run.');
      }
      if (attempt > maxReloads) {
        throw new Error(`eBay kept returning its error page after ${maxReloads} reloads.`);
      }
      const delay = attempt * 10_000;
      logger.warn(`eBay returned "Something went wrong" page, reloading in ${delay / 1000}s (attempt ${attempt}/${maxReloads})`);
      await this.page.waitForTimeout(delay);
      await this.page.reload({ waitUntil: 'domcontentloaded' });
    }
  }

  async navigateTo(url: string): Promise<void> {
    await test.step(`Navigate to ${url}`, async () => {
      logger.info(`Navigating to ${url}`);
      await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    });
  }

  async click(locator: Locator, description: string): Promise<void> {
    await test.step(`Click ${description}`, async () => {
      logger.info(`Clicking ${description}`);
      await locator.scrollIntoViewIfNeeded();
      await locator.click();
    });
  }

  async type(locator: Locator, text: string, description: string): Promise<void> {
    await test.step(`Type "${text}" into ${description}`, async () => {
      logger.info(`Typing "${text}" into ${description}`);
      await locator.fill('');
      await locator.pressSequentially(text, { delay: 50 });
      // A popup appearing mid-typing can steal keystrokes; make sure the field holds the full text.
      if ((await locator.inputValue()) !== text) {
        await locator.fill(text);
      }
    });
  }

  async pressKey(key: string): Promise<void> {
    await test.step(`Press ${key}`, async () => {
      await this.page.keyboard.press(key);
    });
  }

  async getText(locator: Locator): Promise<string> {
    await locator.waitFor({ state: 'visible' });
    return (await locator.innerText()).trim();
  }

  async isVisible(locator: Locator, timeout = 5_000): Promise<boolean> {
    try {
      await locator.first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  async waitForVisible(locator: Locator, timeout?: number): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  getUrl(): string {
    return this.page.url();
  }

  async takeScreenshot(name: string): Promise<void> {
    const body = await this.page.screenshot({ fullPage: false });
    await test.info().attach(name, { body, contentType: 'image/png' });
  }
}
