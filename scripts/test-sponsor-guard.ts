/**
 * Checks the sponsor guard in src/accounts.ts: the two calls we offer are accepted,
 * anything else is refused before the sponsor key is used. Nothing is executed
 * except one real create_account, so the legitimate delegate case can be built for
 * an account whose owner key this script holds. That costs about 0.0043 SUI.
 *
 *   npx tsx scripts/test-sponsor-guard.ts
 */
import "dotenv/config";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { config } from "../src/config.js";
import { accountFromDigest, assertSponsorable, delegateFor, execute, prepareCreate } from "../src/accounts.js";
const CLOCK = "0x0000000000000000000000000000000000000000000000000000000000000006";
const client = new SuiGrpcClient({ network: "mainnet", baseUrl: "https://fullnode.mainnet.sui.io" });
const sponsorAddr = Ed25519Keypair.fromSecretKey(config.sponsorKey).getPublicKey().toSuiAddress();
let victim = "";
const attacker = new Ed25519Keypair().getPublicKey().toSuiAddress();

async function bytesOf(fill: (tx: Transaction) => void, budget = 20_000_000, gasOwner = sponsorAddr, sender = attacker) {
  const tx = new Transaction();
  fill(tx);
  tx.setSender(sender); tx.setGasOwner(gasOwner); tx.setGasBudget(budget);
  // Production's own prepare leaves the payment empty and the node picks the
  // sponsor's coins, which is exactly what makes the drain reachable.
  tx.setGasPayment([]);
  return Buffer.from(await tx.build({ client })).toString("base64");
}
function check(label: string, b64: string, shouldPass: boolean) {
  let err: string | null = null;
  try { assertSponsorable(b64); } catch (e) { err = (e as Error).message; }
  const passed = err === null;
  const verdict = passed === shouldPass ? "PASS" : "**FAIL**";
  console.log(`${verdict}  ${label.padEnd(42)} ${passed ? "accepted" : "refused: " + err}`);
}
async function main() {
  // A fresh account whose owner key we hold, so the legitimate delegate call resolves.
  const owner = new Ed25519Keypair();
  const createBytes = await prepareCreate(owner.getPublicKey().toSuiAddress());
  const digest = await execute(createBytes, (await owner.signTransaction(Uint8Array.from(Buffer.from(createBytes, "base64")))).signature);
  victim = await accountFromDigest(digest);
  console.log("test account:", victim, "\n");

  check("legit create_account", await prepareCreate(attacker), true);
  check("legit add_delegate_key", await bytesOf((tx) => tx.moveCall({
    target: `${config.memwalPackageId}::account::add_delegate_key`,
    arguments: [tx.object(victim), tx.object(config.memwalRegistryId),
      tx.pure.vector("u8", Array.from(delegateFor(victim).getPublicKey().toRawBytes())),
      tx.pure.string("WalCoach"), tx.object(CLOCK)] }), 20_000_000, sponsorAddr, owner.getPublicKey().toSuiAddress()), true);
  check("gas drain: transfer the gas coin", await bytesOf((tx) => tx.transferObjects([tx.gas], attacker)), false);
  check("gas drain with a huge budget", await bytesOf((tx) => tx.transferObjects([tx.gas], attacker), 500_000_000), false);
  check("someone else's delegate key", await bytesOf((tx) => tx.moveCall({
    target: `${config.memwalPackageId}::account::add_delegate_key`,
    arguments: [tx.object(victim), tx.object(config.memwalRegistryId),
      tx.pure.vector("u8", Array.from(new Ed25519Keypair().getPublicKey().toRawBytes())),
      tx.pure.string("WalCoach"), tx.object(CLOCK)] }), 20_000_000, sponsorAddr, owner.getPublicKey().toSuiAddress()), false);
  check("our call plus a gas transfer", await bytesOf((tx) => {
    tx.moveCall({ target: `${config.memwalPackageId}::account::create_account`, arguments: [tx.object(config.memwalRegistryId), tx.object(CLOCK)] });
    tx.transferObjects([tx.gas], attacker);
  }), false);
  check("a call to another package", await bytesOf((tx) => tx.moveCall({ target: "0x2::clock::timestamp_ms", arguments: [tx.object(CLOCK)] }), 20_000_000, sponsorAddr, attacker), false);
  check("gas owner is not the sponsor", await bytesOf((tx) => tx.moveCall({ target: `${config.memwalPackageId}::account::create_account`, arguments: [tx.object(config.memwalRegistryId), tx.object(CLOCK)] }), 20_000_000, attacker, attacker), false);
}
main().catch((e) => console.error("ERR", e.message?.slice(0, 200)));
