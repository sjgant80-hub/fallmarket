// FallMarket · Cloudflare Worker · Phase 2 checkout + Phase 3 benchmark endpoints
// Deploy: `wrangler deploy` from /worker
// Bindings needed at deploy time:
//   STRIPE_SECRET_KEY      · Stripe live/test secret · required for real checkout
//   STRIPE_WEBHOOK_SECRET  · webhook signature verify
//   FALLCOLONY_TOKEN       · ledger mint permission (optional · Phase 2b)
//   TX_KV                  · KV namespace for transactions
//   BENCH_QUEUE            · Queue for benchmark runs (optional · Phase 3)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

const json = (obj, status = 200) => new Response(JSON.stringify(obj, null, 2), {
  status, headers: { 'Content-Type': 'application/json', ...CORS }
});

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';

    try {
      if (path === '/' || path === '/api') return json({
        service: 'fallmarket-worker',
        version: '0.1.0',
        canonical: 'https://sjgant80-hub.github.io/fallmarket/',
        endpoints: [
          'GET  /api/health',
          'POST /api/checkout',
          'GET  /api/transaction/:id',
          'POST /api/webhook/stripe',
          'GET  /api/royalty-split?repo=owner/name',
          'POST /api/subscribe',
          'POST /api/benchmark (Phase 3)'
        ]
      });

      if (path === '/api/health') return json({ ok: true, ts: new Date().toISOString(), env_ready: !!env.STRIPE_SECRET_KEY });

      // POST /api/checkout · create a transaction and (when Stripe key set) a Checkout Session
      if (path === '/api/checkout' && request.method === 'POST') {
        const body = await request.json();
        const { product_id, tier_name, buyer_did, price_gbp, price_kono, currency } = body;
        if (!product_id || !buyer_did) return json({ error: 'product_id and buyer_did required' }, 400);

        const id = ulid();
        const tx = {
          v: 1, id, product_id, buyer_did, tier_name, price_gbp, price_kono, currency,
          status: 'created', created: new Date().toISOString(), updated: new Date().toISOString()
        };

        if (env.TX_KV) await env.TX_KV.put(id, JSON.stringify(tx), { expirationTtl: 60 * 60 * 24 * 90 });

        // If Stripe configured and paying in GBP, mint a Checkout Session
        let checkout_url = null;
        if (currency === 'GBP' && price_gbp > 0 && env.STRIPE_SECRET_KEY) {
          const formData = new URLSearchParams();
          formData.set('mode', 'payment');
          formData.set('success_url', `https://sjgant80-hub.github.io/fallmarket/transaction.html?id=${id}&status=success`);
          formData.set('cancel_url', `https://sjgant80-hub.github.io/fallmarket/transaction.html?id=${id}&status=cancelled`);
          formData.set('line_items[0][price_data][currency]', 'gbp');
          formData.set('line_items[0][price_data][unit_amount]', String(Math.round(price_gbp * 100)));
          formData.set('line_items[0][price_data][product_data][name]', `FallMarket · ${product_id} · ${tier_name}`);
          formData.set('line_items[0][quantity]', '1');
          formData.set('metadata[tx_id]', id);
          formData.set('metadata[product_id]', product_id);
          formData.set('metadata[buyer_did]', buyer_did);

          const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
          });
          const s = await stripeRes.json();
          if (s.url) checkout_url = s.url;
          tx.escrow = { ledger: 'stripe', ref: s.id, amount_gbp: price_gbp };
          tx.status = 'escrow-pending';
          if (env.TX_KV) await env.TX_KV.put(id, JSON.stringify(tx));
        } else if (currency === '$KONO') {
          tx.escrow = { ledger: 'bsv-kono', ref: null, amount_kono: price_kono };
          tx.status = 'escrow-pending';
          tx.note = '$KONO settlement stubbed pending Thomas onlybrains onboarding';
          if (env.TX_KV) await env.TX_KV.put(id, JSON.stringify(tx));
        }

        return json({ ok: true, tx_id: id, checkout_url, status: tx.status, note: checkout_url ? null : 'Stripe not configured · client-only receipt' });
      }

      // GET /api/transaction/:id
      if (path.startsWith('/api/transaction/') && request.method === 'GET') {
        const id = path.split('/').pop();
        if (!env.TX_KV) return json({ error: 'TX_KV not configured' }, 501);
        const raw = await env.TX_KV.get(id);
        if (!raw) return json({ error: 'not found' }, 404);
        return json(JSON.parse(raw));
      }

      // POST /api/webhook/stripe · release escrow on payment_intent.succeeded
      if (path === '/api/webhook/stripe' && request.method === 'POST') {
        if (!env.STRIPE_WEBHOOK_SECRET) return json({ error: 'webhook secret not configured' }, 501);
        // Signature verify placeholder · full HMAC verify at deploy time
        const event = await request.json();
        if (event.type === 'checkout.session.completed') {
          const s = event.data.object;
          const txId = s.metadata?.tx_id;
          if (txId && env.TX_KV) {
            const raw = await env.TX_KV.get(txId);
            if (raw) {
              const tx = JSON.parse(raw);
              tx.status = 'escrowed';
              tx.updated = new Date().toISOString();
              tx.escrow.confirmed_at = tx.updated;
              await env.TX_KV.put(txId, JSON.stringify(tx));
            }
          }
        }
        return json({ received: true });
      }

      // GET /api/royalty-split?repo=owner/name&amount=100
      if (path === '/api/royalty-split') {
        const repo = url.searchParams.get('repo');
        const amount = Number(url.searchParams.get('amount') || 100);
        if (!repo) return json({ error: 'repo=owner/name required' }, 400);
        const ancestors = [];
        let current = repo, guard = 0;
        while (current && guard < 10) {
          guard++;
          const r = await fetch(`https://api.github.com/repos/${current}`, {
            headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'fallmarket-worker' }
          });
          if (!r.ok) break;
          const data = await r.json();
          const parent = data.parent ? `${data.parent.owner.login}/${data.parent.name}` : null;
          if (!parent) break;
          ancestors.unshift(parent);
          current = parent;
        }
        return json({ repo, amount, ancestors, split: computeSplit(amount, ancestors) });
      }

      // POST /api/subscribe · create a subscription intent
      if (path === '/api/subscribe' && request.method === 'POST') {
        const body = await request.json();
        const { publisher, tier, member_did } = body;
        if (!publisher || !tier || !member_did) return json({ error: 'publisher, tier, member_did required' }, 400);
        const id = ulid();
        const record = {
          v: 1, id, publisher, tier, member_did,
          status: env.STRIPE_SECRET_KEY ? 'checkout-pending' : 'awaiting-onboarding',
          created: new Date().toISOString()
        };
        if (env.TX_KV) await env.TX_KV.put(`sub:${id}`, JSON.stringify(record));
        return json({ ok: true, subscription_id: id, next: 'complete-checkout' });
      }

      return json({ error: 'not found', path }, 404);
    } catch (e) {
      return json({ error: e.message, stack: e.stack?.split('\n').slice(0, 3) }, 500);
    }
  }
};

function computeSplit(amount, ancestors) {
  const parts = [];
  const seller = round(amount * 0.70);
  parts.push({ pct: 70, amount: seller, reason: 'seller' });
  if (ancestors.length) {
    const pool = amount * 0.15;
    const weights = ancestors.map((_, i) => 1 / (i + 1));
    const total = weights.reduce((a, b) => a + b, 0);
    ancestors.forEach((repo, i) => {
      parts.push({ pct: round((0.15 * (weights[i] / total)) * 100), amount: round(pool * (weights[i] / total)), reason: `ancestor ${repo}` });
    });
  }
  parts.push({ pct: 10, amount: round(amount * 0.10), reason: 'publisher' });
  parts.push({ pct: 5, amount: round(amount * 0.05), reason: 'benchmark runner' });
  return parts;
}

function round(n) { return Math.round(n * 100) / 100; }

function ulid() {
  const alpha = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const t = Date.now();
  let ts = '';
  let tt = t;
  for (let i = 9; i >= 0; i--) { ts = alpha[tt % 32] + ts; tt = Math.floor(tt / 32); }
  let rand = '';
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  for (const x of b) rand += alpha[x % 32];
  return ts + rand;
}
