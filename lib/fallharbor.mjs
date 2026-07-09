// FallHarbor manifest sync · stub for Phase 0
// FallHarbor is the estate's manifest index (which tool exists, where it lives).
// Phase 1: periodic sync to freshen listings.json.

const HARBOR_MANIFEST = 'https://sjgant80-hub.github.io/fallharbor/manifest.json';

export async function fetchHarborManifest() {
  try {
    const r = await fetch(HARBOR_MANIFEST, { cache: 'no-store' });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

export async function reconcile(listings) {
  const harbor = await fetchHarborManifest();
  if (!harbor?.tools) return { added: 0, updated: 0, removed: 0, listings };
  // Phase 1: cross-reference and freshen
  return { added: 0, updated: 0, removed: 0, listings };
}
