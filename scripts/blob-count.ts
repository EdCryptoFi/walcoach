/**
 * Counts blobs written on Walrus mainnet per namespace, for the hackathon proof
 * ("agent ID + blob count"). Uses restore(namespace, 1), whose `total` is every
 * on-chain blob the relayer sees for (owner, namespace); limit 1 keeps it cheap.
 */
process.env.TELEGRAM_BOT_TOKEN ||= "unused";
const { memwal, namespaceFor } = await import("../src/memory.js");
const { stats } = await import("../src/stats.js");
const { config } = await import("../src/config.js");

const ids = Object.keys(stats.all());
const namespaces = [...new Set([...ids.map((id) => namespaceFor(id)), `${config.namespacePrefix}-push`])];
let total = 0;
for (const ns of namespaces) {
  try {
    const r = await memwal.restore(ns, 1);
    if (r.total > 0) console.log(`${String(r.total).padStart(4)}  ${ns}`);
    total += r.total;
  } catch (err) {
    const msg = (err as Error).message;
    if (/429/.test(msg)) { console.error(`  wait ${ns} (rate limited), retrying in 60s`); await new Promise((r) => setTimeout(r, 60000)); try { const r2 = await memwal.restore(ns, 1); if (r2.total > 0) console.log(`${String(r2.total).padStart(4)}  ${ns}`); total += r2.total; } catch { console.error(`  err  ${ns}`); } }
    else console.error(`  err  ${ns}: ${msg.slice(0, 80)}`);
  }
  await new Promise((r) => setTimeout(r, 12000)); // restore is heavily rate limited
}
console.log(`\nAccount (agent) id: ${config.memwalAccountId}`);
console.log(`Namespaces counted: ${namespaces.length}`);
console.log(`Blobs on Walrus mainnet: ${total}`);
