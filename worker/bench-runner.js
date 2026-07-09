// Cloudflare Worker · benchmark runner endpoints
// Extends the main worker.js with Phase 3 benchmark orchestration.
//
// Endpoints added:
//   POST /api/benchmark      · queue a benchmark run against a listing
//   GET  /api/benchmark/:id  · read status
//   POST /api/benchmark/webhook · sandbox reports back (server-to-server)
//
// The Worker itself doesn't run the benchmark · it enqueues to Cloudflare Queues (or dispatches to an isolated
// VM tier via Container/Sandbox binding). This file describes the endpoint contract · full sandbox execution
// wires up at deploy time via wrangler.toml queue producer/consumer.

import { SUITE_REGISTRY } from '../lib/benchmark-suites.mjs';

export async function handleBenchmark(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/api/benchmark' && request.method === 'POST') {
    const body = await request.json();
    const { listing_id, suite_id, buyer_test_case, requester_did } = body;

    if (!listing_id || !suite_id) return json({ error: 'listing_id and suite_id required' }, 400);
    const suite = SUITE_REGISTRY[suite_id];
    if (!suite) return json({ error: `unknown suite ${suite_id}` }, 400);

    const id = ulid();
    const record = {
      v: 1,
      id,
      listing_id,
      suite_id,
      suite_version: suite.version,
      requester_did,
      buyer_test_case: buyer_test_case || null,
      status: 'queued',
      queued_at: new Date().toISOString(),
      score: null,
      pass: null,
      detail: null,
      runner_did: null,
      sig: null
    };

    if (env.BENCH_KV) await env.BENCH_KV.put(id, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 30 });
    if (env.BENCH_QUEUE) await env.BENCH_QUEUE.send({ benchmark_id: id, listing_id, suite_id, buyer_test_case });

    return json({ ok: true, benchmark_id: id, status: 'queued', suite: { id: suite.id, description: suite.description, steps: suite.steps.length } });
  }

  if (path.startsWith('/api/benchmark/') && request.method === 'GET') {
    const id = path.split('/').pop();
    if (!env.BENCH_KV) return json({ error: 'BENCH_KV not configured' }, 501);
    const raw = await env.BENCH_KV.get(id);
    if (!raw) return json({ error: 'not found' }, 404);
    return json(JSON.parse(raw));
  }

  if (path === '/api/benchmark/webhook' && request.method === 'POST') {
    // Sandbox VM posts results back here after running the suite
    if (env.RUNNER_SECRET) {
      const auth = request.headers.get('authorization');
      if (auth !== `Bearer ${env.RUNNER_SECRET}`) return json({ error: 'unauthorized' }, 401);
    }
    const result = await request.json();
    const { benchmark_id, score, pass, detail, runner_did, sig } = result;
    if (!benchmark_id) return json({ error: 'benchmark_id required' }, 400);

    if (env.BENCH_KV) {
      const raw = await env.BENCH_KV.get(benchmark_id);
      if (!raw) return json({ error: 'benchmark not found' }, 404);
      const record = JSON.parse(raw);
      record.status = pass ? 'passed' : 'failed';
      record.score = score;
      record.pass = pass;
      record.detail = detail;
      record.runner_did = runner_did;
      record.sig = sig;
      record.completed_at = new Date().toISOString();
      await env.BENCH_KV.put(benchmark_id, JSON.stringify(record));
    }

    // If a transaction is waiting on this benchmark, advance it
    // (Wire to /api/webhook/stripe release logic in Phase 2 · already stubbed)

    return json({ ok: true });
  }

  if (path === '/api/suites') {
    return json({ suites: Object.values(SUITE_REGISTRY).map(s => ({ id: s.id, kind: s.kind, description: s.description, weight: s.weight, steps: s.steps.length })) });
  }

  return json({ error: 'not a benchmark route' }, 404);
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};
function json(obj, status = 200) { return new Response(JSON.stringify(obj, null, 2), { status, headers: { 'Content-Type': 'application/json', ...CORS } }); }
function ulid() {
  const alpha = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const t = Date.now();
  let ts = '';
  let tt = t;
  for (let i = 9; i >= 0; i--) { ts = alpha[tt % 32] + ts; tt = Math.floor(tt / 32); }
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  let rand = '';
  for (const x of b) rand += alpha[x % 32];
  return ts + rand;
}
