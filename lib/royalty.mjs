// Fork-tree royalty split · walks the GitHub fork lineage to compute upstream credits
// Every transaction on a descendant listing pays a share to every ancestor.

export const SPLIT_POLICY = {
  seller: 0.70,      // 70% to seller of the fork being sold
  ancestors: 0.15,   // 15% distributed among ancestors in the fork chain (weighted by depth)
  publisher: 0.10,   // 10% to the publisher pool if the seller is a verified subscriber
  runner: 0.05       // 5% to the neutral benchmark runner
};

/**
 * Walk a GitHub repo's parent chain via the public API.
 * Returns [oldest, ..., direct-parent] — an ordered ancestry list.
 *
 * Example: fallhr-mcp forked from foldkit-mcp → returns [foldkit-mcp]
 */
export async function walkForkTree(ownerRepo, opts = {}) {
  const { fetchImpl = fetch, cache = null } = opts;
  const ancestors = [];
  let current = ownerRepo;
  let guard = 0;
  while (current && guard < 20) {
    guard++;
    if (cache && cache.has(current)) {
      const parent = cache.get(current);
      if (!parent) break;
      ancestors.unshift(parent);
      current = parent;
      continue;
    }
    try {
      const r = await fetchImpl(`https://api.github.com/repos/${current}`, {
        headers: { Accept: 'application/vnd.github+json' }
      });
      if (!r.ok) break;
      const data = await r.json();
      const parent = data.parent ? `${data.parent.owner.login}/${data.parent.name}` : null;
      if (cache) cache.set(current, parent);
      if (!parent) break;
      ancestors.unshift(parent);
      current = parent;
    } catch { break; }
  }
  return ancestors;
}

/**
 * Given an amount and the fork ancestry, compute the split.
 * Ancestors share the ancestors pool weighted by inverse depth (closer parent gets more).
 */
export function computeSplit(amount, { seller_did, ancestors_dids = [], publisher_did = null, runner_did = null, is_verified = false }) {
  const parts = [];
  const sellerAmount = round(amount * SPLIT_POLICY.seller);
  parts.push({ did: seller_did, share_pct: SPLIT_POLICY.seller * 100, amount: sellerAmount, reason: 'seller' });

  // ancestors weighted by inverse depth (nearest parent = weight 1, oldest = weight 1/n)
  if (ancestors_dids.length) {
    const weights = ancestors_dids.map((_, i) => 1 / (i + 1));
    const total = weights.reduce((a, b) => a + b, 0);
    const ancestorPool = amount * SPLIT_POLICY.ancestors;
    ancestors_dids.forEach((did, i) => {
      const w = weights[i] / total;
      parts.push({
        did,
        share_pct: (SPLIT_POLICY.ancestors * w) * 100,
        amount: round(ancestorPool * w),
        reason: `ancestor depth-${i + 1}`
      });
    });
  } else if (is_verified && publisher_did) {
    // If no ancestors, reallocate ancestor pool to publisher
    parts.push({
      did: publisher_did,
      share_pct: (SPLIT_POLICY.ancestors + SPLIT_POLICY.publisher) * 100,
      amount: round(amount * (SPLIT_POLICY.ancestors + SPLIT_POLICY.publisher)),
      reason: 'publisher (no ancestors)'
    });
  }

  if (is_verified && publisher_did && ancestors_dids.length) {
    parts.push({
      did: publisher_did,
      share_pct: SPLIT_POLICY.publisher * 100,
      amount: round(amount * SPLIT_POLICY.publisher),
      reason: 'publisher'
    });
  }

  if (runner_did) {
    parts.push({
      did: runner_did,
      share_pct: SPLIT_POLICY.runner * 100,
      amount: round(amount * SPLIT_POLICY.runner),
      reason: 'benchmark runner'
    });
  }

  // Any un-attributed remainder returns to seller
  const distributed = parts.reduce((a, p) => a + p.amount, 0);
  const remainder = round(amount - distributed);
  if (remainder !== 0) parts[0].amount = round(parts[0].amount + remainder);

  return {
    total: amount,
    policy: SPLIT_POLICY,
    parts
  };
}

function round(n) {
  return Math.round(n * 100) / 100;
}
