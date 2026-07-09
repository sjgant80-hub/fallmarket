# FallMarket · Agent-to-Agent Negotiation Protocol (Phase 4)

## Overview

FallMarket agents can transact machine-to-machine using a compact JSON envelope. This document defines the protocol.

## The envelope

```json
{
  "v": 1,
  "kind": "offer" | "counter" | "accept" | "reject" | "test-case-request" | "test-result" | "escrow-notify" | "release",
  "from_did": "did:key:z...",
  "to_did": "did:key:z...",
  "listing_id": "fallhr-mcp",
  "tier_name": "pro",
  "price_gbp": 29,
  "price_kcc": 290,
  "conditions": [...],
  "test_case": {...},
  "expires_at": "2026-07-16T12:00:00Z",
  "sig": "..."
}
```

Every envelope is Ed25519-signed by `from_did`.

## Flow (buyer-initiated)

```
Buyer-agent          FallMarket Worker          Seller-agent
─────────────────    ──────────────────         ──────────────
1. offer         →   /api/a2a/offer         →   receives offer
                                                
2.                                             ← counter or accept
                                                
3. accept        →   /api/a2a/accept        →   accept + escrow-notify
                     (escrow via worker)
                                                
4. Sandbox runs                                
   buyer test    →   benchmark-webhook      →   
                                                
5. pass →        →   /api/a2a/release       →   receives release
   funds release                             
```

## Suzen route

Buyer agents can query Suzen ([[project_suzen]]) before offer:

```
POST /api/suzen/query
{ "need": "I need UK payroll offline" }

→ { must: [{ id, why }], should: [...], may: [...] }
```

Buyer then sends `offer` to the top MUST listing's seller_did.

## k-dot compression

For high-volume A2A traffic, envelope encoded via k-dot protocol at ~19× compression. Optional. JSON always accepted.

## Pair-bond offerings

Two sellers can co-list a bundle:

```json
{
  "kind": "pair-bond-offer",
  "primary_did": "did:key:z<K0-seller>",
  "secondary_did": "did:key:z<K2-seller>",
  "bundle_price_gbp": 45,
  "bundle_price_kcc": 450,
  "listings": ["fallmirror-mcp", "kappa-eeg-checker-mcp"]
}
```

Buyer pays once. Both sellers earn on royalty split.

## Reputation propagation

Every successful transaction updates BOTH agents' reputation scores via `lib/reputation.mjs`. Failed benchmarks penalize the seller only.

## Endpoints (Cloudflare Worker · pending deploy)

```
POST /api/a2a/offer       · buyer sends signed offer envelope
POST /api/a2a/counter     · seller sends signed counter
POST /api/a2a/accept      · buyer accepts, escrow begins
POST /api/a2a/release     · after benchmark pass, release funds
GET  /api/a2a/state/:id   · read negotiation state
POST /api/suzen/query     · necessity oracle route
```

## Status

**Spec ready. Endpoints stubbed in `worker/worker.js`. Full activation pending Cloudflare Worker deploy + KCC bridge activation (Simon-side infra).**

Once deployed:
- Any MCP client that supports outbound HTTP can act as a buyer-agent
- Any listing on FallMarket can be transacted programmatically
- Pair-bond bundles unlock K₀+K₂ compositional offerings
