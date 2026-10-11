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
   * Waits for real page content and retries the observed server-error page with bounded backoff.
   * The generic error message alone does not establish an HTTP status or guarantee recovery.
   * `maxWaitMs` bounds backoff time; navigation/action timeouts apply separately.
   */
  async waitForPageReady(readyLocator: Locator, maxWaitMs = 180_000): Promise<void> {
    await this.waitForPageLoad();
    let waited = 0;
    for (let attempt = 1; ; attempt++) {
      await readyLocator.or(this.errorPageMessage).or(this.botChallengeHeading).first().waitFor({ state: 'visible' });
      if (await readyLocator.first().isVisible()) return;

      if (await this.botChallengeHeading.isVisible()) {
        throw new Error('eBay is showing a bot-check page ("Pardon Our Interruption"). Wait a few minutes and re-run.');
      }
      if (waited >= maxWaitMs) {
        throw new Error(
          `eBay kept returning its error page after waiting ${waited / 1000}s across ${attempt - 1} reloads. ` +
            'Inspect the trace network responses and retry later; the site did not return usable content.',
        );
      }
      const delay = Math.min(attempt * 15_000, 60_000, maxWaitMs - waited);
      logger.warn(`eBay returned "Something went wrong" page, reloading in ${delay / 1000}s (waited ${waited / 1000}s of ${maxWaitMs / 1000}s)`);
      await this.page.waitForTimeout(delay);
      waited += delay;
      // eBay may answer the reload with its "Checking your browser" splash, whose own redirect
      // aborts the reload navigation. The next loop iteration waits for whichever page lands.
      await this.page.reload({ waitUntil: 'domcontentloaded' }).catch((error: Error) => {
        if (!error.message.includes('ERR_ABORTED')) throw error;
      });
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
