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

The skill is the `a11y-tests` folder. It needs a Claude that can run commands in your project, so use it in Claude Code: the terminal, or the Code tab of the Claude desktop app.

**The easy way:** in Claude Code, ask:

> Install the a11y-tests skill from https://github.com/danny-englander/claude-accessibility-testing-skill into ~/.claude/skills

**By hand:** copy the `a11y-tests` folder into `~/.claude/skills/` (for all your projects) or into one project's `.claude/skills/`. In a terminal:

```bash
git clone https://github.com/danny-englander/claude-accessibility-testing-skill.git /tmp/a11y-tests-skill && mkdir -p ~/.claude/skills && cp -r /tmp/a11y-tests-skill/a11y-tests ~/.claude/skills/
```

Claude Code picks the skill up without a restart. To check, type `/` in the prompt box and look for `a11y-tests`, or run `/skills` in the terminal.

**From claude.ai or the Claude desktop app:**

1. Make a ZIP of the `a11y-tests` folder, so the folder itself is at the top of the ZIP: in Finder, right-click it and choose Compress, or run `zip -r a11y-tests.zip a11y-tests`.
2. Make sure Settings > Capabilities > "Code execution and file creation" is on.
3. Go to Customize > Skills, click "+", then "Create skill", then "Upload a skill", and choose the ZIP.

A skill added this way also loads in Claude Code when you sign in with the same Claude account (Claude Code 2.1.273 or later; it is listed under "claude.ai sync" in `/skills`).

## Use

In your project, ask Claude to "add accessibility tests", or type `/a11y-tests`. Claude surveys the site, shows you what it found, and then sets up and runs the tests.

## Works with

Any site Playwright can open in a browser. The skill doesn't depend on a framework: Claude reads your project to find how it is built and served, where its pages come from and how its themes switch. `SKILL.md` has the serve commands for Astro, Vite (React, Vue, Svelte, Solid), SvelteKit, Next.js, Nuxt, Remix and React Router, Gatsby, static generators (Eleventy, Hugo, Jekyll), plain HTML, and server apps such as Rails, Django and Laravel. So far it has been tried end to end on the static site in `examples/`.

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

## Badge

When the skill adds the GitHub Actions job (`.github/workflows/accessibility.yml`), you can show its result in your README. Replace `OWNER/REPO` with your repository:

```markdown
[![Accessibility tests](https://github.com/OWNER/REPO/actions/workflows/accessibility.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/accessibility.yml)
```

The badge is green while the tests pass on your default branch and red when they fail, so it can't go out of date. Claude offers it after setting up CI.

## What it doesn't do

Automated tests find many problems, but not all. They can't tell whether alt text is meaningful, whether the reading order makes sense, or how a screen reader announces a change. The manual checklist covers those. A passing suite means the site passes these checks, not that it is "accessible" or "WCAG compliant".

## License

MIT. See [LICENSE](LICENSE).
