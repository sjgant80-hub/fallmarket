// FallMarket · reputation graph
// Reputation = weighted average of benchmark scores, transaction success rate, and time-decay of recency.
// Every score is signed. No self-reported reputation.

const DECAY_HALF_LIFE_DAYS = 90; // scores from 90d ago count for half

/**
 * Compute a rep score for one listing from an array of signed benchmark results + transaction records.
 * @returns { score: 0..1, tier: 'unproven' | 'bronze' | 'silver' | 'gold', benchmark_count, tx_count }
 */
export function computeRep({ benchmarks = [], transactions = [], now = new Date() }) {
  const nowT = +now;

  // Benchmark component (0..1)
  const bScored = benchmarks.map(b => ({
    score: Math.max(0, Math.min(1, b.score || 0)),
    weight: b.weight ?? 1.0,
    age_days: (nowT - +new Date(b.run_at)) / 86400000
  }));
  const bDecayed = bScored.map(b => ({
    score: b.score,
    weight: b.weight * Math.pow(0.5, b.age_days / DECAY_HALF_LIFE_DAYS)
  }));
  const bTotalW = bDecayed.reduce((a, b) => a + b.weight, 0);
  const bWeighted = bTotalW > 0 ? bDecayed.reduce((a, b) => a + b.score * b.weight, 0) / bTotalW : null;

  // Transaction component (0..1)
  const completed = transactions.filter(t => t.status === 'released' || t.status === 'benchmark-passed');
  const disputed = transactions.filter(t => t.status === 'disputed' || t.status === 'benchmark-failed');
  const txScore = transactions.length === 0 ? null :
    completed.length / (completed.length + disputed.length + 0.001);

  // Aggregate (weighted mean, ignoring nulls)
  const parts = [];
  if (bWeighted !== null) parts.push({ v: bWeighted, w: 0.7 });
  if (txScore !== null) parts.push({ v: txScore, w: 0.3 });
  const totalW = parts.reduce((a, p) => a + p.w, 0);
  const score = totalW > 0 ? parts.reduce((a, p) => a + p.v * p.w, 0) / totalW : 0;

  let tier = 'unproven';
  if (benchmarks.length >= 3 && score >= 0.9) tier = 'gold';
  else if (benchmarks.length >= 2 && score >= 0.75) tier = 'silver';
  else if (benchmarks.length >= 1 && score >= 0.5) tier = 'bronze';

  return {
    score: Math.round(score * 100) / 100,
    tier,
    benchmark_count: benchmarks.length,
    tx_count: transactions.length,
    completed_count: completed.length,
    disputed_count: disputed.length
  };
}

export const TIER_LABELS = {
  unproven: 'Unproven',
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold'
};

export const TIER_COLORS = {
  unproven: '#8a8478',
  bronze: '#a0693f',
  silver: '#c0c0c0',
  gold: '#b8974a'
};
