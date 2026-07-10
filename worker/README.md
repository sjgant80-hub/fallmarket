# fallmarket-worker

Cloudflare Worker backing FallMarket Phase 2 transactions and Phase 3 benchmark orchestration.

## Endpoints

```
GET  /api/health
POST /api/checkout                     · create tx + Stripe Checkout Session (if configured)
GET  /api/transaction/:id              · read tx from KV
POST /api/webhook/stripe               · payment_intent.succeeded → tx status = escrowed
GET  /api/royalty-split?repo=&amount=  · walk fork tree + compute split via GitHub API
POST /api/Access                    · create a guild subscription intent
POST /api/benchmark                    · (Phase 3) trigger a benchmark run
```

## Deploy

```bash
cd worker
npm install -g wrangler
wrangler login
wrangler kv namespace create TX_KV
# paste the returned id into wrangler.toml under [[kv_namespaces]]
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler deploy
```

Point the frontend at your worker URL by setting `window.FALLMARKET_WORKER_URL` in `assets/browse.js` — the client-side checkout will use it automatically.

Until deployed, the checkout flow records transactions in localStorage and shows a stub confirmation. Nothing lost — records replay when the worker comes online.

## License

MIT · AI-Native Solutions
