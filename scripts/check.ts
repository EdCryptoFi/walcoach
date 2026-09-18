/** Verifies credentials end-to-end: relayer health, a write, and a recall. */
import { memwal } from "../src/memory.js";

const ns = "coach-selfcheck";
const health = await memwal.health();
console.log("health:", health.status, health.version);

const stamp = new Date().toISOString();
const stored = await memwal.rememberAndWait(`Self-check memory written at ${stamp}`, ns, { timeoutMs: 45_000 });
console.log("stored blob:", stored.blob_id);

const recalled = await memwal.recall({ query: "self-check memory", namespace: ns, limit: 3 });
console.log("recall hits:", recalled.results.map((r) => `${r.distance.toFixed(3)} ${r.text}`));
console.log(recalled.results.some((r) => r.text.includes(stamp)) ? "OK: write + recall round-trip works" : "WARN: could not recall what we just wrote");
