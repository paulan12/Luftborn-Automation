import { test as base, expect } from '@playwright/test';
import { registerPopupHandlers } from './utils/popupHandlers';

export const test = base.extend({
  page: async ({ page }, use) => {
    await registerPopupHandlers(page);
    await use(page);
  },
});
export { expect };
