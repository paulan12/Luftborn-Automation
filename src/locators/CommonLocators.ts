import { Locator, Page } from '@playwright/test';

export class CommonLocators {
  readonly errorPageMessage: Locator;
  readonly botChallengeHeading: Locator;
  constructor(page: Page) {
    this.errorPageMessage = page.getByText('Something went wrong on our end');
    this.botChallengeHeading = page.getByText('Pardon Our Interruption');
  }
}
