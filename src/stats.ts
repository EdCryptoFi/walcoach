/**
 * Local, plaintext-free evidence log: how many facts each user has stored.
 * Walrus is the source of truth; this exists so `pnpm stats` can print a
 * table for the hackathon write-up without hitting the relayer.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const FILE = new URL("../data/stats.json", import.meta.url).pathname;

interface UserStats {
  name: string;
  facts: number;
  messages: number;
  firstSeen: string;
  lastSeen: string;
}

type Stats = Record<string, UserStats>;

function load(): Stats {
  if (!existsSync(FILE)) return {};
  return JSON.parse(readFileSync(FILE, "utf8")) as Stats;
}

function save(data: Stats) {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function touch(data: Stats, userId: number, name: string): UserStats {
  const now = new Date().toISOString();
  const entry = data[userId] ?? { name, facts: 0, messages: 0, firstSeen: now, lastSeen: now };
  entry.name = name;
  entry.lastSeen = now;
  data[userId] = entry;
  return entry;
}

export const stats = {
  recordMessage(userId: number, name: string) {
    const data = load();
    touch(data, userId, name).messages += 1;
    save(data);
  },
  recordFacts(userId: number, name: string, facts: string[]) {
    const data = load();
    touch(data, userId, name).facts += facts.length;
    save(data);
  },
  all(): Stats {
    return load();
  },
};
