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
  extractor: (process.env.MEMORY_EXTRACTOR === "relayer" ? "relayer" : "llm") as "llm" | "relayer",
};
