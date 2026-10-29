import { ChatOpenAI } from '@langchain/openai';

/**
 * Analyst Node — Node 3 of the LangGraph pipeline.
 *
 * Analyzes all collected research and scores the company on 4 dimensions:
 * - Financial Health (1-10)
 * - Competitive Moat (1-10)
 * - Growth Potential (1-10)
 * - Risk Level (Low/Medium/High)
 * - Overall Score (weighted composite)
 *
 * @param {import('../state.js').AgentState} state
 * @param {Object} options
 * @param {Function} options.emit - SSE event emitter
 * @returns {Partial<import('../state.js').AgentState>}
 */
export async function analystNode(state, { emit }) {
  emit('stage', {
    stage: 'analyzing',
    message: '📊 Analyzing research data and scoring key metrics...',
  });

  const llm = new ChatOpenAI({
    model: 'gpt-4o',
    temperature: 0,
    maxRetries: 2,
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Build a comprehensive context from all research results
  const researchContext = state.researchResults
    .map((r) => `## ${r.topic}\n${r.summary}`)
    .join('\n\n');

  const prompt = `You are a senior investment analyst at a top-tier hedge fund. Analyze the following research about "${state.companyName}" and provide a structured scoring.

RESEARCH DATA:
${researchContext}

Provide your analysis as a JSON object with EXACTLY this structure:
{
  "financialHealth": <integer 1-10>,
  "financialHealthReasoning": "<one sentence explaining the score>",
  "competitiveMoat": <integer 1-10>,
  "competitiveMoatReasoning": "<one sentence explaining the score>",
  "growthPotential": <integer 1-10>,
  "growthPotentialReasoning": "<one sentence explaining the score>",
  "riskLevel": "<Low|Medium|High>",
  "riskLevelReasoning": "<one sentence explaining the risk level>",
  "overallScore": <number 1-10 with one decimal, weighted: financialHealth*0.3 + competitiveMoat*0.25 + growthPotential*0.3 + (riskAdjustment)*0.15>
}

Scoring guidelines:
- financialHealth: 9-10=exceptional profits/margins, 7-8=strong, 5-6=average, 3-4=weak, 1-2=distressed
- competitiveMoat: 9-10=near-monopoly/dominant brand, 7-8=strong advantages, 5-6=some moat, 3-4=competitive market, 1-2=commodity
- growthPotential: 9-10=hypergrowth/massive TAM, 7-8=strong growth, 5-6=moderate, 3-4=slow/declining, 1-2=contracting
- riskLevel: Low=stable business with few threats, Medium=some notable risks, High=significant uncertainty/threats
- riskAdjustment: Low risk=10, Medium risk=6, High risk=3

Return ONLY the JSON object. No other text.`;

  const response = await llm.invoke([{ role: 'user', content: prompt }]);
  const content = response.content.trim();

  let analysis;
  try {
    const match = content.match(/\{[\s\S]*\}/);
    analysis = JSON.parse(match ? match[0] : content);
  } catch {
    // Fallback neutral scores if parsing fails
    analysis = {
      financialHealth: 5,
      financialHealthReasoning: 'Unable to determine from available data.',
      competitiveMoat: 5,
      competitiveMoatReasoning: 'Unable to determine from available data.',
      growthPotential: 5,
      growthPotentialReasoning: 'Unable to determine from available data.',
      riskLevel: 'Medium',
      riskLevelReasoning: 'Insufficient data to assess risk level.',
      overallScore: 5.0,
    };
  }

  emit('analysis', {
    metrics: analysis,
    message: '✅ Scoring complete — generating final recommendation...',
  });

  return { analysis, currentStage: 'synthesizing' };
}
