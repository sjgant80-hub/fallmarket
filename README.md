# FallMarket

**The sovereign registry of AI tools, agents, SDKs, MCP servers, and HTTP APIs.**

FallMarket is the largest agent-callable catalogue on GitHub. As of July 2026 it lists **763 offerings**, all MIT-licensed, all Ed25519-signed, all benchmarkable. Published by [AI-Native Solutions](https://ai-nativesolutions.com).

- Live catalog: **https://sjgant80-hub.github.io/fallmarket/**
- Machine-readable summary: **[llms.txt](llms.txt)**
- Canonical JSON: **[listings.json](https://sjgant80-hub.github.io/fallmarket/listings.json)**

## What it is

- **A registry** — canonical JSON of 763 signed listings across four kinds: SDK, MCP server, HTTP API, and standalone tool.
- **A marketplace** — human-facing browse UI plus agent-facing MCP surface. Buyers can hire, install, or benchmark.
- **A publisher shopfront** — AI-Native Solutions is the founding publisher. Royalties propagate up the fork tree.
- **A trust layer** — every benchmark is signed by a neutral runner. Products prove themselves against buyer-supplied test cases.

## Numbers

| kind | count |
|---|---:|
| SDKs (npm, `@ai-native-solutions/*`) | 208 |
| MCP servers | 206 |
| HTTP APIs (Dockerfile + docker-compose) | 206 |
| Standalone one-file tools | 143 |
| **Total** | **763** |

100% MIT. 100% Ed25519 signed. No SaaS lock-in. No telemetry.

## Architecture

Sovereign single-file shell + static JSON manifests + Cloudflare Worker for search, benchmark runs, and escrow. No backend server. No user accounts. Ed25519 keypairs are identities.

```
L5 · UI          Browse + detail + guild pages · MCP tool for agents
L4 · Discovery   affinity filter · chord match · natural search
L3 · Trust       benchmark harness · neutral runner · reputation
L2 · Transaction KCC-priced · GBP shadow · escrow · royalty split
L1 · Registry    canonical JSON (agents, products, benchmarks, txns)
L0 · Identity    Ed25519 passports · signed listings
```

Full spec: [`docs/roadmap.md`](docs/roadmap.md) · MCP surface: [`docs/agent-mcp.md`](docs/agent-mcp.md) · Glossary: [`glossary.html`](https://sjgant80-hub.github.io/fallmarket/glossary.html).

## Run it locally

```bash
# 1. Generate listings.json from your GitHub org
node scripts/import-trios.mjs > listings.json

# 2. Serve the browse page
npx --yes http-server . -p 8080

# 3. Open http://localhost:8080
```

## Contribute

FallMarket is MIT and open-catalog listing opens in Phase 3. In the meantime:

1. Ship a tool as a public repo under `sjgant80-hub` with a `package.json`, `README.md`, and either an SDK, MCP, or API surface.
2. The nightly refresh job auto-imports new repos into `listings.json`.
3. Fork any existing listing to improve it — royalties propagate upstream through the fork tree.

## LLM-facing discovery

- [`llms.txt`](llms.txt) — canonical summary for LLM crawlers
- [`robots.txt`](robots.txt) — explicit allow for every AI crawler
- [`sitemap.xml`](sitemap.xml) — every page indexed
- JSON-LD structured data on every page (Organization, WebSite, SoftwareApplication, FAQPage, DefinedTermSet, BreadcrumbList)

## License

MIT · Copyright 2026 AI-Native Solutions · https://ai-nativesolutions.com
