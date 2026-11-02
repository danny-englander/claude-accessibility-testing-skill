# a11y-tests: a Claude Code skill for local accessibility tests

A [Claude Code skill](https://docs.claude.com/en/docs/claude-code/skills) that sets up accessibility tests for any web project with [Playwright](https://playwright.dev) and [axe-core](https://github.com/dequelabs/axe-core). Everything runs on your machine or in your CI. There is no account, API key or MCP server, and nothing to pay for.

Ask Claude to "add accessibility tests to this site" and the skill:

- **finds every page** (from the build output, a sitemap or the router) and **every UI state** that changes what is on screen: open menus, dialogs, drawers, tabs, filters, form errors;
- **finds every theme**: `prefers-color-scheme`, a `.dark` class or `data-theme` switch, accents and other color variants;
- **scans every page and state in every theme** with axe (WCAG 2.2 A and AA), with Reduce Motion on and animations finished first, so text mid-fade isn't reported as low contrast;
- **builds and serves the production site** from the Playwright config, on a port of its own;
- **prints a readable report**: each broken rule, worst first, with the elements, axe's reason and a link to the fix;
- adds **keyboard tests**: every Tab stop is visible, not covered and shows a focus change, plus the skip link, menu button, dialog and tab patterns, written with role locators;
- adds a **320px reflow test** (no sideways scrolling);
- leaves a **manual checklist** for what a machine can't judge.

## Install

Copy the `a11y-tests` folder into your skills folder, for all your projects:

```bash
git clone https://github.com/danny-englander/claude-accessibility-testing-skill.git /tmp/a11y-tests-skill && cp -r /tmp/a11y-tests-skill/a11y-tests ~/.claude/skills/
```

or into one project's `.claude/skills/`. Then, in that project, ask Claude to add accessibility tests, or run `/a11y-tests`.

## What it adds to a project

```
playwright.config.ts          builds and serves the site; Reduce Motion on
tests/a11y/site.ts            the pages, themes and UI states to test (the only file to edit)
tests/a11y/helpers.ts         open, settle, scan and the report
tests/a11y/axe.spec.ts        axe on every page and state, in every theme
tests/a11y/keyboard.spec.ts   every Tab stop visible, uncovered and showing focus
tests/a11y/reflow.spec.ts     no sideways scrolling at 320px
tests/a11y/*.spec.ts          the keyboard patterns the site uses
A11Y-MANUAL-CHECKS.md         the checklist for people
```

Run it with `npm run test:a11y`.

## Example

`examples/static-site` is a small static site with the suite set up by the skill: 4 pages and 3 UI states in 3 themes (light, dark from the system, and dark from the site's own switch), 47 tests in about 6 seconds. As first written, the site had a dark-theme contrast failure and a 404 page with no skip link. Both were found and fixed.

```bash
cd examples/static-site && npm install && npx playwright install chromium && npm run test:a11y
```

## What it doesn't do

Automated tests find many problems, but not all. They can't tell whether alt text is meaningful, whether the reading order makes sense, or how a screen reader announces a change. The manual checklist covers those. A passing suite means the site passes these checks, not that it is "accessible" or "WCAG compliant".

## License

MIT. See [LICENSE](LICENSE).
