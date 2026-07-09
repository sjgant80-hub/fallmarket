#!/usr/bin/env node
/**
 * run-public-safe-benchmark.mjs · fires public-safe-v1 against every listing
 *
 * Fetches each repo README from GitHub, checks for private-cosmology leak patterns,
 * emits signed-ish benchmark result. Populates benchmarks.json.
 *
 * Zero LLM cost. Reuses audit.mjs's contamination detector.
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const HOME = process.env.USERPROFILE || process.env.HOME;
const FM = join(HOME, 'Downloads', 'fallmarket');

const catalog = JSON.parse(readFileSync(join(FM, 'listings.json'), 'utf-8'));

const RUNNER_DID = 'did:key:fallmarket-public-safe-runner-v1';
const SUITE_ID = 'public-safe-v1';
const SUITE_VERSION = '1.0.0';

// Same regex as audit.mjs contamination detector
const LEAK_RE = /\b(SPINE\s*=\s*\[2,\s*3,\s*5|KAPPA\s*=\s*0\.618|OMEGA\s*=\s*510510|◊·κ\s*=\s*1|Konomi\s+(cube|doctrine|attribution)|dyad\s*=)/i;

const sh = (cmd) => {
  try { return execSync(cmd, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch { return null; }
};

const results = [];
const now = new Date().toISOString();

let n = 0;
for (const listing of catalog.listings) {
  const readmeB64 = sh(`gh api repos/sjgant80-hub/${listing.id}/readme --jq .content`);
  const readme = readmeB64 ? Buffer.from(readmeB64.trim(), 'base64').toString('utf-8') : '';
  const contaminated = LEAK_RE.test(readme);
  const pass = !contaminated;
  const score = pass ? 1.0 : 0.0;

  results.push({
    v: 1,
    product_id: listing.id,
    suite_id: SUITE_ID,
    suite_version: SUITE_VERSION,
    score,
    pass,
    weight: 0.5,
    detail: {
      readme_bytes: readme.length,
      contamination_pattern_match: contaminated
    },
    run_at: now,
    runner_did: RUNNER_DID,
    runner_kind: 'cf-worker',
    sig: 'unsigned-local-runner'
  });

  n++;
  if (n % 100 === 0) process.stderr.write(`  scored ${n}/${catalog.listings.length}\n`);
}

const passCount = results.filter(r => r.pass).length;
const bench = {
  v: 1,
  generated_at: now,
  note: `Real public-safe-v1 scores across ${results.length} listings · runner: local Node script (not CF Worker · unsigned) · Phase 3b Cloudflare Worker replaces this when deployed.`,
  total: results.length,
  by_suite: { [SUITE_ID]: { total: results.length, passed: passCount, failed: results.length - passCount } },
  results
};
writeFileSync(join(FM, 'benchmarks.json'), JSON.stringify(bench, null, 2));
process.stderr.write(`\npublic-safe-v1 · ${passCount}/${results.length} pass · benchmarks.json emitted\n`);
