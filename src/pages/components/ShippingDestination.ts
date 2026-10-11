import { Locator, Page, test } from '@playwright/test';
import { BasePage } from '../BasePage';
import { logger } from '../../utils/logger';

/** Shared header/dialog component. All shipping locators live here. */
export class ShippingDestination extends BasePage {
  readonly locationButton: Locator;
  readonly dialog: Locator;
  readonly closeButton: Locator;
  readonly frameElement: Locator;
  readonly countrySelect: Locator;
  readonly postalCodeInput: Locator;
  readonly confirmButton: Locator;

  constructor(page: Page) {
    super(page);
    this.locationButton = page.locator('button.gh-ship-to__menu');
    this.dialog = page.locator('[role="dialog"].address-dialog__lightbox');
    this.closeButton = this.dialog.locator('.lightbox-dialog__close').first();
    this.frameElement = this.dialog.locator('iframe');
    const frame = this.frameElement.contentFrame();
    this.countrySelect = frame.getByRole('combobox', { name: 'Country or Region' });
    this.postalCodeInput = frame.getByRole('textbox', { name: 'Zipcode' });
    this.confirmButton = frame.getByRole('button', { name: 'Confirm', exact: true });
  }

  async registerPopupHandler(): Promise<void> {
    await this.page.addLocatorHandler(this.dialog, async () => {
      logger.info('Closing unexpected shipping popup');
      await this.closeButton.click();
    });
  }

  async selectDestination(country: string, postalCode: string): Promise<void> {
    await test.step(`Set test shipping destination to ${country}, ${postalCode}`, async () => {
      // Leave the handler enabled until the button click succeeds, even if a popup appears late.
      await this.click(this.locationButton, 'shipping destination');
      await this.page.removeLocatorHandler(this.dialog);
      try {
        await this.countrySelect.selectOption({ label: country });
        await this.postalCodeInput.fill(postalCode);
        await this.confirmButton.click();
        await this.frameElement.waitFor({ state: 'hidden' });
      } finally {
        await this.registerPopupHandler();
      }
    });
  }
}
