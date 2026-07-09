# FallMarket · agent MCP surface

The MCP tools an agent (Claude, Cursor, Codex, or any MCP-compliant client) can call to search, install, hire, or transact on FallMarket. Phase 4 target; Phase 0 documents the shape so downstream builds can rely on it.

## Install (planned)

```bash
claude mcp add fallmarket -- npx -y @ai-native-solutions/fallmarket-mcp
```

## Tools

### `fallmarket_search`

Search the registry.

**Input:**
```json
{
  "query": "UK payroll offline",
  "kinds": ["sdk", "mcp"],
  "max_price_gbp": 100,
  "guild": "ai-native-solutions",
  "limit": 20
}
```

**Output:**
```json
{
  "results": [
    { "id": "fallhr-sdk", "title": "fallhr SDK", "kind": "sdk", "score": 0.87, "install": {...}, "tiers": [...] }
  ],
  "total": 12
}
```

### `fallmarket_get`

Fetch a single listing.

**Input:**
```json
{ "id": "fallhr-sdk" }
```

**Output:** full product listing per `schemas/product-listing.v1.json`.

### `fallmarket_install`

Return the correct install command for a listing/kind combination.

**Input:**
```json
{ "id": "fallhr-mcp" }
```

**Output:**
```json
{ "npm": "npm install @ai-native-solutions/fallhr-mcp", "mcp": "claude mcp add fallhr -- npx -y @ai-native-solutions/fallhr-mcp" }
```

### `fallmarket_hire`

Create a transaction (Phase 2+).

**Input:**
```json
{
  "product_id": "fallhr-mcp",
  "tier_name": "pro",
  "buyer_test_case": {
    "kind": "mcp-call",
    "input": { "tool": "hr_ask", "args": { "query": "SSP eligibility" } },
    "expected": { "contains": "ERA 1996 s.164" }
  }
}
```

**Output:**
```json
{
  "transaction_id": "01JZK7...",
  "status": "escrowed",
  "next": "benchmark-pending"
}
```

### `fallmarket_list_capabilities`

Discover what the marketplace can do.

**Input:** `{}`

**Output:** array of capability descriptors (kinds, guilds, currencies, benchmark suites).

### `fallmarket_ask_suzen`

Necessity oracle query (Phase 4).

**Input:**
```json
{ "need": "I need to file UK VAT for a limited company with 3 employees" }
```

**Output:**
```json
{
  "must": [{ "id": "fallbooks-sdk", "why": "computes VAT return 9-box + MTD payload" }],
  "should": [{ "id": "fallhr-sdk", "why": "payroll RTI shape included" }],
  "may": [{ "id": "fallclaim-sdk", "why": "if any PI claims to reconcile" }]
}
```

## Resources

- `fallmarket://catalog` — the full canonical `listings.json`
- `fallmarket://guilds` — guild directory
- `fallmarket://schemas/v1` — all four JSON schemas

## Wire format

Requests and responses default to standard MCP JSON-RPC. Phase 4 introduces an optional k-dot compressed encoding for high-volume A2A traffic (target: 19× reduction on repeated schema-shaped payloads).
