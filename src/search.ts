/**
 * Web search via Tavily, exposed to the model as a tool. The coach only calls
 * it for questions that depend on current, local or factual information;
 * habits, motivation and planning never trigger a search.
 */
import { config } from "./config.js";

export const searchEnabled = Boolean(config.tavilyKey);

export interface Source { title: string; url: string }

export interface SearchResult { context: string; sources: Source[] }

export async function webSearch(query: string, maxResults = 4): Promise<SearchResult> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ api_key: config.tavilyKey, query, max_results: maxResults, search_depth: "basic", include_answer: false }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Tavily ${res.status}`);
  const data = (await res.json()) as { results?: Array<{ title: string; url: string; content: string }> };
  const results = (data.results ?? []).slice(0, maxResults);
  const context = results.map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.content.slice(0, 600)}`).join("\n\n");
  return { context: context || "No results.", sources: results.map((r) => ({ title: r.title.slice(0, 120), url: r.url })) };
}

export const searchTool = {
  type: "function" as const,
  function: {
    name: "web_search",
    description:
      "Search the web for current, local or factual information the user asked for (events, races, prices, opening hours, news, specific products, how-to details you are not sure about). Do NOT use it for coaching, motivation, habits, planning or anything you can answer from the conversation and memories.",
    parameters: {
      type: "object",
      properties: { query: { type: "string", description: "A specific search query, in the language most likely to have good results (include city/country when relevant)." } },
      required: ["query"],
    },
  },
};
