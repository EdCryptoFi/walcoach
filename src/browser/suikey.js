/**
 * The only crypto the browser needs for per-user Walrus Memory accounts:
 * generate an Ed25519 key, derive its Sui address, and sign a transaction.
 * Bundled to public/vendor/suikey.js so the CSP stays script-src 'self'.
 */
import { getPublicKeyAsync, signAsync, utils } from "@noble/ed25519";
import { blake2b } from "@noble/hashes/blake2.js";

const FLAG_ED25519 = 0x00;
const hex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
const unhex = (s) => Uint8Array.from(s.replace(/^0x/, "").match(/.{2}/g).map((h) => parseInt(h, 16)));
const b64 = (b) => btoa(String.fromCharCode(...b));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function generateKey() {
  const secret = utils.randomSecretKey();
  return { secret: hex(secret), address: await addressOf(secret) };
}

export async function addressOf(secret) {
  const pub = await getPublicKeyAsync(typeof secret === "string" ? unhex(secret) : secret);
  const data = new Uint8Array(1 + pub.length);
  data[0] = FLAG_ED25519;
  data.set(pub, 1);
  return "0x" + hex(blake2b(data, { dkLen: 32 }));
}

/**
 * Signs transaction bytes the way Sui expects: blake2b-256 over the intent
 * message, Ed25519, then flag || signature || public key, base64.
 */
export async function signTransaction(secretHex, txBytesB64) {
  const secret = unhex(secretHex);
  const tx = unb64(txBytesB64);
  const intent = new Uint8Array(3 + tx.length); // [TransactionData, V0, Sui]
  intent.set([0, 0, 0], 0);
  intent.set(tx, 3);
  const digest = blake2b(intent, { dkLen: 32 });
  const sig = await signAsync(digest, secret);
  const pub = await getPublicKeyAsync(secret);
  const out = new Uint8Array(1 + sig.length + pub.length);
  out[0] = FLAG_ED25519;
  out.set(sig, 1);
  out.set(pub, 1 + sig.length);
  return b64(out);
}

export const looksLikeSecret = (s) => /^[0-9a-f]{64}$/i.test(String(s || "").trim());

/**
 * The string the user saves. Carries the secret and the account it owns, so a
 * restore on another device needs nothing but this one value: wal_<base64url>.
 */
export function encodeMemoryKey(secretHex, accountId) {
  const raw = new Uint8Array(64);
  raw.set(unhex(secretHex), 0);
  raw.set(unhex(accountId), 32);
  return "wal_" + b64(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeMemoryKey(key) {
  const body = String(key || "").trim().replace(/^wal_/, "").replace(/-/g, "+").replace(/_/g, "/");
  const raw = unb64(body + "=".repeat((4 - (body.length % 4)) % 4));
  if (raw.length !== 64) throw new Error("bad memory key");
  return { secret: hex(raw.slice(0, 32)), accountId: "0x" + hex(raw.slice(32)) };
}

export const looksLikeMemoryKey = (s) => /^wal_[A-Za-z0-9_-]{80,100}$/.test(String(s || "").trim());
