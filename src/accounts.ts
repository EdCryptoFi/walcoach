/**
 * Per-user Walrus Memory accounts.
 *
 * The browser holds an Ed25519 key (its "memory key"). The account it creates is
 * owned by that key, so the user owns the blobs; WalCoach is added as a delegate
 * so the coach can read and write, and the user can revoke it. Gas is paid by the
 * project's sponsor wallet through a sponsored transaction, so the user never
 * needs SUI and never sees a wallet.
 *
 * Flow: prepare(create) -> browser signs -> execute(create) -> prepare(delegate)
 *       -> browser signs -> execute(delegate).
 */
import { createHmac } from "node:crypto";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { config } from "./config.js";
import { log } from "./log.js";

const CLOCK = "0x0000000000000000000000000000000000000000000000000000000000000006";
const GRAPHQL = "https://graphql.mainnet.sui.io/graphql";
/** Stop creating accounts if the sponsor drops below this, so we never strand a half-made user. */
const MIN_SPONSOR_BALANCE = 0.05;

export const accountsEnabled = Boolean(config.sponsorKey && config.memwalPackageId && config.memwalRegistryId && config.delegateSeed);

const client = new SuiGrpcClient({ network: "mainnet", baseUrl: "https://fullnode.mainnet.sui.io" });
const sponsor = () => Ed25519Keypair.fromSecretKey(config.sponsorKey);

export const isAccountId = (s: string) => /^0x[0-9a-f]{64}$/i.test(s);
const isAddress = isAccountId;

export async function sponsorBalance(): Promise<number> {
  const b = await client.core.getBalance({ owner: sponsor().getPublicKey().toSuiAddress(), coinType: "0x2::sui::SUI" });
  return Number((b as { balance?: { balance?: string } }).balance?.balance ?? 0) / 1e9;
}

/** Builds an unsigned sponsored transaction for the browser to sign. */
async function build(address: string, fill: (tx: Transaction) => void): Promise<string> {
  const tx = new Transaction();
  fill(tx);
  tx.setSender(address);
  tx.setGasOwner(sponsor().getPublicKey().toSuiAddress());
  tx.setGasBudget(20_000_000);
  return Buffer.from(await tx.build({ client })).toString("base64");
}

export function prepareCreate(address: string) {
  if (!isAddress(address)) throw new Error("invalid address");
  return build(address, (tx) =>
    tx.moveCall({ target: `${config.memwalPackageId}::account::create_account`, arguments: [tx.object(config.memwalRegistryId), tx.object(CLOCK)] }),
  );
}

/**
 * The delegate key WalCoach uses inside one user's account.
 *
 * It has to be unique per account: the relayer resolves which account a request
 * belongs to from the delegate key alone and ignores the account id we send, so
 * one key registered on many accounts puts all of them in a single pool. The key
 * is derived from a server seed instead of stored, so there is still no database.
 */
export function delegateFor(accountId: string): Ed25519Keypair {
  if (!config.delegateSeed) throw new Error("DELEGATE_KEY_SEED is not configured");
  const seed = createHmac("sha256", config.delegateSeed).update(`memwal-delegate:${accountId.toLowerCase()}`).digest();
  return Ed25519Keypair.fromSecretKey(Uint8Array.from(seed));
}

/** The same key as a string the MemWal SDK accepts. */
export const delegateSecretFor = (accountId: string) => delegateFor(accountId).getSecretKey();
export const delegatePublicKeyFor = (accountId: string) => Buffer.from(delegateFor(accountId).getPublicKey().toRawBytes()).toString("hex");

export function prepareDelegate(address: string, accountId: string, label = "WalCoach") {
  if (!isAddress(address) || !isAccountId(accountId)) throw new Error("invalid address or account");
  const pk = Array.from(delegateFor(accountId).getPublicKey().toRawBytes());
  return build(address, (tx) =>
    tx.moveCall({
      target: `${config.memwalPackageId}::account::add_delegate_key`,
      arguments: [tx.object(accountId), tx.object(config.memwalRegistryId), tx.pure.vector("u8", pk), tx.pure.string(label.slice(0, 32)), tx.object(CLOCK)],
    }),
  );
}

/** Co-signs with the sponsor and executes. Returns the transaction digest. */
export async function execute(txBytesB64: string, userSignature: string): Promise<string> {
  const bytes = Uint8Array.from(Buffer.from(txBytesB64, "base64"));
  const sponsorSig = (await sponsor().signTransaction(bytes)).signature;
  const res = await client.core.executeTransaction({ transaction: bytes, signatures: [userSignature, sponsorSig] });
  const t = ((res as { Transaction?: unknown }).Transaction ?? res) as { digest: string; status: { success: boolean; error?: unknown } };
  if (!t.status.success) throw new Error(`transaction failed: ${JSON.stringify(t.status).slice(0, 200)}`);
  return t.digest;
}

/** Reads back the MemWalAccount created by a transaction (the execute call returns status only). */
export async function accountFromDigest(digest: string): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const r = await fetch(GRAPHQL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: `{ transactionEffects(digest: "${digest}") { objectChanges(first: 20) { nodes { address idCreated outputState { asMoveObject { contents { type { repr } } } } } } } }` }),
      signal: AbortSignal.timeout(15_000),
    }).then((x) => x.json() as Promise<{ data?: { transactionEffects?: { objectChanges: { nodes: Array<{ address: string; idCreated: boolean; outputState?: { asMoveObject?: { contents?: { type?: { repr?: string } } } } }> } } } }>);
    const found = (r.data?.transactionEffects?.objectChanges.nodes ?? []).find(
      (n) => n.idCreated && (n.outputState?.asMoveObject?.contents?.type?.repr ?? "").includes("::account::MemWalAccount"),
    );
    if (found) return found.address;
    await new Promise((res) => setTimeout(res, 2500));
  }
  throw new Error(`account object not found for ${digest}`);
}

export async function guardSponsor() {
  const balance = await sponsorBalance();
  if (balance < MIN_SPONSOR_BALANCE) {
    log.warn("sponsor.low", { balance });
    throw new Error("Account creation is paused right now. Try again later.");
  }
  return balance;
}

/** Finds the MemWalAccount owned by an address, so a restored key can find its account. */
export async function accountOfOwner(address: string): Promise<string | null> {
  if (!isAddress(address)) throw new Error("invalid address");
  const r = await fetch(GRAPHQL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: `{ address(address: "${address}") { objects(first: 10) { nodes { address contents { type { repr } } } } } }` }),
    signal: AbortSignal.timeout(15_000),
  }).then((x) => x.json() as Promise<{ data?: { address?: { objects: { nodes: Array<{ address: string; contents?: { type?: { repr?: string } } }> } } } }>);
  const found = (r.data?.address?.objects.nodes ?? []).find((n) => (n.contents?.type?.repr ?? "").includes("::account::MemWalAccount"));
  return found?.address ?? null;
}

/**
 * Whether WalCoach's delegate key for this account is already registered on it.
 * Accounts created before per-account keys carry the old shared key instead, so
 * the browser repairs them with one more sponsored `add_delegate_key`.
 */
export async function hasDelegate(accountId: string): Promise<boolean> {
  if (!isAccountId(accountId)) throw new Error("invalid account");
  const want = Buffer.from(delegateFor(accountId).getPublicKey().toRawBytes()).toString("base64");
  const r = await fetch(GRAPHQL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: `{ object(address: "${accountId}") { asMoveObject { contents { json } } } }` }),
    signal: AbortSignal.timeout(15_000),
  }).then((x) => x.json() as Promise<{ data?: { object?: { asMoveObject?: { contents?: { json?: { delegate_keys?: Array<{ public_key?: string }> } } } } } }>);
  const keys = r.data?.object?.asMoveObject?.contents?.json?.delegate_keys ?? [];
  return keys.some((k) => k.public_key === want);
}
