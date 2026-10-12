import { test } from '@playwright/test';

/**
 * Keep diagnostics in the HTML report; only car counts go to the console.
 */
export const logger = {
  info(message: string): void {
    try {
      test.info().annotations.push({ type: 'info', description: message });
    } catch {
      // No report is available outside a running test.
    }
  },
  warn(message: string): void {
    try {
      test.info().annotations.push({ type: 'warning', description: message });
    } catch {
      // No report is available outside a running test.
    }
  },
  carCount(count: number): void {
    console.log(count);
  },
};
