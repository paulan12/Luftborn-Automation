import { Page } from '@playwright/test';
import { ShippingDestination } from '../pages/components/ShippingDestination';

/** Compatibility wrapper; locators and behavior belong to the POM component. */
export async function registerPopupHandlers(page: Page): Promise<void> {
  await new ShippingDestination(page).registerPopupHandler();
}
