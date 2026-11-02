---
name: a11y-tests
description: Sets up free, local accessibility tests for any web project with Playwright and axe-core. Scans every page and UI state (menus, dialogs, drawers, tabs, filters) in every theme, and adds keyboard and focus tests, a 320px reflow test, a readable violation report and a manual checklist. No account, API key or MCP server. Use when the user asks to add accessibility or a11y tests, axe or WCAG checks, contrast checks in dark mode, or accessibility tests in CI.
---

# Local accessibility tests with Playwright and axe

This skill adds a test suite that runs on the developer's machine and in CI. It needs only two dev dependencies, `@playwright/test` and `@axe-core/playwright`. Nothing is sent anywhere and no account or key is needed.

When it is done, the project has:

- a Playwright config that builds the site, serves the production build on a port of its own, and turns on Reduce Motion;
- `tests/a11y/site.ts`, the one file listing the pages, themes and UI states to test;
- `axe.spec.ts`, which runs axe on every page and every UI state in every theme, and prints each violation with its rule, elements and fix;
- `keyboard.spec.ts`, which tabs through every page and fails when focus lands on something hidden or covered, or shows no visible change;
- `reflow.spec.ts`, which fails when a page scrolls sideways at 320px wide (WCAG 1.4.10);
- the keyboard pattern tests that match the site (skip link, menu button, dialog, tabs);
- `A11Y-MANUAL-CHECKS.md`, for what automated tests can't see.

The templates are in `templates/` next to this file, and a page finder is in `scripts/`. Copy the templates, then fill them in; don't write the tests from scratch.

## 0. Before running anything

- **Node version.** Look for `.nvmrc`, `.node-version`, `.tool-versions` or `engines.node` in `package.json`, in the project folder or its parents. Use the version it names (`nvm use`, or put `$HOME/.nvm/versions/node/<version>/bin` first on the PATH). Don't rely on whichever Node the shell has. Playwright needs Node 18 or later.
- **Package manager.** Use the one the lockfile names: `package-lock.json` (npm), `pnpm-lock.yaml`, `yarn.lock` or `bun.lock`/`bun.lockb`. The commands below use npm; translate them.
- **Existing Playwright setup.** If there is already a `playwright.config.*`, don't overwrite it. Write the template as `playwright.a11y.config.ts` and run it with `playwright test -c playwright.a11y.config.ts`. Its `testDir` is `tests/a11y`, so the two suites stay apart.
- **No `package.json`** (a plain HTML site, or Hugo or Jekyll): run `npm init -y` for the test dependencies, and ask the owner first.

## 1. Survey the site

Find these four things before writing any test. Then show the owner a short summary (pages, themes, states, how it is served) and continue unless they correct it.

### How to build and serve it

Tests run against the production build, as visitors get it. A dev server can reload mid-test and doesn't match production. Pick the command from the framework:

| Site | `webServer.command` |
| --- | --- |
| Astro | `npx astro build && npx astro preview --port ${PORT}` |
| Vite (React, Vue, Svelte, Solid, vanilla), SvelteKit | `npx vite build && npx vite preview --port ${PORT} --strictPort` |
| Next.js | `npx next build && npx next start -p ${PORT}` (with `output: 'export'`: serve `out/` as a static folder) |
| Nuxt | `npx nuxi build && npx nuxi preview --port ${PORT}` |
| Remix / React Router | its `build` script, then `npx react-router-serve ./build/server/index.js` with `PORT=${PORT}` |
| Gatsby | `npx gatsby build && npx gatsby serve -p ${PORT}` |
| Static output (Eleventy `_site`, Hugo `public`, Jekyll `_site`, plain HTML) | the build command, then `npx http-server <folder> -p ${PORT} -s` (add `http-server` as a dev dependency) |
| A server app (Rails, Django, Laravel, Express) | its production-mode start command on `${PORT}`, with seed data. Ask the owner how they run it locally. |

Use the project's own `build` script when it has one (`npm run build && …`), so the tests build the site the way it is deployed.

**Pick a port of its own**, well away from dev server defaults (3000, 4321, 5173, 8080), for example 4390–4399 or 5390–5399. Check that nothing uses it (`lsof -i :<port>`). Dev servers move up one port when theirs is busy, so a port near a default can end up serving a different site, and the tests then pass against the wrong one. Keep `reuseExistingServer: false`, so a busy port fails loudly instead.

### The pages

Every page goes in `PAGES`, as a path relative to `baseURL`.

- **Built output or sitemap:** build the site, then run `node <this skill>/scripts/find-pages.mjs <build folder>` (every `.html` file) or `… find-pages.mjs <path or URL of sitemap.xml>`. It prints a JSON array of paths.
- **A single-page app or server app:** read the router (`app/`, `pages/`, `src/routes/`, `routes.rb`, `urls.py`, a `createBrowserRouter` call). Give each dynamic route a real example (`/blog/<an existing slug>`).
- **Many pages from one template** (hundreds of posts or products): scan every one if the run stays under a few minutes. Otherwise take the first, the last, and the ones with unusual content (code blocks, tables, embeds, very long titles, no image). Tell the owner which you left out.
- **The 404 page:** add a path that doesn't exist, such as `/this-page-does-not-exist`.

### The themes and other color variants

Contrast is different in every theme, so every page is scanned in each one. Find how the site switches:

- `@media (prefers-color-scheme: dark)` in the CSS: the `dark` variant (`colorScheme: 'dark'`) covers it.
- A class or attribute on `<html>` or `<body>` (`.dark`, `data-theme`, `data-mode`): find the toggle's code. If the site restores the choice from storage on load, use `beforeLoad` to seed it (`localStorage.setItem('theme', 'dark')`), so the site applies it in its own way. Otherwise set the attribute in `afterLoad`.
- Other variants that change colors: accents, brands or tenants, high-contrast modes, seasonal themes. Add one variant for each.

Search for the switch with: `grep -rnE "prefers-color-scheme|data-theme|data-mode|classList\.(add|toggle)\(['\"]dark|colorScheme|setTheme" --include=*.{css,scss,js,ts,jsx,tsx,vue,svelte,astro,html} .` (skip `node_modules` and the build folder).

### The UI states

A state is anything that changes what is on screen without a new URL: open menus, dialogs, drawers, dropdowns, popovers and tooltips, each tab of a tab set, open accordions, filtered or sorted lists, empty states, form validation errors, toasts, cookie banners, and signed-in or returning-visitor views. axe only sees what is rendered, so a closed menu is never checked until a test opens it.

Find them with: `grep -rnE "aria-expanded|aria-controls|role=\"(dialog|tab|tablist|menu|alert|status)\"|<dialog|<details|popover|showModal|aria-live|localStorage" …` and by reading the components. Each state needs:

- the page it is on;
- how to open it: a role-locator click (`page.getByRole('button', { name: 'Menu' })`), a URL hash or query (`/#contact`, `?category=books`), or data seeded in `beforeLoad` (`localStorage`, cookies);
- what to wait for, so the scan happens when it is open (`await expect(dialog).toBeVisible()`);
- a viewport, if it only exists on phones (`await page.setViewportSize({ width: 375, height: 812 })` before opening).

Validation errors count: submit an empty required form and scan the result.

## 2. Install

```bash
npm install --save-dev @playwright/test @axe-core/playwright @types/node
npx playwright install chromium
```

Add a script: `"test:a11y": "playwright test"` (or `playwright test -c playwright.a11y.config.ts`). If the project has no other test script, `"test"` can run it too. Add `test-results/` and `playwright-report/` to `.gitignore`.

## 3. Copy the templates and fill them in

| Template | Copy to |
| --- | --- |
| `templates/playwright.config.ts` | `playwright.config.ts` (or `playwright.a11y.config.ts`) |
| `templates/tests/a11y/site.ts`, `helpers.ts`, `axe.spec.ts`, `keyboard.spec.ts`, `reflow.spec.ts` | `tests/a11y/` |
| `templates/tests/a11y/patterns/*.spec.ts` | `tests/a11y/`, **only** the ones for components the site has |
| `templates/A11Y-MANUAL-CHECKS.md` | the project root, or its docs folder |

Then:

1. In the config, set `PORT` and `webServer.command`. Change nothing else without a reason.
2. In `site.ts`, fill in `PAGES`, `VARIANTS` and `STATES` from the survey. Only `EXCLUDE` should stay empty, unless there is a third-party embed (see step 4).
3. In each pattern test, replace the placeholder names and paths with the site's real ones. Keep the role locators (`getByRole('button', { name: … })`): a passing test then also proves the accessible name is right. If a role locator can't find a control, that is usually the bug. Report it rather than falling back to a CSS selector.
4. If the project uses TypeScript checks or a linter that covers `tests/`, run them.

## 4. Run it and read the report

```bash
npm run test:a11y
```

A failing axe test prints one block per page:

```
2 accessibility violations on http://localhost:4398/about (dark)

[serious] color-contrast: Elements must meet minimum color contrast ratio thresholds
  https://dequeuniversity.com/rules/axe/4.11/color-contrast
  - .card > p.meta   <p class="meta">Updated 3 days ago</p>
      Element has insufficient color contrast of 3.1 (foreground color: #6b6b6b, background color: #161616, …)
```

Then:

- **Fix the site, not the test.** Each violation is a real problem for someone. Fix it in the site's own code (a token, a component, the markup), then run again.
- **Group the fixes.** One token often causes dozens of contrast failures. Fix the cause and run the whole suite again before working through elements one at a time.
- **Don't suppress rules to get a green run.** Don't use `disableRules`, `test.skip`, or a lower tag set. If something truly can't be fixed now, ask the owner, then record it in `EXCLUDE` or a narrowly scoped `disableRules`, with a comment saying why and who decided.
- **`EXCLUDE` is for parts the site doesn't control**, such as a third-party iframe (a map, a video, a chat widget). List those to the owner as untested.
- **Contrast failures on text that should pass.** Usually the scan caught a fade-in. The config turns on Reduce Motion and `settle()` waits for running animations. If it still happens, the site's animations ignore `prefers-reduced-motion`. That is a finding: report it and fix it in the site's CSS.
- **"Needs review" items** (axe's `incomplete`, such as text over images or gradients) don't fail a test. They are attached to the test result as `axe-needs-review.json`. List them for the manual checks.
- **Keyboard test failures** name the element by role, name and selector. "No visible focus change" means the element needs a `:focus-visible` style. "Hidden or covered" means a sticky header, a closed menu still in the tab order, or an off-screen element that should be `inert` or `hidden`.
- Open `npx playwright show-report` for traces of failed tests.

Done means every test passes, with any exclusions approved by the owner and listed.

## 5. CI (ask first)

Offer to add a CI job. For GitHub Actions:

```yaml
name: Accessibility
on: [push, pull_request]
jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc   # or node-version: 22
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:a11y
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report
```

## 6. Tell the owner what's covered

Finish with a short summary:

- the number of pages, variants and states, and so the number of scans;
- what was fixed, and what is excluded or left for later, with reasons;
- what axe can't judge (reading order, whether alt text is meaningful, screen reader announcements, zoom), which is the manual checklist's job;
- how to run it: `npm run test:a11y`, and how to add a page or state (one line in `tests/a11y/site.ts`).

## Rules

- Never point the tests at a dev server or a port another site might use. Never set `reuseExistingServer: true`.
- Test the production build.
- Every page and every state, in every variant. One page per template is the fallback for huge sites, not the default.
- Role locators for controls in behavior tests, CSS selectors only for structure that has no role.
- Keep all page, variant and state lists in `site.ts`. Specs shouldn't hard-code paths.
- Don't change the site's content or remove features to make a test pass. Raise conflicts with the owner.
- This suite catches a lot, but not everything. Don't call a site "accessible" or "WCAG compliant" because it passes. Say it passes these automated checks.
