// FallMarket · client-side checkout flow
// Phase 2 · funds escrow via FallColony ledger, GBP shadow via Stripe, $KONO price for exchange readiness

const STORAGE_KEY = 'fm:transactions';
const CURRENCY_KEY = 'fm:currency';

export function getCurrency() {
  return localStorage.getItem(CURRENCY_KEY) || 'GBP';
}
export function setCurrency(c) {
  localStorage.setItem(CURRENCY_KEY, c);
}

export function loadTransactions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
export function saveTransaction(tx) {
  const all = loadTransactions();
  all.unshift(tx);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 200)));
}

export function ulid() {
  // ULID lite · 10-char timestamp (base32) + 16-char random (base32)
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

export function createTransaction({ listing, tier, buyer_did, currency }) {
  const price_gbp = tier.price_gbp;
  const price_kono = tier.price_kono;
  return {
    v: 1,
    id: ulid(),
    buyer_did,
    seller_did: listing.seller_did,
    product_id: listing.id,
    product_title: listing.title,
    tier_name: tier.name,
    price_gbp,
    price_kono,
    currency,
    status: 'created',
    escrow: { ledger: currency === '$KONO' ? 'bsv-kono' : 'stripe', ref: null, amount_gbp: price_gbp, amount_kono: price_kono },
    royalty_split: null,
    minted_nft: null,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    sig: 'pending'
  };
}

// ── Checkout modal on listing pages ────────────────────────────
export function openCheckout(listing) {
  const tiers = listing.tiers || [];
  const currency = getCurrency();
  const modal = document.createElement('div');
  modal.className = 'checkout-modal';
  modal.innerHTML = `
    <div class="checkout-inner">
      <button class="close" aria-label="Close">×</button>
      <h2>Hire <em>${escape(listing.title)}</em></h2>
      <p class="checkout-sub">Choose a tier. Funds escrow via FallColony ledger and release on benchmark pass.</p>

      <div class="tier-picker">
        ${tiers.map((t, i) => `
          <label class="tier ${i === 0 ? 'selected' : ''}">
            <input type="radio" name="tier" value="${i}" ${i === 0 ? 'checked' : ''}>
            <div class="tier-head">
              <strong>${escape(t.name)}</strong>
              <span class="tier-price" data-gbp="${t.price_gbp}" data-kono="${t.price_kono}">${formatPrice(t, currency)}</span>
            </div>
            <ul>${(t.includes || []).map(x => `<li>${escape(x)}</li>`).join('')}</ul>
          </label>
        `).join('')}
      </div>

      <div class="currency-toggle">
        <span>Pay in:</span>
        <button class="cur ${currency === 'GBP' ? 'on' : ''}" data-cur="GBP">GBP</button>
        <button class="cur ${currency === '$KONO' ? 'on' : ''}" data-cur="$KONO">$KONO</button>
      </div>

      <div class="checkout-summary">
        <div>Escrow ledger · <strong id="ck-ledger">${currency === '$KONO' ? 'BSV-$KONO' : 'Stripe'}</strong></div>
        <div>Benchmark on delivery · <strong>required for release</strong></div>
        <div>Signed transaction · <strong>Ed25519 on your DID</strong></div>
      </div>

      <button class="btn primary confirm">Confirm and escrow</button>
      <p class="fine">Phase 2 · Stripe onramp requires seller onboarding · $KONO lives on Thomas's onlybrains substrate · your transaction is recorded locally until backend goes live.</p>
    </div>
  `;
  document.body.appendChild(modal);
  document.body.classList.add('has-modal');

  const close = () => {
    modal.remove();
    document.body.classList.remove('has-modal');
  };
  modal.querySelector('.close').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  modal.querySelectorAll('.tier').forEach(el => {
    el.addEventListener('click', () => {
      modal.querySelectorAll('.tier').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
      el.querySelector('input').checked = true;
    });
  });

  modal.querySelectorAll('.cur').forEach(btn => {
    btn.addEventListener('click', () => {
      const cur = btn.dataset.cur;
      setCurrency(cur);
      modal.querySelectorAll('.cur').forEach(x => x.classList.remove('on'));
      btn.classList.add('on');
      modal.querySelectorAll('.tier-price').forEach(el => {
        const gbp = Number(el.dataset.gbp);
        const kono = Number(el.dataset.kcc);
        el.textContent = cur === '$KONO' ? `${kono} $KONO` : (gbp === 0 ? 'Free' : `£${gbp}`);
      });
      modal.querySelector('#ck-ledger').textContent = cur === '$KONO' ? 'BSV-$KONO' : 'Stripe';
    });
  });

  modal.querySelector('.confirm').addEventListener('click', async () => {
    const idx = Number(modal.querySelector('input[name=tier]:checked').value);
    const tier = tiers[idx];
    const cur = getCurrency();
    // Ensure buyer DID exists in localStorage; create one for anon buyers
    let buyer_did = localStorage.getItem('fm:did');
    if (!buyer_did) {
      buyer_did = 'did:key:anon-' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('fm:did', buyer_did);
    }
    const tx = createTransaction({ listing, tier, buyer_did, currency: cur });
    tx.status = 'escrowed';
    saveTransaction(tx);
    close();
    location.href = `transaction.html?id=${tx.id}`;
  });
}

function formatPrice(tier, currency) {
  if (currency === '$KONO') return `${tier.price_kono} $KONO`;
  if (tier.price_gbp === 0) return 'Free';
  return `£${tier.price_gbp}${tier.billing === 'monthly' ? '/mo' : ''}`;
}

function escape(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
