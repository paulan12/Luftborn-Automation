import { test } from '@playwright/test';

/**
 * Logs to the console and records the message as an annotation on the running test,
 * so it also shows up in the HTML execution report.
 */
export const logger = {
  info(message: string): void {
    console.log(`[INFO] ${new Date().toISOString()} ${message}`);
    try {
      test.info().annotations.push({ type: 'info', description: message });
    } catch {
      // Called outside a running test: console output only.
    }
  },
  warn(message: string): void {
    console.warn(`[WARN] ${new Date().toISOString()} ${message}`);
    try {
      test.info().annotations.push({ type: 'warning', description: message });
    } catch {
      // Called outside a running test: console output only.
    }
  },
};
