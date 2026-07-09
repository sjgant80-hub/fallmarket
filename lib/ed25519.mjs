// Ed25519 sign/verify · Web Crypto (browser) / Node subtle (node 22+)
// Canonical JSON: keys sorted, no whitespace. sig field always stripped before hashing.

const subtle = globalThis.crypto?.subtle;
if (!subtle) throw new Error('Web Crypto SubtleCrypto not available');

const enc = new TextEncoder();

export function canonical(obj) {
  const strip = (o) => {
    if (Array.isArray(o)) return o.map(strip);
    if (o && typeof o === 'object') {
      const out = {};
      for (const k of Object.keys(o).sort()) {
        if (k === 'sig') continue;
        out[k] = strip(o[k]);
      }
      return out;
    }
    return o;
  };
  return JSON.stringify(strip(obj));
}

export async function generateKeypair() {
  const kp = await subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const pubRaw = new Uint8Array(await subtle.exportKey('raw', kp.publicKey));
  return { keypair: kp, pub: b64url(pubRaw), did: didKey(pubRaw) };
}

export async function sign(obj, privateKey) {
  const sig = await subtle.sign('Ed25519', privateKey, enc.encode(canonical(obj)));
  return b64url(new Uint8Array(sig));
}

export async function verify(obj, sigB64, publicKey) {
  const sig = fromB64url(sigB64);
  return subtle.verify('Ed25519', publicKey, sig, enc.encode(canonical(obj)));
}

// did:key format for Ed25519 · multibase-encoded ed25519-pub multicodec + raw pubkey
export function didKey(pubRaw) {
  // ed25519-pub multicodec = 0xed 0x01
  const prefixed = new Uint8Array(pubRaw.length + 2);
  prefixed[0] = 0xed; prefixed[1] = 0x01;
  prefixed.set(pubRaw, 2);
  return `did:key:z${base58btc(prefixed)}`;
}

function b64url(bytes) {
  let s = btoa(String.fromCharCode(...bytes));
  return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64url(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  return new Uint8Array([...bin].map(c => c.charCodeAt(0)));
}

// Base58btc encode · Bitcoin alphabet · unsigned bigint conversion
const ALPHA = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58btc(bytes) {
  let n = 0n;
  for (const b of bytes) n = (n << 8n) | BigInt(b);
  let s = '';
  while (n > 0n) { s = ALPHA[Number(n % 58n)] + s; n = n / 58n; }
  for (const b of bytes) { if (b !== 0) break; s = '1' + s; }
  return s;
}
