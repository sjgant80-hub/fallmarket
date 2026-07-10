#!/usr/bin/env node
/**
 * update-counts.mjs · syncs hardcoded numbers across HTML/txt/md files with live listings.json.
 * Also adds "Powered by Konomi Architecture · Substrate 0" attribution to page footers.
 *
 * Run after every catalog regeneration · called by nightly workflow.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const HOME = process.env.USERPROFILE || process.env.HOME;
const FM = join(HOME, 'Downloads', 'fallmarket');
const catalog = JSON.parse(readFileSync(join(FM, 'listings.json'), 'utf-8'));
const total = catalog.total;
const { sdk = 0, mcp = 0, api = 0, tool = 0 } = catalog.by_kind;

console.log(`update-counts · total=${total} · sdk=${sdk} mcp=${mcp} api=${api} tool=${tool}`);

const HARDCODED = [763, 766, 902, 945, 700]; // known past values

const KONOMI_LINE = 'Powered by <a href="https://github.com/sjgant80-hub/konomi">Konomi Architecture</a> · Substrate 0 · Thomas Frumkin';
const KONOMI_MARKER = '<!-- KONOMI-POWERED-BY -->';

function processFile(path) {
  if (!path.endsWith('.html') && !path.endsWith('.md') && !path.endsWith('.txt') && !path.endsWith('.json')) return false;
  let content = readFileSync(path, 'utf-8');
  const orig = content;

  // 1. Replace hardcoded numbers with live total (context-safe: only in listing-count phrases)
  for (const n of HARDCODED) {
    if (n === total) continue;
    // Only replace in specific phrases · avoids collateral damage in other contexts
    const patterns = [
      new RegExp(`${n} listings`, 'g'),
      new RegExp(`${n} sovereign`, 'g'),
      new RegExp(`${n}\\+ tools`, 'g'),
      new RegExp(`Search ${n}\\+`, 'g'),
      new RegExp(`${n} offerings`, 'g'),
      new RegExp(`${n} MIT`, 'g'),
      new RegExp(`${n} · MIT`, 'g'),
      new RegExp(`${n} agent-callable`, 'g')
    ];
    for (const p of patterns) {
      content = content.replace(p, (m) => m.replace(String(n), String(total)));
    }
  }

  // 2. Inject Powered by Konomi into HTML footer if not already present
  if (path.endsWith('.html')) {
    if (!content.includes(KONOMI_MARKER) && content.includes('</footer>')) {
      content = content.replace('</footer>', `<div class="konomi-attribution" style="text-align:center;padding:0.75rem 0;font-size:11px;color:var(--dim);border-top:1px solid var(--border);">${KONOMI_MARKER}${KONOMI_LINE}</div>\n</footer>`);
    }
  }

  if (content !== orig) {
    writeFileSync(path, content);
    return true;
  }
  return false;
}

function walk(dir, skip = new Set(['node_modules', '.git'])) {
  const files = [];
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) files.push(...walk(p, skip));
    else files.push(p);
  }
  return files;
}

let changed = 0;
for (const f of walk(FM)) {
  if (processFile(f)) { changed++; console.log('  ✓ ' + f.replace(FM, '')); }
}
console.log(`\ndone · ${changed} files updated`);
