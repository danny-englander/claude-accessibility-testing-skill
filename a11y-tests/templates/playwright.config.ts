import { defineConfig, devices } from '@playwright/test';

// Accessibility tests: axe scans plus keyboard and reflow checks (tests/a11y). Run with
// `npm run test:a11y`. The pages, themes and UI states they cover are listed in tests/a11y/site.ts.

// An uncommon port of the tests' own. Dev servers move up one port when theirs is busy, so a port
// near a dev server's default can end up serving a different site. Tests use relative URLs; this
// is the only place the port appears.
const PORT = 4398;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/a11y',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL,
    // Sites that respect this setting skip their fades and slides, so a scan never catches text
    // mid-fade (which axe reads as low contrast) or a menu halfway open.
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Build the site and serve the production build, as visitors get it. Never reuse a server that
  // is already on the port: it may be a stale build or another site, so a clash fails loudly.
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
