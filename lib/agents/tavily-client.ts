/**
 * tavily-client.ts
 * Thin wrapper around the Tavily SDK for structured research searches.
 * Returns typed results with source URL, title, content snippet.
 */

import { TavilyClient } from 'tavily';

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilySearchResponse {
  query: string;
  results: TavilySearchResult[];
  answer?: string;    // Tavily AI-synthesised answer (when available)
}

let _client: TavilyClient | null = null;

function getClient(): TavilyClient {
  if (!_client) {
    const key = process.env.TAVILY_API_KEY;
    if (!key) throw new Error('TAVILY_API_KEY is not configured');
    _client = new TavilyClient({ apiKey: key });
  }
  return _client;
}

/**
 * Run a single Tavily search, returning up to `maxResults` results.
 * Never throws — on error it returns an empty results array.
 */
export async function tavilySearch(
  query: string,
  options: {
    maxResults?: number;
    includeAnswer?: boolean;
    searchDepth?: 'basic' | 'advanced';
  } = {},
): Promise<TavilySearchResponse> {
  const { maxResults = 5, includeAnswer = false, searchDepth = 'basic' } = options;

  try {
    const client = getClient();
    // Add a 15-second timeout to avoid hanging on slow queries
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const raw = await client.search({
      query,
      max_results: maxResults,
      include_answer: includeAnswer,
      search_depth: searchDepth,
    } as Parameters<typeof client.search>[0]);

    clearTimeout(timeout);

    return {
      query,
      results: (raw.results ?? []).map((r: Record<string, unknown>) => ({
        title: String(r.title ?? ''),
        url: String(r.url ?? ''),
        content: String(r.content ?? ''),
        score: Number(r.score ?? 0),
      })),
      answer: raw.answer as string | undefined,
    };
  } catch (err) {
    console.warn(`[tavily] Search failed for "${query}":`, (err as Error).message);
    return { query, results: [] };
  }
}

/**
 * Run multiple searches in parallel, capped at concurrency 3 to avoid
 * rate-limit errors on the free Tavily tier.
 */
export async function tavilySearchBatch(
  queries: Array<{ label: string; query: string; searchDepth?: 'basic' | 'advanced' }>,
  maxResults = 5,
): Promise<Map<string, TavilySearchResponse>> {
  const CONCURRENCY = 3;
  const resultMap = new Map<string, TavilySearchResponse>();

  // Process in chunks of CONCURRENCY
  for (let i = 0; i < queries.length; i += CONCURRENCY) {
    const chunk = queries.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(
      chunk.map(({ query, searchDepth }) =>
        tavilySearch(query, { maxResults, searchDepth }),
      ),
    );
    for (let j = 0; j < chunk.length; j++) {
      const { label } = chunk[j];
      const result = settled[j];
      if (result.status === 'fulfilled') {
        resultMap.set(label, result.value);
      } else {
        resultMap.set(label, { query: chunk[j].query, results: [] });
      }
    }
  }

  return resultMap;
}
