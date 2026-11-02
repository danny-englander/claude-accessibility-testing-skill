import { test } from '@playwright/test';
import { PAGES, STATES, VARIANTS } from './site';
import { open, scan, settle } from './helpers';

// Scans every page and every UI state for WCAG 2.2 A and AA problems, in every theme. A failure
// lists each broken rule, the elements that broke it and why.

for (const variant of VARIANTS) {
  test.describe(variant.name, () => {
    test.use({ colorScheme: variant.colorScheme });

    for (const path of PAGES) {
      test(`${path} has no axe violations`, async ({ page }, testInfo) => {
        await open(page, path, variant);
        await settle(page);
        await scan(page, testInfo, variant.name);
      });
    }

    for (const state of STATES) {
      test(`${state.name} has no axe violations`, async ({ page }, testInfo) => {
        await state.beforeLoad?.(page);
        await open(page, state.path, variant);
        await state.open(page);
        await settle(page);
        await scan(page, testInfo, `${variant.name}, ${state.name}`);
      });
    }
  });
}
