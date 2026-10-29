import { TavilySearch } from '@langchain/tavily';

/**
 * financialSearch.js — Dedicated financial data search tool.
 *
 * Separate from tavilySearch.js — this tool is tuned specifically for
 * structured financial data: earnings, revenue, margins, P/E ratios,
 * analyst ratings, and SEC filings.
 *
 * Used by the riskAssessor and researcher nodes when financial
 * specificity matters more than general news coverage.
 */

/**
 * Creates a Tavily search tool optimized for hard financial metrics.
 * Biases toward financial data sites: SEC, earnings reports, analyst notes.
 */
export function createFinancialDataTool() {
  return new TavilySearch({
    maxResults: 6,
    tavilyApiKey: process.env.TAVILY_API_KEY,
    apiKey: process.env.TAVILY_API_KEY,
    topic: 'finance',
    includeAnswer: true,
    includeRawContent: false,
    includeDomains: [
      'finance.yahoo.com',
      'sec.gov',
      'macrotrends.net',
      'wsj.com',
      'bloomberg.com',
      'reuters.com',
      'investopedia.com',
      'seekingalpha.com',
      'marketwatch.com',
      'barrons.com',
    ],
  });
}

/**
 * Creates a Tavily search tool for analyst ratings and price targets.
 */
export function createAnalystRatingsTool() {
  return new TavilySearch({
    maxResults: 4,
    tavilyApiKey: process.env.TAVILY_API_KEY,
    apiKey: process.env.TAVILY_API_KEY,
    topic: 'finance',
    includeAnswer: true,
    includeRawContent: false,
    includeDomains: [
      'finance.yahoo.com',
      'tipranks.com',
      'marketbeat.com',
      'benzinga.com',
      'thestreet.com',
    ],
  });
}

/**
 * Searches for recent earnings results and financial guidance.
 * @param {string} companyName
 * @returns {Promise<{sources: Array, answer: string}>}
 */
export async function searchEarnings(companyName) {
  const tool = createFinancialDataTool();
  const query = `${companyName} latest earnings results revenue EPS guidance financial results 2025`;

  try {
    const rawResult = await tool.invoke({ query });
    let results = [];

    if (typeof rawResult === 'string') {
      try {
        const parsed = JSON.parse(rawResult);
        results = Array.isArray(parsed) ? parsed : (parsed.results || []);
      } catch { results = []; }
    } else if (Array.isArray(rawResult)) {
      results = rawResult;
    } else if (rawResult?.results) {
      results = rawResult.results;
    }

    const sources = results.map((r) => ({
      url: r.url || '',
      title: r.title || 'Financial Source',
      content: r.content || '',
    }));

    const answer = results
      .slice(0, 3)
      .map((r) => r.content || '')
      .filter(Boolean)
      .join('\n\n');

    return { sources, answer };
  } catch (error) {
    console.error(`Financial search error for "${companyName}":`, error.message);
    return { sources: [], answer: '' };
  }
}

/**
 * Searches for Wall Street analyst ratings and price targets.
 * @param {string} companyName
 * @returns {Promise<{sources: Array, answer: string}>}
 */
export async function searchAnalystRatings(companyName) {
  const tool = createAnalystRatingsTool();
  const query = `${companyName} analyst rating price target buy sell hold Wall Street 2025`;

  try {
    const rawResult = await tool.invoke({ query });
    let results = [];

    if (typeof rawResult === 'string') {
      try {
        const parsed = JSON.parse(rawResult);
        results = Array.isArray(parsed) ? parsed : (parsed.results || []);
      } catch { results = []; }
    } else if (Array.isArray(rawResult)) {
      results = rawResult;
    } else if (rawResult?.results) {
      results = rawResult.results;
    }

    const sources = results.map((r) => ({
      url: r.url || '',
      title: r.title || 'Analyst Source',
      content: r.content || '',
    }));

    const answer = results
      .slice(0, 3)
      .map((r) => r.content || '')
      .filter(Boolean)
      .join('\n\n');

    return { sources, answer };
  } catch (error) {
    console.error(`Analyst ratings search error for "${companyName}":`, error.message);
    return { sources: [], answer: '' };
  }
}
