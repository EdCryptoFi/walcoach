/** Prints per-user usage: messages sent and facts stored on Walrus. */
import { stats } from "../src/stats.js";

const rows = Object.entries(stats.all()).map(([id, s]) => ({
  user: `${s.name} (${id})`,
  messages: s.messages,
  facts: s.facts,
  firstSeen: s.firstSeen.slice(0, 10),
  lastSeen: s.lastSeen.slice(0, 10),
}));
if (rows.length === 0) console.log("No usage yet.");
else console.table(rows);
