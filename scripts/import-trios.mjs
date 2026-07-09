#!/usr/bin/env node
/**
 * import-trios.mjs · walk sjgant80-hub for -sdk / -mcp / -api repos and emit listings.json
 *
 * Zero LLM cost. Pure gh CLI + Node. Runs against your existing gh auth.
 *
 * Usage:
 *   node scripts/import-trios.mjs > listings.json
 *   node scripts/import-trios.mjs --org sjgant80-hub --limit 500 > listings.json
 *   node scripts/import-trios.mjs --include-standalone > listings.json
 */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { pickTiersForKind } from '../lib/pricing.mjs';

const args = process.argv.slice(2);
const argv = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const has = (k) => args.includes(k);

const ORG = argv('--org', 'sjgant80-hub');
const LIMIT = parseInt(argv('--limit', '1000'));
const INCLUDE_STANDALONE = has('--include-standalone');

const sh = (cmd) => {
  try { return execSync(cmd, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { return null; }
};

process.stderr.write(`[import-trios] listing repos for ${ORG}...\n`);
const listRaw = sh(`gh repo list ${ORG} --limit ${LIMIT} --json name,description,isArchived,url,homepageUrl`);
if (!listRaw) { console.error('gh repo list failed'); process.exit(1); }
const allRepos = JSON.parse(listRaw);
process.stderr.write(`[import-trios] ${allRepos.length} repos found\n`);

const KIND_RE = /-(sdk|mcp|api)$/;
const isCompanion = (r) => KIND_RE.test(r.name) && !r.isArchived;

const companions = allRepos.filter(isCompanion);
process.stderr.write(`[import-trios] ${companions.length} live -sdk/-mcp/-api companions\n`);

const standalone = INCLUDE_STANDALONE
  ? allRepos.filter(r => !KIND_RE.test(r.name) && !r.isArchived && /^fall/.test(r.name))
  : [];
if (INCLUDE_STANDALONE) process.stderr.write(`[import-trios] +${standalone.length} standalone fall* repos\n`);

const now = new Date().toISOString();

const listings = [];

for (const repo of companions) {
  const [, kind] = repo.name.match(KIND_RE);
  const tool = repo.name.replace(KIND_RE, '');
  const pagesUrl = `https://${ORG}.github.io/${repo.name}/`;

  const install = {};
  const pkgName = `@ai-native-solutions/${repo.name}`;
  if (kind === 'sdk') install.npm = `npm install ${pkgName}`;
  if (kind === 'mcp') {
    install.mcp = `claude mcp add ${tool} -- npx -y ${pkgName}`;
    install.npm = `npm install ${pkgName}`;
  }
  if (kind === 'api') {
    install.docker = `docker run -p 3000:3000 ghcr.io/${ORG}/${repo.name}:latest`;
    install.npm = `npm install ${pkgName}`;
  }

  listings.push({
    v: 1,
    id: repo.name,
    seller_did: `did:key:pending`,
    kind,
    title: `${tool} ${kind.toUpperCase()}`,
    subtitle: repo.description || `Sovereign ${kind} extracted from ${tool}`,
    description: repo.description || '',
    tags: [tool, kind, 'ai-native-solutions', 'sovereign', 'mit'],
    repo_url: repo.url,
    playground_url: kind === 'sdk' ? pagesUrl : null,
    docs_url: pagesUrl,
    install,
    tiers: pickTiersForKind(kind),
    benchmarks: [],
    guild: 'ai-native-solutions',
    created: now,
    sig: 'pending'
  });
}

for (const repo of standalone) {
  const pagesUrl = repo.homepageUrl || `https://${ORG}.github.io/${repo.name}/`;
  listings.push({
    v: 1,
    id: repo.name,
    seller_did: `did:key:pending`,
    kind: 'tool',
    title: repo.name,
    subtitle: repo.description || 'Sovereign single-file tool',
    description: repo.description || '',
    tags: [repo.name, 'tool', 'ai-native-solutions', 'sovereign', 'mit'],
    repo_url: repo.url,
    playground_url: pagesUrl,
    docs_url: repo.url,
    install: {},
    tiers: pickTiersForKind('tool'),
    benchmarks: [],
    guild: 'ai-native-solutions',
    created: now,
    sig: 'pending'
  });
}

const out = {
  v: 1,
  generated_at: now,
  total: listings.length,
  by_kind: listings.reduce((a, l) => { a[l.kind] = (a[l.kind] || 0) + 1; return a; }, {}),
  listings
};

process.stdout.write(JSON.stringify(out, null, 2));
process.stderr.write(`[import-trios] emitted ${listings.length} listings (${Object.entries(out.by_kind).map(([k, n]) => `${k}:${n}`).join(' ')})\n`);
