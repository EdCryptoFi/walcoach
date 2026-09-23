/**
 * Exercises the legacy-to-own-account migration exactly like the browser does:
 * store a fact under a legacy `web-` key, create an account the user owns,
 * call /api/migrate, then poll until the fact is readable in the new account.
 */
import "dotenv/config";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

const BASE = process.env.BASE ?? "http://localhost:3000";
const post = async (path: string, body: unknown) => {
  const r = await fetch(BASE + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (!r.ok) throw new Error(`${path} -> ${r.status} ${JSON.stringify(j).slice(0, 200)}`);
  return j;
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const legacyId = "web-migr-" + Math.random().toString(36).slice(2, 6) + "-test-user";
const FACT = "Migration test user trains on Tuesdays and prefers chords in tab format.";

console.log("legacy id:", legacyId);
await post("/api/remember", { userId: legacyId, name: "Migrante", fact: FACT });
console.log("stored one fact in the shared account, waiting for it to index…");
for (let i = 0; i < 20; i++) {
  const m = (await post("/api/memories", { userId: legacyId })) as { memories: unknown[] };
  if (m.memories.length > 0) { console.log(`legacy memories: ${m.memories.length}`); break; }
  await sleep(5000);
}

const user = new Ed25519Keypair();
const address = user.getPublicKey().toSuiAddress();
const sign = async (txBytes: string) => (await user.signTransaction(Uint8Array.from(Buffer.from(txBytes, "base64")))).signature;
const create = (await post("/api/account/prepare", { address, step: "create" })) as { txBytes: string };
const made = (await post("/api/account/execute", { txBytes: create.txBytes, signature: await sign(create.txBytes), step: "create" })) as { accountId: string };
const del = (await post("/api/account/prepare", { address, step: "delegate", accountId: made.accountId })) as { txBytes: string };
await post("/api/account/execute", { txBytes: del.txBytes, signature: await sign(del.txBytes), step: "delegate" });
console.log("own account:", made.accountId, "owner:", address);

const moved = await post("/api/migrate", { userId: legacyId, accountId: made.accountId });
console.log("migrate:", JSON.stringify(moved));

for (let i = 0; i < 24; i++) {
  const m = (await post("/api/memories", { userId: made.accountId })) as { memories: Array<{ text: string }>; owned: boolean };
  if (m.memories.length > 0) {
    console.log("owned:", m.owned, "| moved memories:", m.memories.map((x) => x.text.slice(0, 70)));
    console.log("explorer:", `https://suiscan.xyz/mainnet/object/${made.accountId}`);
    process.exit(0);
  }
  await sleep(5000);
}
console.log("!! nothing readable in the new account after 2 minutes");
process.exit(1);
