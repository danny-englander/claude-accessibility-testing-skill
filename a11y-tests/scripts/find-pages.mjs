#!/usr/bin/env node
// Lists a site's pages as paths, for PAGES in tests/a11y/site.ts. Prints a JSON array.
//
//   node find-pages.mjs dist                                every .html file in a build folder
//   node find-pages.mjs dist/sitemap-index.xml              every <loc> in a sitemap or sitemap index
//   node find-pages.mjs https://example.com/sitemap.xml     the same, fetched
//
// With more than 30 pages it also prints a count per section to stderr, to help pick samples.

import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, relative, sep, basename } from 'node:path';

// Dependencies and test output, never pages.
const SKIP_FOLDERS = ['node_modules', '.git', 'playwright-report', 'test-results', 'coverage'];

const source = process.argv[2];
if (!source) {
  console.error('Usage: node find-pages.mjs <build folder | sitemap.xml path | sitemap URL>');
  process.exit(1);
}

const isUrl = /^https?:\/\//.test(source);
const paths = isUrl || source.endsWith('.xml') ? await fromSitemap(source) : await fromFolder(source);
const sorted = [...new Set(paths)].sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)));
console.log(JSON.stringify(sorted, null, 2));

if (sorted.length > 30) {
  const sections = new Map();
  for (const p of sorted) {
    const section = '/' + (p.split('/')[1] ?? '');
    sections.set(section, (sections.get(section) ?? 0) + 1);
  }
  console.error(`${sorted.length} pages. By section:`);
  for (const [section, n] of [...sections].sort((a, b) => b[1] - a[1])) console.error(`  ${section}  ${n}`);
}

/** Every .html file under a folder, as the path a static server gives it. */
async function fromFolder(root) {
  const found = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_FOLDERS.includes(entry.name) && !entry.name.startsWith('_')) await walk(full);
      } else if (entry.name.endsWith('.html')) {
        const rel = relative(root, full).split(sep).join('/');
        if (/^(404|500)\.html$/.test(rel)) continue; // reached through a missing URL instead
        if (rel === 'index.html') found.push('/');
        else if (rel.endsWith('/index.html')) found.push('/' + rel.slice(0, -'index.html'.length));
        else found.push('/' + rel);
      }
    }
  }
  if (!(await stat(root)).isDirectory()) throw new Error(`${root} is not a folder`);
  await walk(root);
  return found;
}

/** Every <loc> in a sitemap, following a sitemap index into its sitemaps. Returns paths. */
async function fromSitemap(location, depth = 0) {
  const xml = isUrl ? await (await fetch(location)).text() : await readFile(location, 'utf8');
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  if (/<sitemapindex/.test(xml) && depth < 3) {
    const nested = [];
    for (const loc of locs) {
      // A local sitemap index points at production URLs; read the sitemap beside it instead.
      const next = isUrl ? loc : join(dirname(location), basename(new URL(loc).pathname));
      nested.push(...(await fromSitemap(next, depth + 1)));
    }
    return nested;
  }
  return locs.map((loc) => {
    const url = new URL(loc);
    return url.pathname + url.search;
  });
}
