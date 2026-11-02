import { test, expect } from '@playwright/test';
import { PAGES } from './site';

// The first Tab stop on every page is a visible "Skip to content" link that moves focus past the
// navigation (WCAG 2.4.1). Change the name to the site's own wording.

const SKIP_LINK = /skip to (main )?content/i;

for (const path of PAGES) {
  test(`${path}: the first Tab stop skips to the main content`, async ({ page }) => {
    await page.goto(path);
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: SKIP_LINK });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();

    // Following the link moves focus to <main> (when it has tabindex="-1"), or at least moves the
    // starting point, so the next Tab lands in or after <main>, never back in the navigation.
    await page.keyboard.press('Enter');
    if (await page.evaluate(() => !!document.activeElement?.closest('main, [role="main"]'))) return;
    await page.keyboard.press('Tab');
    const pastNav = await page.evaluate(() => {
      const main = document.querySelector('main, [role="main"]');
      const el = document.activeElement;
      if (!main || !el || el === document.body) return !!main;
      return main.contains(el) || !!(main.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(pastNav, 'after the skip link, focus should be in or after <main>').toBe(true);
  });
}
