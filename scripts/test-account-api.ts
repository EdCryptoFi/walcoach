/**
 * Exercises the per-user account endpoints exactly like the browser will:
 * generate a key, ask the server for unsigned transactions, sign them locally,
 * hand them back, then talk to the coach as the owner of that new account.
 */
import "dotenv/config";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

const BASE = process.env.BASE ?? "http://localhost:3170";
const post = async (path: string, body: unknown) => {
  const r = await fetch(BASE + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${path} -> ${r.status} ${JSON.stringify(j).slice(0, 200)}`);
  return j as Record<string, string>;
};

const user = new Ed25519Keypair();
const address = user.getPublicKey().toSuiAddress();
console.log("user address:", address);

const sign = async (txBytes: string) =>
  (await user.signTransaction(Uint8Array.from(Buffer.from(txBytes, "base64")))).signature;

const create = await post("/api/account/prepare", { address, step: "create" });
const created = await post("/api/account/execute", { txBytes: create.txBytes, signature: await sign(create.txBytes), step: "create" });
console.log("accountId:", created.accountId);

const del = await post("/api/account/prepare", { address, step: "delegate", accountId: created.accountId });
await post("/api/account/execute", { txBytes: del.txBytes, signature: await sign(del.txBytes), step: "delegate" });
console.log("delegate authorised");

const chat = await post("/api/chat", { userId: created.accountId, name: "Owner", text: "I train Tuesdays and Thursdays at 6am and my left knee is sensitive.", history: [], context: "training" });
console.log("reply:", String(chat.reply).slice(0, 120));
console.log("facts:", chat.facts);

console.log("waiting 60s for the write to index…");
await new Promise((r) => setTimeout(r, 60_000));
const mem = await post("/api/memories", { userId: created.accountId }) as unknown as { memories: Array<{ text: string }>; namespace: string; owned: boolean };
console.log("owned:", mem.owned, "| namespace:", mem.namespace);
console.log("memories:", mem.memories.map((m) => m.text.slice(0, 70)));
const back = await post("/api/chat", { userId: created.accountId, name: "Owner", text: "what days do I train?", history: [], context: "training" });
console.log("recall reply:", String(back.reply).slice(0, 160));
console.log("explorer:", `https://suiscan.xyz/mainnet/object/${created.accountId}`);
