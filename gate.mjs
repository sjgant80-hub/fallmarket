#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════
// gate.mjs · the empirical filter, wired into fallmarket (NON-DESTRUCTIVE)
//
// Runs proof-of-play (benchmark = acg-assessor) over every listing whose repository is present
// locally, and partitions the catalog into admitted vs rejected. It writes NEW files and never
// touches listings.json — the live catalog is unchanged until someone chooses to swap it.
//
//   listings-gated.json   every listing + its Proof-of-Play (hash, verdict, admissible)
//   gate-rejected.json    the rejected listings + reasons (failed-benchmark / unresolvable)
//   gate-report.json      the summary counts
//
// Usage: node gate.mjs [--limit N]     (--limit samples the first N listings, for a quick look)
// ════════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { proveRepo, assessorRunner } from '../proof-of-play/filter.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const estate = join(here, '..');
const assess = assessorRunner(join(estate, 'acg-assessor', 'assessor.mjs'));

const limitArg = process.argv.indexOf('--limit');
const limit = limitArg >= 0 ? parseInt(process.argv[limitArg + 1], 10) : Infinity;

const raw = JSON.parse(readFileSync(join(here, 'listings.json'), 'utf8'));
const all = Array.isArray(raw) ? raw : (raw.listings || []);
const listings = limit < all.length ? all.slice(0, limit) : all;

const gated = [], rejected = [];
let done = 0;
for (const l of listings) {
  const repo = l.id || l.repo || l.name;
  const repoPath = repo ? join(estate, repo) : null;
  if (!repoPath || !existsSync(repoPath)) {
    gated.push({ ...l, proof: null, admissible: false, gate_reason: 'unresolvable' });
    rejected.push({ id: l.id, kind: l.kind, reason: 'unresolvable' });
  } else {
    let proof;
    try { proof = proveRepo(repoPath, { assess }); }
    catch (e) {
      gated.push({ ...l, proof: null, admissible: false, gate_reason: 'benchmark-error' });
      rejected.push({ id: l.id, kind: l.kind, reason: 'benchmark-error', detail: String(e.message || e).slice(0, 80) });
      done++; continue;
    }
    const badge = {
      benchmark: proof.benchmark.spec, badge: proof.verdict.badge,
      core: proof.verdict.core, nonCore: proof.verdict.nonCore, hash: proof.hash,
    };
    gated.push({ ...l, proof: badge, admissible: proof.admissible, gate_reason: proof.admissible ? 'passed' : 'failed-benchmark' });
    if (!proof.admissible) rejected.push({ id: l.id, kind: l.kind, reason: 'failed-benchmark', core: proof.verdict.core });
  }
  if (++done % 50 === 0) process.stderr.write(`  gated ${done}/${listings.length}\n`);
}

const admitted = gated.filter((g) => g.admissible);
const report = {
  total: listings.length,
  admitted: admitted.length,
  rejected: rejected.length,
  admitted_by_kind: admitted.reduce((m, g) => ((m[g.kind] = (m[g.kind] || 0) + 1), m), {}),
  reject_reasons: rejected.reduce((m, r) => ((m[r.reason] = (m[r.reason] || 0) + 1), m), {}),
  benchmark: 'acg-assessor',
  gate: 'proof-of-play',
  note: limit < all.length ? `SAMPLE of first ${listings.length} of ${all.length}` : 'full catalog',
};

writeFileSync(join(here, 'listings-gated.json'), JSON.stringify(gated, null, 2));
writeFileSync(join(here, 'gate-rejected.json'), JSON.stringify(rejected, null, 2));
writeFileSync(join(here, 'gate-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
