import { test, expect } from '@playwright/test';
import { PAGES } from './site';
import { settle } from './helpers';

// At 320 CSS pixels wide (a phone, or a desktop browser zoomed to 400%), no page may scroll
// sideways (WCAG 1.4.10). A failure names the elements that stick out past the right edge.

test.describe('at 320px wide', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const path of PAGES) {
    test(`${path} doesn't scroll sideways`, async ({ page }) => {
      await page.goto(path);
      await settle(page);
      const { scrollWidth, clientWidth, wide } = await page.evaluate(() => {
        const root = document.documentElement;
        const wide: string[] = [];
        for (const el of Array.from(document.body.querySelectorAll('*'))) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.right <= root.clientWidth + 1) continue;
          // Report the outermost element that sticks out, not every child inside it.
          if (el.parentElement && el.parentElement.getBoundingClientRect().right > root.clientWidth + 1) continue;
          const id = el.id ? `#${el.id}` : '';
          const cls = typeof el.className === 'string' && el.className.trim() ? `.${el.className.trim().split(/\s+/).join('.')}` : '';
          wide.push(`<${el.tagName.toLowerCase()}${id}${cls}> reaches ${Math.round(r.right)}px`);
        }
        return { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth, wide: wide.slice(0, 10) };
      });
      expect(scrollWidth, `${path} is ${scrollWidth}px wide in a ${clientWidth}px window:\n${wide.join('\n')}`).toBeLessThanOrEqual(clientWidth);
    });
  }
});
