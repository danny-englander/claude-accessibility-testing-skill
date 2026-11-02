import { test, expect, type Page } from '@playwright/test';

// A button that shows and hides a menu or navigation (the disclosure pattern): it says whether
// it is open, works from the keyboard, and Escape closes it and puts focus back on the button.
// Replace the names, the path and the viewport with the site's own.

const PATH = '/';
const menuButton = (page: Page) => page.getByRole('button', { name: 'Menu' });
const menu = (page: Page) => page.getByRole('navigation', { name: 'Main' });

// Delete this if the button shows at every width.
test.use({ viewport: { width: 375, height: 812 } });

test('the menu button says whether the menu is open', async ({ page }) => {
  await page.goto(PATH);
  await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(menu(page)).toBeHidden();
  await menuButton(page).click();
  await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(menu(page)).toBeVisible();
});

test('Enter opens the menu and the next Tab goes into it', async ({ page }) => {
  await page.goto(PATH);
  await menuButton(page).focus();
  await page.keyboard.press('Enter');
  await expect(menu(page)).toBeVisible();
  await page.keyboard.press('Tab');
  const inMenu = await menu(page).evaluate((nav) => nav.contains(document.activeElement));
  expect(inMenu, 'the Tab after opening the menu should land inside it').toBe(true);
});

test('Escape closes the menu and puts focus back on its button', async ({ page }) => {
  await page.goto(PATH);
  await menuButton(page).click();
  await expect(menu(page)).toBeVisible();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Escape');
  await expect(menu(page)).toBeHidden();
  await expect(menuButton(page)).toBeFocused();
  await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
});
