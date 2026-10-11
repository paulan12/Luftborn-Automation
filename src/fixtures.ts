import { test as base, expect } from '@playwright/test';
import { registerPopupHandlers } from './utils/popupHandlers';
import { HomePage } from './pages/HomePage';

export const test = base.extend<{ homePage: HomePage }>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  page: async ({ page }, use) => {
    await registerPopupHandlers(page);
    await use(page);
  },
});
export { expect };
