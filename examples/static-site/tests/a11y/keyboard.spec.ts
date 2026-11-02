import { test, expect, type Page } from '@playwright/test';
import { PAGES, VARIANTS } from './site';
import { open, settle } from './helpers';

// Tabs through every page in every theme, and fails when focus lands on something hidden, off
// screen or covered (by a sticky header, say), or when focusing an element changes nothing on
// screen, so a keyboard user can't see where they are (WCAG 2.4.7, 2.4.11).
//
// The focus check compares a screenshot of the element and its surroundings, focused and not.
// Any change counts, so a background or underline change passes as well as an outline; whether
// that change is clear enough is left to the manual checks.

const MAX_STOPS = 60;
// The area compared around each element, so an outline drawn outside it is caught.
const PAD = 6;

type Stop = {
  key: string;
  label: string;
  region: { x: number; y: number; width: number; height: number } | null;
  problem: string | null;
};

/** Describe the focused element and check that it can be seen. Null when focus has left the page. */
async function inspectFocus(page: Page): Promise<Stop | null> {
  return page.evaluate((pad) => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body || el === document.documentElement) return null;

    const id = el.id ? `#${el.id}` : '';
    const cls = typeof el.className === 'string' && el.className.trim() ? `.${el.className.trim().split(/\s+/).join('.')}` : '';
    const name = (el.getAttribute('aria-label') || el.textContent || (el as HTMLInputElement).value || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 40);
    const label = `<${el.tagName.toLowerCase()}${id}${cls}>${name ? ` "${name}"` : ''}`;
    const path: string[] = [];
    for (let n: Element | null = el; n && n !== document.body; n = n.parentElement) {
      path.unshift(`${n.tagName}:${Array.prototype.indexOf.call(n.parentElement?.children ?? [], n)}`);
    }

    // A tiny element (a visually hidden checkbox styled through its label) shows its focus on its
    // parent, so check that instead.
    let owner: HTMLElement = el;
    let rect = el.getBoundingClientRect();
    if ((rect.width < 4 || rect.height < 4) && el.parentElement) {
      owner = el.parentElement;
      rect = owner.getBoundingClientRect();
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let problem: string | null = null;
    if (!owner.checkVisibility({ visibilityProperty: true }) || rect.width === 0 || rect.height === 0) {
      problem = 'focus is on something hidden';
    } else if (rect.bottom <= 0 || rect.right <= 0 || rect.top >= vh || rect.left >= vw) {
      problem = 'focus is off screen';
    } else {
      const x = Math.min(Math.max(rect.left + rect.width / 2, 0), vw - 1);
      const y = Math.min(Math.max(rect.top + rect.height / 2, 0), vh - 1);
      const hit = document.elementFromPoint(x, y);
      const related = hit && (owner.contains(hit) || hit.contains(owner) || Array.from((el as HTMLInputElement).labels ?? []).some((l) => l.contains(hit)));
      if (hit && !related) {
        const hitClass = typeof hit.className === 'string' && hit.className.trim() ? `.${hit.className.trim().split(/\s+/)[0]}` : '';
        problem = `focus is covered by <${hit.tagName.toLowerCase()}${hit.id ? `#${hit.id}` : hitClass}> (in ${hit.closest('header, nav, aside, footer, [role="dialog"], dialog')?.tagName.toLowerCase() ?? 'the page'})`;
      }
    }

    const left = Math.max(rect.left - pad, 0);
    const top = Math.max(rect.top - pad, 0);
    const region = {
      x: left,
      y: top,
      width: Math.min(rect.right + pad, vw) - left,
      height: Math.min(rect.bottom + pad, vh) - top,
    };
    return { key: path.join('/'), label, region: region.width > 0 && region.height > 0 ? region : null, problem };
  }, PAD);
}

/** True when the element looks different focused and blurred. Leaves it focused. */
async function focusIsVisible(page: Page, region: NonNullable<Stop['region']>) {
  const focused = await page.screenshot({ clip: region, animations: 'disabled' });
  await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    (window as unknown as { __a11yFocused: HTMLElement }).__a11yFocused = el;
    el.blur();
  });
  const blurred = await page.screenshot({ clip: region, animations: 'disabled' });
  // Focus it again so the next Tab carries on from here.
  await page.evaluate(() => (window as unknown as { __a11yFocused: HTMLElement }).__a11yFocused.focus());
  return !focused.equals(blurred);
}

for (const variant of VARIANTS) {
  test.describe(variant.name, () => {
    test.use({ colorScheme: variant.colorScheme });

    for (const path of PAGES) {
      test(`${path}: every Tab stop is visible and shows focus`, async ({ page }) => {
        await open(page, path, variant);
        await settle(page);

        const seen = new Set<string>();
        const problems: string[] = [];
        for (let i = 0; i < MAX_STOPS; i++) {
          await page.keyboard.press('Tab');
          await settle(page);
          const stop = await inspectFocus(page);
          // Done when focus leaves the page or comes back round to the first stop.
          if (!stop || seen.has(stop.key)) break;
          seen.add(stop.key);

          if (stop.problem) problems.push(`${i + 1}. ${stop.label}: ${stop.problem}`);
          else if (stop.region && !(await focusIsVisible(page, stop.region))) {
            problems.push(`${i + 1}. ${stop.label}: no visible change when focused (add a :focus-visible style)`);
          }
        }

        expect(problems.length, `Tab stops with problems on ${path} (${variant.name}):\n${problems.join('\n')}`).toBe(0);
      });
    }
  });
}
