import { ChatOpenAI } from '@langchain/openai';
import {
  createFinancialSearchTool,
  createNewsSearchTool,
  runSearch,
} from '../tools/tavilySearch.js';

// Topic labels for each research query slot (matches planner order)
const TOPIC_LABELS = [
  'Financial Performance',
  'Competitive Moat',
  'Market Position',
  'Growth Trajectory',
  'News & Sentiment',
  'Risks & Challenges',
];

/**
 * Researcher Node — Node 2 of the LangGraph pipeline.
 *
 * Executes each research query against Tavily search APIs.
 * Queries 0-4 use financial search; query 4 uses news search.
 * Results are summarized by GPT-4o for quality and relevance.
 *
 * @param {import('../state.js').AgentState} state
 * @param {Object} options
 * @param {Function} options.emit - SSE event emitter function
 * @returns {Partial<import('../state.js').AgentState>}
 */
export async function researcherNode(state, { emit }) {
  const financialTool = createFinancialSearchTool();
  const newsTool = createNewsSearchTool();

  const llm = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0,
    maxRetries: 2,
    apiKey: process.env.OPENAI_API_KEY,
  });

  const researchResults = [];

  for (let i = 0; i < state.researchPlan.length; i++) {
    const query = state.researchPlan[i];
    const topic = TOPIC_LABELS[i] || `Research Area ${i + 1}`;

    // Use news tool for sentiment query, financial tool for others
    const tool = i === 4 ? newsTool : financialTool;

    emit('research_step', {
      step: i + 1,
      total: state.researchPlan.length,
      topic,
      message: `🔎 Researching: ${topic}`,
      query,
    });

    const { sources, answer } = await runSearch(tool, query);

    // Summarize the raw search content with LLM
    let summary = answer;
    if (answer && answer.length > 100) {
      try {
        const summaryResponse = await llm.invoke([
          {
            role: 'user',
            content: `You are an investment analyst. Summarize the following research about "${state.companyName}" for the topic "${topic}". Be concise, specific, and factual. Include key numbers/metrics where available. Max 200 words.\n\nResearch data:\n${answer}`,
          },
        ]);
        summary = summaryResponse.content;
      } catch {
        summary = answer.slice(0, 500);
      }
    }

    const result = {
      topic,
      query,
      summary: summary || `No data found for: ${query}`,
      sources: sources.slice(0, 3),
    };

    researchResults.push(result);

    emit('research_result', {
      topic,
      summary: result.summary,
      sources: result.sources,
      stepIndex: i,
    });
  }

  return { researchResults, currentStage: 'analyzing' };
}
