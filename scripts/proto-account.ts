/**
 * Prototype for per-user Walrus Memory accounts (level 2).
 *
 * Proves three things with one throwaway user:
 *  1. a sponsored transaction can create an account owned by the user, with the
 *     project treasury paying gas, so the user never needs SUI or a wallet;
 *  2. the WalCoach delegate key can be authorised on that fresh account;
 *  3. the relayer accepts an account created outside the dashboard.
 *
 * Run: npx tsx scripts/proto-account.ts
 */
import "dotenv/config";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { MemWal } from "@mysten-incubation/memwal";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";

const PACKAGE = process.env.MEMWAL_PACKAGE_ID!;
const REGISTRY = process.env.MEMWAL_REGISTRY_ID!;
const CLOCK = "0x0000000000000000000000000000000000000000000000000000000000000006";
const client = new SuiGrpcClient({ network: "mainnet", baseUrl: "https://fullnode.mainnet.sui.io" });

const sponsor = Ed25519Keypair.fromSecretKey(process.env.SUI_SPONSOR_KEY!);
const user = new Ed25519Keypair(); // stands in for a browser-generated key
console.log("sponsor:", sponsor.getPublicKey().toSuiAddress());
console.log("user   :", user.getPublicKey().toSuiAddress());

/** Builds, signs (user + sponsor) and executes a sponsored transaction. */
async function sponsored(build: (tx: Transaction) => void, label: string) {
  const tx = new Transaction();
  build(tx);
  tx.setSender(user.getPublicKey().toSuiAddress());
  tx.setGasOwner(sponsor.getPublicKey().toSuiAddress());
  tx.setGasBudget(20_000_000);
  const bytes = await tx.build({ client });                 // same bytes the browser would sign
  const userSig = (await user.signTransaction(bytes)).signature;
  const sponsorSig = (await sponsor.signTransaction(bytes)).signature;
  const res = await client.core.executeTransaction({ transaction: bytes, signatures: [userSig, sponsorSig] });
  const t = ((res as { Transaction?: unknown }).Transaction ?? res) as { digest: string; status: { success: boolean; error?: unknown } };
  console.log(`${label}: ${t.status.success ? "ok" : "FAILED " + JSON.stringify(t.status).slice(0, 200)} (${t.digest})`);
  if (!t.status.success) process.exit(1);
  return t.digest;
}

// 1. create the account, owned by the user, gas paid by the sponsor
const digest = await sponsored((tx) => {
  tx.moveCall({ target: `${PACKAGE}::account::create_account`, arguments: [tx.object(REGISTRY), tx.object(CLOCK)] });
}, "create_account");

// The execute call returns status only, so read the created object back from the chain.
const accountId = await (async () => {
  for (let i = 0; i < 12; i++) {
    const q = await fetch("https://graphql.mainnet.sui.io/graphql", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: `{ transactionEffects(digest: "${digest}") { objectChanges(first: 20) { nodes { address idCreated outputState { asMoveObject { contents { type { repr } } } } } } } }` }),
    }).then((r) => r.json() as Promise<{ data?: { transactionEffects?: { objectChanges: { nodes: Array<{ address: string; idCreated: boolean; outputState?: { asMoveObject?: { contents?: { type?: { repr?: string } } } } }> } } } }>);
    const nodes = q.data?.transactionEffects?.objectChanges.nodes ?? [];
    const acc = nodes.find((n) => n.idCreated && (n.outputState?.asMoveObject?.contents?.type?.repr ?? "").includes("::account::MemWalAccount"));
    if (acc) return acc.address;
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error("account object not found for " + digest);
})();
console.log("accountId:", accountId);

// 2. authorise WalCoach's existing delegate key on it
const creds = JSON.parse(readFileSync(`${homedir()}/.memwal/credentials.json`, "utf8"));
const pk: number[] = Array.from(Buffer.from(creds.delegatePublicKeyHex, "hex"));
await sponsored((tx) => {
  tx.moveCall({
    target: `${PACKAGE}::account::add_delegate_key`,
    arguments: [tx.object(accountId), tx.object(REGISTRY), tx.pure.vector("u8", pk), tx.pure.string("WalCoach"), tx.object(CLOCK)],
  });
}, "add_delegate_key");

// 3. does the relayer accept this brand new account with our existing delegate key?
const memwal = MemWal.create({
  key: process.env.MEMWAL_PRIVATE_KEY!,
  accountId,
  serverUrl: process.env.MEMWAL_SERVER_URL,
  namespace: "proto",
});
console.log("health:", (await memwal.health()).status);
const stored = await memwal.rememberAndWait("Prototype user owns this account and trains on Tuesdays.", "proto", { timeoutMs: 90_000 });
console.log("wrote blob:", stored.blob_id);
const hit = await memwal.recall({ query: "when does the user train?", namespace: "proto", limit: 3 });
console.log("recall:", hit.results.map((r) => `${r.distance.toFixed(3)} ${r.text}`));
console.log("\nexplorer:", `https://suiscan.xyz/mainnet/object/${accountId}`);
