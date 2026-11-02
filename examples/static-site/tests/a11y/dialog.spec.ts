import { test, expect, type Page } from '@playwright/test';

// A modal dialog: focus moves into it on open, Tab can't reach the page behind it, Escape closes
// it, and focus goes back to the button that opened it. Replace the names and the path with the
// site's own.

const PATH = '/';
const opener = (page: Page) => page.getByRole('button', { name: 'Subscribe' });
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Subscribe' });

test('opening the dialog moves focus into it', async ({ page }) => {
  await page.goto(PATH);
  await opener(page).click();
  await expect(dialog(page)).toBeVisible();
  const inside = await dialog(page).evaluate((d) => d.contains(document.activeElement));
  expect(inside, 'focus should move into the dialog when it opens').toBe(true);
});

test("Tab and Shift+Tab can't reach the page behind the open dialog", async ({ page }) => {
  await page.goto(PATH);
  await opener(page).click();
  await expect(dialog(page)).toBeVisible();
  for (const key of [...Array(15).fill('Tab'), ...Array(15).fill('Shift+Tab')]) {
    await page.keyboard.press(key);
    // A native <dialog> lets Tab go on to the browser's own controls (focus is then on <body>),
    // which is fine; the page behind it is not.
    const allowed = await dialog(page).evaluate(
      (d) => d.contains(document.activeElement) || !document.activeElement || document.activeElement === document.body,
    );
    expect(allowed, `${key} moved focus to the page behind the dialog`).toBe(true);
  }
});

test('Escape closes the dialog and puts focus back on the button that opened it', async ({ page }) => {
  await page.goto(PATH);
  await opener(page).click();
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toBeHidden();
  await expect(opener(page)).toBeFocused();
});
