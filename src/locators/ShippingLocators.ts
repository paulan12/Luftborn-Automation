import { Locator, Page } from '@playwright/test';

export class ShippingLocators {
  readonly locationButton: Locator;
  readonly dialog: Locator;
  readonly closeButton: Locator;
  readonly frameElement: Locator;
  readonly countrySelect: Locator;
  readonly postalCodeInput: Locator;
  readonly confirmButton: Locator;

  constructor(page: Page) {
    this.locationButton = page.locator('button.gh-ship-to__menu');
    this.dialog = page.locator('[role="dialog"].address-dialog__lightbox');
    this.closeButton = this.dialog.locator('.lightbox-dialog__close').first();
    this.frameElement = this.dialog.locator('iframe');
    const frame = this.frameElement.contentFrame();
    this.countrySelect = frame.getByRole('combobox', { name: 'Country or Region' });
    this.postalCodeInput = frame.getByRole('textbox', { name: 'Zipcode' });
    this.confirmButton = frame.getByRole('button', { name: 'Confirm', exact: true });
  }

}
