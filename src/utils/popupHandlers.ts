import { Page } from '@playwright/test';
import { logger } from './logger';

/**
 * eBay randomly shows overlays (e.g. "Are you shipping to ...?") that block clicks.
 * Playwright calls these handlers automatically whenever the overlay appears before an action.
 */
export async function registerPopupHandlers(page: Page): Promise<void> {
  const shippingDialog = page.locator('[role="dialog"].address-dialog__lightbox');
  await page.addLocatorHandler(shippingDialog, async (dialog) => {
    logger.info('Closing "Are you shipping to ...?" popup');
    await dialog.locator('.lightbox-dialog__close').first().click();
  });
}


