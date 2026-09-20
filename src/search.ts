/**
 * Web search via Tavily, exposed to the model as a tool. The coach only calls
 * it for questions that depend on current, local or factual information;
 * habits, motivation and planning never trigger a search.
 */
import { config } from "./config.js";

export const searchEnabled = Boolean(config.tavilyKey);

export interface Source { title: string; url: string }

export interface SearchResult { context: string; sources: Source[] }

export type TimeRange = "day" | "week" | "month" | "year";

export async function webSearch(query: string, timeRange?: TimeRange, maxResults = 4): Promise<SearchResult> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    // Basic depth = 1 credit. time_range is free and keeps "this week" questions fresh.
    body: JSON.stringify({ api_key: config.tavilyKey, query, max_results: maxResults, search_depth: "basic", include_answer: false, ...(timeRange ? { time_range: timeRange } : {}) }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Tavily ${res.status}`);
  const data = (await res.json()) as { results?: Array<{ title: string; url: string; content: string }> };
  const results = (data.results ?? []).slice(0, maxResults);
  const context = results.map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.content.slice(0, 600)}`).join("\n\n");
  return { context: context || "No results.", sources: results.map((r) => ({ title: r.title.slice(0, 120), url: r.url })) };
}

/** Read one page the user linked. 1 credit per 5 URLs. */
export async function extractPage(url: string): Promise<SearchResult> {
  const res = await fetch("https://api.tavily.com/extract", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ api_key: config.tavilyKey, urls: [url] }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Tavily extract ${res.status}`);
  const data = (await res.json()) as { results?: Array<{ url: string; raw_content: string }>; failed_results?: unknown[] };
  const page = data.results?.[0];
  if (!page) return { context: "Could not read that page.", sources: [] };
  return { context: `[1] ${page.url}\n${page.raw_content.slice(0, 6000)}`, sources: [{ title: page.url.replace(/^https?:\/\//, "").slice(0, 80), url: page.url }] };
}

export const extractTool = {
  type: "function" as const,
  function: {
    name: "read_page",
    description: "Read the content of a web page the user pasted a link to, so you can discuss it with them (a training plan, an article, a recipe, an event page). Only for URLs the user provided.",
    parameters: { type: "object", properties: { url: { type: "string", description: "The exact URL the user pasted." } }, required: ["url"] },
  },
};

export const searchTool = {
  type: "function" as const,
  function: {
    name: "web_search",
    description:
      "Search the web for current, local or factual information the user asked for (events, races, prices, opening hours, news, specific products, how-to details you are not sure about). Do NOT use it for coaching, motivation, habits, planning or anything you can answer from the conversation and memories.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "A specific search query, in the language most likely to have good results (include city/country when relevant)." },
        time_range: { type: "string", enum: ["day", "week", "month", "year"], description: "Only when the question is about a recent period (today, this week, this month). Omit otherwise." },
      },
      required: ["query"],
    },
  },
};
