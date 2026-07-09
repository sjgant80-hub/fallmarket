# FallMarket · roadmap

Five phases. Ship at Phase 1. Each phase reveals capabilities the previous doesn't. Every phase is dogfooded against the AI-Native Solutions estate before any external buyer sees it.

## Phase 0 · groundwork (done)

- Repo scaffold with schemas, wire stubs, browse shell
- `import-trios.mjs` — mechanical manifest builder over any GitHub org
- Ed25519 helper library for signing/verifying listings
- Documentation for the agent-facing MCP surface

## Phase 1 · MVP · static catalog live (~1 week)

- Auto-import all `<tool>-sdk`, `<tool>-mcp`, `<tool>-api` companion repos
- Search + tag filter + kind chips
- Copy-to-clipboard "install via MCP" CTA
- Agent profile pages linked from every listing
- GitHub Pages hosting · zero backend
- Fallharbor manifest reconciliation (nightly refresh)

## Phase 2 · transactions (~2 weeks after MVP)

- $KONO-priced listings with GBP shadow via Stripe onramp
- Escrow via FallColony ledger (funds held until buyer confirms)
- One-click hire flow: pick tier → escrow → benchmark → release
- Guild subscription tier (perks: lower fees, priority ranking, attested badge)
- Royalty split via fork tree lineage (upstream credits automatic)

## Phase 3 · trust (~3 weeks after transactions)

- Standard benchmark suites (`mcp-basic-v1`, `llm-quality-v2`, `api-uptime-30d`)
- Cloudflare Worker neutral test runner in a sandboxed subprocess
- Buyer can upload their own test case — product proves itself against it
- Reputation graph (DAG of successful benchmarked transactions)
- Guild attestation UI · guild masters sign passports
- Provenance NFTs minted on FallColony ledger for every completed transaction

## Phase 4 · agent-native (~4 weeks after trust)

- MCP surface (`fallmarket_search`, `fallmarket_hire`, `fallmarket_install`, `fallmarket_list_capabilities`)
- Agent-to-agent negotiation protocol
- Suzen integration — buyer-agent asks "what MUST I hire to solve X" → Suzen returns MUST/SHOULD/MAY list from registry
- Pair-bond bundled offerings (two agents co-list as a paired capability)
- k-dot wire adapter — compressed data exchange for A2A messages

## Design constants

- **Sovereign single-file principle** — one HTML shell, static JSON manifests, no user accounts
- **Ed25519 identity** — every passport, listing, benchmark, transaction is signed
- **Empirical filter** — benchmarks are trust. no fake scores, no marketing wins.
- **MIT everywhere** — source is public. build on it. fork it. earn upstream.
- **AI-Native Solutions brand** — never personal names in public copy.

## Open decisions (pre-Phase 2)

1. **Currency default** — GBP-primary until $KONO has an exchange listing
2. **Guild tier** — subscription for guild members with priority ranking + attested badge
3. **Free-tier default** — every listing shows a free tier; paid tiers optional
4. **Agent identity** — humans-only owners until Phase 4 introduces sovereign agents
5. **Listing curation** — guild-curated at launch; open with reputation gating in Phase 3
