import { TavilySearch } from '@langchain/tavily';

/**
 * Creates a Tavily search tool optimized for financial research.
 * Uses the 'finance' topic mode for better financial context.
 *
 * This module uses @langchain/tavily (standalone package) which is
 * the recommended approach for LangChain >=0.3
 */
export function createFinancialSearchTool() {
  return new TavilySearch({
    maxResults: 5,
    tavilyApiKey: process.env.TAVILY_API_KEY,
    apiKey: process.env.TAVILY_API_KEY,
    topic: 'finance',
    includeAnswer: true,
    includeRawContent: false,
  });
}

/**
 * Creates a Tavily search tool for general news and sentiment.
 */
export function createNewsSearchTool() {
  return new TavilySearch({
    maxResults: 4,
    tavilyApiKey: process.env.TAVILY_API_KEY,
    apiKey: process.env.TAVILY_API_KEY,
    topic: 'news',
    includeAnswer: true,
    includeRawContent: false,
  });
}

/**
 * Runs a single Tavily search and returns structured results.
 * @param {TavilySearch} tool
 * @param {string} query
 * @returns {Promise<{sources: Array, answer: string}>}
 */
export async function runSearch(tool, query) {
  try {
    const searchInput = typeof query === 'string' ? { query } : query;
    const rawResult = await tool.invoke(searchInput);

    // Handle different return formats across LangChain versions
    let results = [];
    let directAnswer = '';

    if (typeof rawResult === 'string') {
      try {
        const parsed = JSON.parse(rawResult);
        if (Array.isArray(parsed)) {
          results = parsed;
        } else if (parsed && typeof parsed === 'object') {
          results = parsed.results || [];
          directAnswer = parsed.answer || '';
        }
      } catch {
        results = [{ content: rawResult, url: '', title: 'Search Result' }];
      }
    } else if (Array.isArray(rawResult)) {
      results = rawResult;
    } else if (rawResult && typeof rawResult === 'object') {
      results = rawResult.results || (Array.isArray(rawResult.content) ? rawResult.content : []);
      directAnswer = rawResult.answer || '';
    }

    const sources = results.map((r) => ({
      url: r.url || '',
      title: r.title || r.url || 'Source',
      content: r.content || '',
    }));

    const answer = directAnswer || results
      .slice(0, 3)
      .map((r) => r.content || '')
      .filter(Boolean)
      .join('\n\n');

    return { sources, answer };
  } catch (error) {
    console.error(`Tavily search error for query "${typeof query === 'string' ? query : query?.query}":`, error.message);
    return { sources: [], answer: '' };
  }
}
