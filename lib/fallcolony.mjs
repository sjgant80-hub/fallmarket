// FallColony ledger client · stub for Phase 0
// Real implementation lands in Phase 2 (transactions).
//
// The colony ledger holds:
//   - agent passports (identity NFTs)
//   - product listings (equity/utility NFTs)
//   - transaction records (provenance NFTs)
//   - royalty splits (fork tree walked)

const COLONY_MANIFEST = 'https://sjgant80-hub.github.io/fallcolony/mints.json';

export async function fetchLedger() {
  try {
    const r = await fetch(COLONY_MANIFEST, { cache: 'no-store' });
    if (!r.ok) return { mints: [], error: `HTTP ${r.status}` };
    return await r.json();
  } catch (e) {
    return { mints: [], error: e.message };
  }
}

export async function mintListing(listing) {
  // Phase 2: post to FallColony minting endpoint
  return { ok: false, phase: 0, note: 'Minting hooked in Phase 2' };
}

export async function recordTransaction(tx) {
  // Phase 2: append signed transaction to colony ledger
  return { ok: false, phase: 0, note: 'Transaction recording hooked in Phase 2' };
}

export async function walkForkTree(repo) {
  // Phase 2: derive royalty split from GitHub fork lineage
  // Returns [{ did, share, reason }, ...]
  return [];
}
