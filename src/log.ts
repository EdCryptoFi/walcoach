/**
 * Structured logging. Every line is one JSON object on stdout (info) or
 * stderr (warn/error), that is what Vercel and `vercel logs` collect. When
 * the filesystem is writable (local dev) the same lines are also appended to
 * logs/app.log and logs/error.log so `npm run logs` can show them.
 */
import { appendFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

type Level = "info" | "warn" | "error";
const DIR = fileURLToPath(new URL("../logs/", import.meta.url));
let fsOk: boolean | null = null;

function write(level: Level, event: string, fields: Record<string, unknown>) {
  const line = JSON.stringify({ t: new Date().toISOString(), level, event, ...fields });
  (level === "info" ? console.log : console.error)(line);
  if (fsOk === false) return;
  try {
    if (fsOk === null) { mkdirSync(DIR, { recursive: true }); fsOk = true; }
    appendFileSync(DIR + "app.log", line + "\n");
    if (level !== "info") appendFileSync(DIR + "error.log", line + "\n");
  } catch {
    fsOk = false; // read-only filesystem (serverless): stdout/stderr is enough
  }
}

const errFields = (err: unknown) => {
  const e = err as { message?: string; status?: number; stack?: string };
  return { error: (e?.message ?? String(err)).slice(0, 400), status: e?.status };
};

export const log = {
  info: (event: string, fields: Record<string, unknown> = {}) => write("info", event, fields),
  warn: (event: string, fields: Record<string, unknown> = {}) => write("warn", event, fields),
  error: (event: string, err?: unknown, fields: Record<string, unknown> = {}) => write("error", event, { ...fields, ...(err !== undefined ? errFields(err) : {}) }),
};
