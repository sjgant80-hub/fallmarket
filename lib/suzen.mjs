// Suzen · necessity oracle · MUST / SHOULD / MAY over any JSON twin
// Phase 0 stub · full integration in Phase 4 (agent-native).
//
// Usage:
//   const { must, should, may } = await ask('build a UK payroll flow')

const SUZEN_ENDPOINT = 'https://sjgant80-hub.github.io/suzen/api.json';

export async function ask(need, listings = null) {
  // Phase 0: naive tag-match ranking
  // Phase 4: Suzen HTTP endpoint returns proper MUST/SHOULD/MAY sets
  if (!listings) {
    try {
      const r = await fetch('./listings.json');
      const j = await r.json();
      listings = j.listings || [];
    } catch { listings = []; }
  }
  const terms = need.toLowerCase().split(/\W+/).filter(Boolean);
  const scored = listings.map(l => {
    const hay = `${l.title} ${l.subtitle} ${(l.tags || []).join(' ')} ${l.description || ''}`.toLowerCase();
    const score = terms.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0);
    return { listing: l, score };
  }).filter(s => s.score > 0).sort((a, b) => b.score - a.score);

  return {
    must: scored.slice(0, 1).map(s => s.listing),
    should: scored.slice(1, 4).map(s => s.listing),
    may: scored.slice(4, 12).map(s => s.listing),
    phase: 0,
    note: 'Phase 0 · naive tag-match · Phase 4 replaces with real Suzen route'
  };
}
