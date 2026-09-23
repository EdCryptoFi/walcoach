import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var ${name}. Copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
  return value;
}

export const config = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  groqApiKey: required("GROQ_API_KEY"),
  groqModel: process.env.GROQ_MODEL ?? "qwen/qwen3.8-27b",
  memwalKey: required("MEMWAL_PRIVATE_KEY"),
  memwalAccountId: required("MEMWAL_ACCOUNT_ID"),
  memwalServerUrl: process.env.MEMWAL_SERVER_URL ?? "https://relayer.memory.walrus.xyz",
  namespacePrefix: process.env.MEMWAL_NAMESPACE_PREFIX ?? "coach",
  botName: process.env.BOT_NAME ?? "Coach",
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? "",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? "",
  vapidSubject: process.env.VAPID_SUBJECT ?? "mailto:hello@example.com",
  tavilyKey: process.env.TAVILY_API_KEY ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",
  sponsorKey: process.env.SUI_SPONSOR_KEY ?? "",
  memwalPackageId: process.env.MEMWAL_PACKAGE_ID ?? "0xe7c16fbea0560e7057e2bf7422feaa4fb313749fc69c9e9092fac7a33b81d7f5",
  memwalRegistryId: process.env.MEMWAL_REGISTRY_ID ?? "0x8bf82c9e09e36b8d1c38298f68b7cb68e7b8762887e7592add9986d5e9cf199f",
  memwalAgentPublicKey: process.env.MEMWAL_AGENT_PUBLIC_KEY ?? "",
  // Seed for the per-account delegate keys. One key per user account, derived,
  // never stored: the relayer resolves the account from the delegate key, so a
  // shared key would put every account owner in the same pool.
  delegateSeed: process.env.DELEGATE_KEY_SEED ?? "",
  extractor: (process.env.MEMORY_EXTRACTOR === "relayer" ? "relayer" : "llm") as "llm" | "relayer",
};
