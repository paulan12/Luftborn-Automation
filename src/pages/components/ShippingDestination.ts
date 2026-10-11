import { Page, test } from '@playwright/test';
import { ShippingLocators } from '../../locators/ShippingLocators';
import { BasePage } from '../BasePage';
import { logger } from '../../utils/logger';

/** Shipping actions and popup handling; selectors live in ShippingLocators. */
export class ShippingDestination extends BasePage {
  readonly locators: ShippingLocators;

  constructor(page: Page) {
    super(page);
    this.locators = new ShippingLocators(page);
  }

  async registerPopupHandler(): Promise<void> {
    await this.page.addLocatorHandler(this.locators.dialog, async () => {
      logger.info('Closing unexpected shipping popup');
      await this.locators.closeButton.click();
    });
  }

  async selectDestination(country: string, postalCode: string): Promise<void> {
    await test.step(`Set test shipping destination to ${country}, ${postalCode}`, async () => {
      // Leave the handler enabled until the button click succeeds, even if a popup appears late.
      await this.click(this.locators.locationButton, 'shipping destination');
      await this.page.removeLocatorHandler(this.locators.dialog);
      try {
        await this.locators.countrySelect.selectOption({ label: country });
        await this.locators.postalCodeInput.fill(postalCode);
        await this.locators.confirmButton.click();
        await this.locators.frameElement.waitFor({ state: 'hidden' });
      } finally {
        await this.registerPopupHandler();
      }
    });
  }
}
