#!/usr/bin/env node
/**
 * tag-listings.mjs · retro-apply v21.1 §26 taxonomy to every listing
 *
 * Adds: solid_primary, solid_secondary (optional), prime, lineage, tag_source
 *
 * Runs in-place on listings.json. Idempotent.
 *
 * Zero LLM cost. Heuristic-based per lib/pricing.mjs peer.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const HOME = process.env.USERPROFILE || process.env.HOME;
const LISTINGS = join(HOME, 'Downloads', 'fallmarket', 'listings.json');

const catalog = JSON.parse(readFileSync(LISTINGS, 'utf-8'));

// ── Heuristics (per gospel · every-listing-tagged-solid-prime) ────────
const SOLID_PATTERNS = [
  { solid: 'TETRA',  re: /\b(id|passport|hello[-_]?device|boot|init|handshake|calibrate|signature|onboard|register|welcome)\b/i },
  { solid: 'OCTA',   re: /\b(mirror|scan|verify|check|audit|test|bench|shield|guard|watch|resolve|score|validate|inspect|kappa|coherence|monitor|debug|filter|quality)\b/i },
  { solid: 'DODECA', re: /\b(mail|note|garden|echo|harbor|book|brief|adviser|store|vault|ledger|market|corpus|memory|log|record|save|archive|history|catalog|library|knowledge|repository|db|database|persist|cache)\b/i },
  { solid: 'ICOSA',  re: /\b(scout|hop|carrier|mesh|net|link|compass|cast|relay|dns|bridge|search|discover|find|route|reach|broadcast|federate|p2p|connect|explore|proxy)\b/i },
  { solid: 'CUBE',   re: /\b(build|widget|template|render|studio|forge|generator|create|make|synth|editor|designer|composer|assembler|factory|maker|construct)\b/i },
];
const PRIME_PATTERNS = [
  { prime: 17, re: /\b(resolve|route|verify|check|score|answer|final|conclude|synthesize|judge|adjudicate|arbitrate)\b/i },
  { prime: 13, re: /\b(relat|social|signed|paired|contact|dyad|network|share|collab|team|dm|message|comment)\b/i },
  { prime: 11, re: /\b(mesh|resonance|frequency|match|affin|route|chord|sync|harmony|coherence|entangle|federate)\b/i },
  { prime: 7,  re: /\b(time|history|chain|log|prev|audit|trace|version|revision|timestamp|cron|schedule|calendar)\b/i },
  { prime: 5,  re: /\b(deep|drill|nest|corpus|hierarch|dive|recurse|analyze|analyse|reason|contemplate|meditate)\b/i },
  { prime: 3,  re: /\b(build|schema|widget|template|architect|structure|render|model|framework|scaffold|design)\b/i },
  { prime: 2,  re: /\b(safe|allow|block|gate|guard|shield|filter|toggle|switch|binary|boolean|permit|deny)\b/i },
];

const KIND_DEFAULT_SOLID = {
  sdk: 'CUBE',
  mcp: 'OCTA',    // most MCPs surface verify/query capabilities to LLM clients
  api: 'CUBE',
  tool: 'DODECA', // standalone tools tend to be single-purpose memory/utility surfaces
};

const KIND_DEFAULT_PRIME = {
  sdk: 3,   // structural
  mcp: 17,  // resolver
  api: 3,   // structural
  tool: 5,  // depth
};

function detectSolid(listing) {
  const hay = `${listing.title || ''} ${listing.id} ${listing.subtitle || ''} ${listing.description || ''} ${(listing.tags || []).join(' ')}`;
  const matches = SOLID_PATTERNS
    .map(p => ({ solid: p.solid, hits: (hay.match(new RegExp(p.re.source, 'gi')) || []).length }))
    .filter(x => x.hits > 0)
    .sort((a, b) => b.hits - a.hits);
  if (matches.length >= 2) return { primary: matches[0].solid, secondary: matches[1].solid };
  if (matches.length === 1) return { primary: matches[0].solid, secondary: null };
  return { primary: KIND_DEFAULT_SOLID[listing.kind] || 'CUBE', secondary: null };
}

function detectPrime(listing) {
  const hay = `${listing.title || ''} ${listing.id} ${listing.subtitle || ''} ${listing.description || ''} ${(listing.tags || []).join(' ')}`;
  for (const p of PRIME_PATTERNS) if (p.re.test(hay)) return p.prime;
  return KIND_DEFAULT_PRIME[listing.kind] || 3;
}

let tagged = 0, preserved = 0;
for (const l of catalog.listings) {
  if (l.solid_primary && l.tag_source === 'human') {
    preserved++;
    continue;
  }
  const { primary, secondary } = detectSolid(l);
  const prime = detectPrime(l);
  l.solid_primary = primary;
  if (secondary) l.solid_secondary = secondary;
  l.prime = prime;
  l.lineage = 'v21.1';
  l.tag_source = 'heuristic';
  tagged++;
}

catalog.generated_at = new Date().toISOString();
writeFileSync(LISTINGS, JSON.stringify(catalog, null, 2));

const bySolid = catalog.listings.reduce((a, l) => { a[l.solid_primary] = (a[l.solid_primary] || 0) + 1; return a; }, {});
const byPrime = catalog.listings.reduce((a, l) => { a[`prime-${l.prime}`] = (a[`prime-${l.prime}`] || 0) + 1; return a; }, {});

console.log(`tagged ${tagged} · preserved ${preserved} human overrides`);
console.log('by primary solid:', bySolid);
console.log('by prime:', byPrime);
