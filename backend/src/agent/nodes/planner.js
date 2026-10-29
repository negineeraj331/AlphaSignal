import { ChatOpenAI } from '@langchain/openai';

/**
 * Planner Node — Node 1 of the LangGraph pipeline.
 *
 * Decomposes a company name into 6 targeted research questions
 * covering all dimensions needed for an investment decision:
 * financials, market position, growth, risks, news, and competitors.
 *
 * @param {import('../state.js').AgentState} state
 * @param {Object} options
 * @param {Function} options.emit - SSE event emitter function
 * @returns {Partial<import('../state.js').AgentState>}
 */
export async function plannerNode(state, { emit }) {
  emit('stage', {
    stage: 'planning',
    message: `🔍 Planning research strategy for ${state.companyName}...`,
  });

  const llm = new ChatOpenAI({
    model: 'gpt-4o',
    temperature: 0.1,
    maxRetries: 2,
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = `You are an expert investment analyst. Given the company "${state.companyName}", generate exactly 6 targeted research queries to gather comprehensive investment intelligence.

Each query should be specific, searchable, and cover a distinct dimension:
1. Financial performance (revenue, profit margins, growth rate, debt)
2. Business model and competitive advantages (moat)
3. Market position and industry landscape
4. Growth trajectory and future outlook (TAM, product pipeline)
5. Recent news, sentiment, and major developments
6. Key risks, regulatory issues, and weaknesses

Return ONLY a JSON array of 6 query strings. No other text.
Example format: ["query 1", "query 2", "query 3", "query 4", "query 5", "query 6"]`;

  const response = await llm.invoke([{ role: 'user', content: prompt }]);
  const content = response.content.trim();

  let researchPlan;
  try {
    // Extract JSON array from response
    const match = content.match(/\[[\s\S]*\]/);
    researchPlan = JSON.parse(match ? match[0] : content);
  } catch {
    // Fallback to generic queries
    researchPlan = [
      `${state.companyName} financial performance revenue profit 2024 2025`,
      `${state.companyName} business model competitive advantages moat`,
      `${state.companyName} market share industry position competitors`,
      `${state.companyName} growth strategy future outlook expansion`,
      `${state.companyName} latest news developments announcements 2025`,
      `${state.companyName} risks challenges regulatory problems weaknesses`,
    ];
  }

  emit('stage', {
    stage: 'planning_complete',
    message: `✅ Research plan created with ${researchPlan.length} targeted queries`,
    plan: researchPlan,
  });

  return { researchPlan, currentStage: 'researching' };
}
