import { expect, type Page } from '@playwright/test';

// What the accessibility tests cover. Adding a page or a state is one line here; the specs read
// these lists and never hard-code paths.

/** Every page, as a path relative to baseURL. Include a missing URL so the 404 page is scanned. */
export const PAGES: string[] = [
  '/',
  '/about.html',
  '/contact.html',
  '/this-page-does-not-exist',
];

export type Variant = {
  /** Shown in test names and reports. */
  name: string;
  /** What the browser reports for prefers-color-scheme. */
  colorScheme: 'light' | 'dark';
  /** Runs before the page loads, e.g. page.addInitScript to seed a stored theme choice. */
  beforeLoad?: (page: Page) => Promise<unknown>;
  /** Runs after the page loads, e.g. setting a data attribute the way the site's switch does. */
  afterLoad?: (page: Page) => Promise<unknown>;
};

/** Every theme or color variant. Contrast differs in each, so every page is scanned in every one. */
export const VARIANTS: Variant[] = [
  { name: 'light', colorScheme: 'light' },
  { name: 'dark', colorScheme: 'dark' },
  // The theme switch stores its choice and app.js sets <html data-theme> from it on load.
  {
    name: 'dark (switch)',
    colorScheme: 'light',
    beforeLoad: (page) => page.addInitScript(() => localStorage.setItem('theme', 'dark')),
  },
];

export type UIState = {
  /** Shown in test names, e.g. 'main menu open'. */
  name: string;
  /** The page the state is on. */
  path: string;
  /** Runs before the page loads, e.g. seeding localStorage for a returning visitor. */
  beforeLoad?: (page: Page) => Promise<unknown>;
  /** Opens the state, and ends by waiting until it is fully shown. */
  open: (page: Page) => Promise<unknown>;
};

/**
 * Everything that changes what is on screen without a new URL: menus, dialogs, drawers, tabs,
 * filters, errors.
 */
export const STATES: UIState[] = [
  {
    name: 'main menu open on a phone',
    path: '/',
    open: async (page) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.getByRole('button', { name: 'Menu' }).click();
      await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
    },
  },
  {
    name: 'subscribe dialog open',
    path: '/',
    open: async (page) => {
      await page.getByRole('button', { name: 'Subscribe' }).click();
      await expect(page.getByRole('dialog', { name: 'Subscribe' })).toBeVisible();
    },
  },
  {
    name: 'contact form sent empty',
    path: '/contact.html',
    open: async (page) => {
      await page.getByRole('button', { name: 'Send' }).click();
      await expect(page.getByRole('textbox', { name: 'Name' })).toBeFocused();
    },
  },
];

/** axe rule tags: WCAG 2.0, 2.1 and 2.2, levels A and AA. */
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/**
 * Parts of the page the site doesn't control (a third-party map, video or chat iframe), as CSS
 * selectors. Each one is untested: say why next to it, and tell the owner.
 */
export const EXCLUDE: string[] = [];
