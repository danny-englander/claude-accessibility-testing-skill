import { test, expect } from '@playwright/test';

// A tab set (role="tablist"): the tabs are one Tab stop, the arrow keys, Home and End move
// between them, and the selected tab shows its panel. Replace the names and the path with the
// site's own. For tabs that change on click only and are each their own Tab stop, delete the
// arrow-key tests: that pattern is fine too, but then it shouldn't use role="tab".

const PATH = '/';
const TAB_NAMES = ['Overview', 'Details', 'Reviews'];

test('arrow keys, Home and End move between tabs and select them', async ({ page }) => {
  await page.goto(PATH);
  const tabs = TAB_NAMES.map((name) => page.getByRole('tab', { name }));
  await tabs[0].focus();
  await expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

  await page.keyboard.press('ArrowRight');
  await expect(tabs[1]).toBeFocused();
  await expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: TAB_NAMES[1] })).toBeVisible();

  await page.keyboard.press('End');
  await expect(tabs.at(-1)!).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(tabs[0]).toBeFocused(); // wraps round
  await page.keyboard.press('ArrowLeft');
  await expect(tabs.at(-1)!).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tabs[0]).toBeFocused();
});

test('the tabs are one Tab stop, and Tab goes on into the panel', async ({ page }) => {
  await page.goto(PATH);
  await page.getByRole('tab', { name: TAB_NAMES[0] }).focus();
  await page.keyboard.press('Tab');
  const where = await page.evaluate(() => document.activeElement?.closest('[role="tab"], [role="tabpanel"]')?.getAttribute('role'));
  expect(where, 'Tab from the selected tab should go into its panel, not to the next tab').toBe('tabpanel');
});
