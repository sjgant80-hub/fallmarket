// FallMarket browse · loads listings.json, renders searchable/filterable grid
const state = { listings: [], q: '', kinds: new Set(), solids: new Set(), primes: new Set(), sort: 'name-asc' };

async function load() {
  try {
    const r = await fetch('./listings.json', { cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    state.listings = j.listings || [];
    const stats = document.getElementById('hero-stats');
    if (stats) {
      const parts = [`<b>${j.total}</b> listings`];
      for (const [k, n] of Object.entries(j.by_kind || {})) parts.push(`<b>${n}</b> ${k}`);
      stats.innerHTML = parts.join(' · ');
    }
    renderChips();
    render();
  } catch (e) {
    const stats = document.getElementById('hero-stats');
    if (stats) stats.textContent = `catalog unavailable · ${e.message}`;
    document.getElementById('empty').hidden = false;
  }
}

function renderChips() {
  const kinds = [...new Set(state.listings.map(l => l.kind))].sort();
  const solids = ['TETRA', 'CUBE', 'OCTA', 'DODECA', 'ICOSA'];
  const primes = [2, 3, 5, 7, 11, 13, 17];
  const chips = document.getElementById('chips');
  const countKind = (k) => state.listings.filter(l => l.kind === k).length;
  const countSolid = (s) => state.listings.filter(l => l.solid_primary === s).length;
  const countPrime = (p) => state.listings.filter(l => l.prime === p).length;
  chips.innerHTML = `
    <div class="chip-row">
      <span class="chip-label">KIND</span>
      ${kinds.map(k => `<span class="chip" data-type="kind" data-val="${k}">${k} · ${countKind(k)}</span>`).join('')}
    </div>
    <div class="chip-row">
      <span class="chip-label">MODE (solid)</span>
      ${solids.filter(s => countSolid(s) > 0).map(s => `<span class="chip solid-${s}" data-type="solid" data-val="${s}">${s} · ${countSolid(s)}</span>`).join('')}
    </div>
    <div class="chip-row">
      <span class="chip-label">AXIS (prime)</span>
      ${primes.filter(p => countPrime(p) > 0).map(p => `<span class="chip" data-type="prime" data-val="${p}">${p} · ${countPrime(p)}</span>`).join('')}
    </div>
  `;
  chips.querySelectorAll('.chip').forEach(el => {
    el.addEventListener('click', () => {
      const t = el.dataset.type, v = el.dataset.val;
      const bucket = { kind: state.kinds, solid: state.solids, prime: state.primes }[t];
      const val = t === 'prime' ? Number(v) : v;
      if (bucket.has(val)) bucket.delete(val); else bucket.add(val);
      el.classList.toggle('on');
      render();
    });
  });
}

function match(l) {
  if (state.kinds.size && !state.kinds.has(l.kind)) return false;
  if (state.solids.size && !state.solids.has(l.solid_primary)) return false;
  if (state.primes.size && !state.primes.has(l.prime)) return false;
  if (!state.q) return true;
  const hay = `${l.title} ${l.subtitle || ''} ${(l.tags || []).join(' ')} ${l.description || ''}`.toLowerCase();
  return state.q.toLowerCase().split(/\s+/).filter(Boolean).every(t => hay.includes(t));
}

function sortFn(a, b) {
  switch (state.sort) {
    case 'name-desc': return b.title.localeCompare(a.title);
    case 'kind': return a.kind.localeCompare(b.kind) || a.title.localeCompare(b.title);
    case 'guild': return (b.guild ? 1 : 0) - (a.guild ? 1 : 0) || a.title.localeCompare(b.title);
    default: return a.title.localeCompare(b.title);
  }
}

function render() {
  const filtered = state.listings.filter(match).sort(sortFn);
  document.getElementById('empty').hidden = filtered.length > 0;
  document.getElementById('grid').innerHTML = filtered.slice(0, 300).map(cardHtml).join('');
  document.querySelectorAll('.card .actions button.copy-mcp').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.dataset.cmd);
      btn.textContent = 'Copied';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = 'Copy MCP'; btn.classList.remove('copied'); }, 1400);
    });
  });
}

function cardHtml(l) {
  const price = l.tiers?.[0]?.price_gbp === 0 ? 'Free · MIT' : `£${l.tiers?.[0]?.price_gbp}`;
  const badge = (l.publisher === 'ai-native-solutions' || l.guild === 'ai-native-solutions') ? `<span class="publisher-badge">◊ ai-native</span>` : '';
  const solidTag = l.solid_primary ? `<span class="solid-tag solid-${l.solid_primary}">${l.solid_primary}</span>` : '';
  const primeTag = l.prime ? `<span class="prime-tag">${l.prime}</span>` : '';
  return `
    <article class="card">
      <div class="kind-row">
        <span class="kind ${l.kind}">${l.kind}</span>
        ${solidTag}
        ${primeTag}
        ${badge}
      </div>
      <h3><a href="listing.html?id=${encodeURIComponent(l.id)}">${escape(l.title)}</a></h3>
      <p>${escape(l.subtitle || l.description || '')}</p>
      <div class="tier">
        <span class="price">${price}</span>
        <span>${l.tiers?.[0]?.name || ''}</span>
      </div>
      <div class="actions">
        <a href="listing.html?id=${encodeURIComponent(l.id)}">Details</a>
        ${l.repo_url ? `<a href="${l.repo_url}" target="_blank" rel="noopener">Source</a>` : ''}
        ${l.playground_url ? `<a href="${l.playground_url}" target="_blank" rel="noopener">Try it</a>` : ''}
        ${l.install?.mcp ? `<button class="copy-mcp" data-cmd="${escapeAttr(l.install.mcp)}">Copy MCP</button>` : ''}
      </div>
    </article>
  `;
}

function escape(s) { return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function escapeAttr(s) { return escape(s).replace(/"/g, '&quot;'); }

document.getElementById('q')?.addEventListener('input', e => { state.q = e.target.value; render(); });
document.getElementById('sort')?.addEventListener('change', e => { state.sort = e.target.value; render(); });

load();
