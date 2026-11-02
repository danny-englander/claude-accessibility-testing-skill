import { expect, type Page, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { EXCLUDE, WCAG_TAGS, type Variant } from './site';

// axe-core's types, taken from AxeBuilder so axe-core needn't be a direct dependency.
type AxeResults = Awaited<ReturnType<AxeBuilder['analyze']>>;
type Result = AxeResults['violations'][number];

/** Open a page in a variant. */
export async function open(page: Page, path: string, variant: Variant) {
  await variant.beforeLoad?.(page);
  await page.goto(path);
  await variant.afterLoad?.(page);
}

/**
 * Wait until web fonts have loaded and running animations and transitions have finished, so a
 * scan sees the page at rest. Endless animations (spinners) are ignored, and the wait gives up
 * after five seconds.
 */
export async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const finite = document
      .getAnimations()
      .filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().iterations !== Infinity);
    await Promise.race([
      Promise.all(finite.map((a) => a.finished.catch(() => {}))),
      new Promise((resolve) => setTimeout(resolve, 5_000)),
    ]);
  });
}

/** Run axe on the page as it is now, and fail with a readable report if anything is wrong. */
export async function scan(page: Page, testInfo: TestInfo, label: string) {
  let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  for (const selector of EXCLUDE) builder = builder.exclude(selector);
  const results = await builder.analyze();

  // Things axe couldn't decide (text over an image, say) don't fail the test; keep them for the
  // manual checks.
  if (results.incomplete.length) {
    await testInfo.attach('axe-needs-review.json', {
      body: JSON.stringify(summarize(results.incomplete), null, 2),
      contentType: 'application/json',
    });
  }
  if (results.violations.length) {
    await testInfo.attach('axe-violations.json', {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json',
    });
  }
  expect(results.violations.length, report(results, label)).toBe(0);
}

const IMPACT_ORDER = ['critical', 'serious', 'moderate', 'minor'];
const MAX_NODES = 10;

/** One block per rule, worst first, each element with axe's reason. */
function report(results: AxeResults, label: string) {
  const violations = [...results.violations].sort(
    (a, b) => IMPACT_ORDER.indexOf(a.impact ?? 'minor') - IMPACT_ORDER.indexOf(b.impact ?? 'minor'),
  );
  const count = violations.length;
  const head = `${count} accessibility violation${count === 1 ? '' : 's'} on ${results.url} (${label})`;
  const blocks = violations.map((v) => {
    const nodes = v.nodes.slice(0, MAX_NODES).map((n) => {
      const html = n.html.replace(/\s+/g, ' ').slice(0, 100);
      const why = (n.failureSummary ?? '')
        .split('\n')
        .filter((line) => line && !/^Fix (any|all) of the following:$/.test(line.trim()))
        .map((line) => `      ${line.trim()}`)
        .join('\n');
      return `  - ${n.target.join(' ')}   ${html}\n${why}`;
    });
    if (v.nodes.length > MAX_NODES) nodes.push(`  … and ${v.nodes.length - MAX_NODES} more`);
    return `[${v.impact}] ${v.id}: ${v.help}\n  ${v.helpUrl}\n${nodes.join('\n')}`;
  });
  return [head, ...blocks].join('\n\n');
}

function summarize(results: Result[]) {
  return results.map((r) => ({ rule: r.id, help: r.help, elements: r.nodes.map((n) => n.target.join(' ')) }));
}
