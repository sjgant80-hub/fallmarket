// $KONO / GBP pricing policy for FallMarket listings
// $KONO value grounded in mesh coherence contribution. Phase 2 uses a spot rate against GBP;
// Phase 4 replaces with Korean-exchange market rate.

export const KONO_GBP_RATE = 0.10; // 1 $KONO = £0.10 (aspirational · policy · not exchange-quoted yet)
export const SUBSCRIBER_DISCOUNT_PCT = 20; // Pro/Founder subscribers get 20% off $KONO-priced listings

/**
 * Standard pricing policy per listing kind. Free tier is universal; paid tier is opt-in per listing.
 * Sellers can override by editing their listing after import.
 */
export const DEFAULT_TIERS = {
  sdk: [
    { name: 'free', price_gbp: 0, price_kono: 0, includes: ['MIT source', 'self-host', 'community support'], billing: 'one-time' },
    { name: 'pro', price_gbp: 29, price_kono: 290, includes: ['everything in Free', 'priority issue triage', 'guild attestation badge'], billing: 'monthly' }
  ],
  mcp: [
    { name: 'free', price_gbp: 0, price_kono: 0, includes: ['MIT source', 'self-host'], billing: 'one-time' },
    { name: 'hosted', price_gbp: 9, price_kono: 90, includes: ['managed MCP endpoint', 'no self-hosting', '99% uptime'], billing: 'monthly' }
  ],
  api: [
    { name: 'free', price_gbp: 0, price_kono: 0, includes: ['MIT source', 'self-host with Docker'], billing: 'one-time' },
    { name: 'hosted', price_gbp: 19, price_kono: 190, includes: ['managed HTTP endpoint', '10k req/day', 'guild SLA'], billing: 'monthly' }
  ],
  tool: [
    { name: 'free', price_gbp: 0, price_kono: 0, includes: ['MIT source', 'runs from file://', 'no telemetry'], billing: 'one-time' }
  ]
};

export function gbpToKono(gbp) {
  return Math.round(gbp / KONO_GBP_RATE);
}

export function konoToGbp(kono) {
  return Math.round(kono * KONO_GBP_RATE * 100) / 100;
}

export function subscriberPrice(gbp) {
  return Math.round(gbp * (1 - SUBSCRIBER_DISCOUNT_PCT / 100) * 100) / 100;
}

export function pickTiersForKind(kind) {
  return DEFAULT_TIERS[kind] || DEFAULT_TIERS.tool;
}
