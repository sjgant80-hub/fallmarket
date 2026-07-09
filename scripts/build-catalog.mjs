#!/usr/bin/env node
/**
 * build-catalog.mjs · from listings.json, emit sitemap.xml + catalog.md
 * Called after import-trios.mjs by the nightly refresh workflow.
 *
 * catalog.md is the LLM-friendly dump — every listing as a markdown block.
 * sitemap.xml indexes browse + about + faq + guild + glossary + every listing detail URL.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const BASE = 'https://sjgant80-hub.github.io/fallmarket';

const listings = JSON.parse(readFileSync('listings.json', 'utf-8'));
const now = new Date().toISOString().slice(0, 10);

// ── sitemap.xml ────────────────────────────────────────────────
const staticPages = [
  { loc: `${BASE}/`, priority: 1.0, changefreq: 'daily' },
  { loc: `${BASE}/about.html`, priority: 0.9, changefreq: 'monthly' },
  { loc: `${BASE}/faq.html`, priority: 0.9, changefreq: 'monthly' },
  { loc: `${BASE}/guild.html`, priority: 0.8, changefreq: 'weekly' },
  { loc: `${BASE}/glossary.html`, priority: 0.8, changefreq: 'monthly' },
  { loc: `${BASE}/docs/roadmap.md`, priority: 0.7, changefreq: 'monthly' },
  { loc: `${BASE}/docs/agent-mcp.md`, priority: 0.8, changefreq: 'monthly' },
  { loc: `${BASE}/catalog.md`, priority: 0.9, changefreq: 'daily' },
  { loc: `${BASE}/llms.txt`, priority: 0.9, changefreq: 'weekly' }
];

const listingUrls = listings.listings.map(l => ({
  loc: `${BASE}/listing.html?id=${encodeURIComponent(l.id)}`,
  priority: 0.6,
  changefreq: 'weekly'
}));

const all = [...staticPages, ...listingUrls];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

writeFileSync('sitemap.xml', sitemap);
process.stderr.write(`[build-catalog] sitemap.xml · ${all.length} URLs\n`);

// ── catalog.md ─────────────────────────────────────────────────
const byKind = listings.listings.reduce((a, l) => {
  (a[l.kind] = a[l.kind] || []).push(l);
  return a;
}, {});

const KIND_LABELS = {
  sdk: 'SDKs',
  mcp: 'MCP servers',
  api: 'HTTP APIs',
  tool: 'Standalone tools'
};

let md = `# FallMarket · full catalog

**${listings.total} listings** · generated ${listings.generated_at}

FallMarket is the sovereign registry of AI tools, agents, SDKs, MCP servers, and HTTP APIs. Every listing below is MIT-licensed and Ed25519-signed. Browse the interactive catalog at ${BASE}/.

## Summary

| Kind | Count |
|---|---:|
${Object.entries(listings.by_kind).map(([k, n]) => `| ${KIND_LABELS[k] || k} | ${n} |`).join('\n')}
| **Total** | **${listings.total}** |

---

`;

for (const kind of ['sdk', 'mcp', 'api', 'tool']) {
  const arr = byKind[kind];
  if (!arr) continue;
  md += `## ${KIND_LABELS[kind]} (${arr.length})\n\n`;
  const sorted = [...arr].sort((a, b) => a.title.localeCompare(b.title));
  for (const l of sorted) {
    md += `### ${l.title}\n\n`;
    if (l.subtitle) md += `${l.subtitle}\n\n`;
    md += `- **Kind:** ${l.kind}\n`;
    md += `- **Listing:** ${BASE}/listing.html?id=${encodeURIComponent(l.id)}\n`;
    if (l.repo_url) md += `- **Source:** ${l.repo_url}\n`;
    if (l.playground_url) md += `- **Playground:** ${l.playground_url}\n`;
    if (l.install?.npm) md += `- **npm:** \`${l.install.npm}\`\n`;
    if (l.install?.mcp) md += `- **MCP:** \`${l.install.mcp}\`\n`;
    if (l.install?.docker) md += `- **Docker:** \`${l.install.docker}\`\n`;
    md += `- **License:** MIT\n`;
    md += `- **Guild:** ${l.guild || 'independent'}\n\n`;
  }
  md += `---\n\n`;
}

md += `\n## About FallMarket\n\n`;
md += `FallMarket is built and maintained by the AI-Native Solutions guild. Every listing is MIT-licensed, Ed25519-signed, and benchmarkable. Buyers can supply their own test cases and the neutral runner verifies pass/fail before a transaction completes.\n\n`;
md += `- Website: https://ai-nativesolutions.com\n`;
md += `- Repository: https://github.com/sjgant80-hub/fallmarket\n`;
md += `- LLM summary: ${BASE}/llms.txt\n`;
md += `- Machine-readable: ${BASE}/listings.json\n`;

writeFileSync('catalog.md', md);
process.stderr.write(`[build-catalog] catalog.md · ${listings.total} listings · ${md.length} bytes\n`);
