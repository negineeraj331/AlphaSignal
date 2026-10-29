import { ChatOpenAI } from '@langchain/openai';
import { createFinancialSearchTool, runSearch } from '../tools/tavilySearch.js';

/**
 * Risk Assessor Node — Node 3.5 of the LangGraph pipeline (runs after analyst, before synthesizer).
 *
 * Performs a deep-dive risk analysis by:
 * 1. Running 3 targeted risk-focused Tavily searches (regulatory, competitive, financial risk)
 * 2. Using GPT-4o to structure findings into a risk matrix with severity scores
 *
 * Risk categories assessed:
 * - Regulatory & Legal Risk
 * - Competitive Disruption Risk
 * - Financial / Balance Sheet Risk
 * - Management & Execution Risk
 * - Macro / Market Risk
 *
 * @param {import('../state.js').AgentState} state
 * @param {Object} options
 * @param {Function} options.emit - SSE event emitter
 * @returns {Partial<import('../state.js').AgentState>}
 */
export async function riskAssessorNode(state, { emit }) {
  emit('stage', {
    stage: 'risk_assessment',
    message: `⚠️ Running deep risk analysis for ${state.companyName}...`,
  });

  const searchTool = createFinancialSearchTool();
  const llm = new ChatOpenAI({
    model: 'gpt-4o',
    temperature: 0,
    maxRetries: 2,
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Three targeted risk searches
  const riskQueries = [
    `${state.companyName} regulatory legal risks lawsuits investigations fines 2024 2025`,
    `${state.companyName} competition threats market disruption risks challengers`,
    `${state.companyName} financial risks debt leverage cash burn problems concerns`,
  ];

  const riskTopics = ['Regulatory & Legal', 'Competitive Threats', 'Financial Risks'];
  const rawRiskData = [];

  for (let i = 0; i < riskQueries.length; i++) {
    emit('research_step', {
      step: state.researchPlan.length + i + 1,
      total: state.researchPlan.length + riskQueries.length,
      topic: `Risk: ${riskTopics[i]}`,
      message: `🔎 Researching risk: ${riskTopics[i]}`,
      query: riskQueries[i],
    });

    const { sources, answer } = await runSearch(searchTool, riskQueries[i]);

    rawRiskData.push({ topic: riskTopics[i], answer, sources });

    emit('research_result', {
      topic: `Risk: ${riskTopics[i]}`,
      summary: answer.slice(0, 300) + (answer.length > 300 ? '...' : ''),
      sources: sources.slice(0, 2),
      stepIndex: state.researchPlan.length + i,
    });
  }

  // Build combined context from existing research + risk searches
  const existingResearch = state.researchResults
    .map((r) => `${r.topic}: ${r.summary}`)
    .join('\n');

  const riskResearch = rawRiskData
    .map((r) => `## ${r.topic}\n${r.answer}`)
    .join('\n\n');

  const analysisContext = state.analysis
    ? `Current scores — Financial: ${state.analysis.financialHealth}/10, Moat: ${state.analysis.competitiveMoat}/10, Growth: ${state.analysis.growthPotential}/10, Risk Level: ${state.analysis.riskLevel}`
    : '';

  const prompt = `You are a senior risk analyst at a major investment bank evaluating "${state.companyName}".

EXISTING RESEARCH CONTEXT:
${existingResearch}

${analysisContext}

DEDICATED RISK RESEARCH:
${riskResearch}

Based on ALL available information, produce a structured risk assessment as JSON with EXACTLY this format:
{
  "overallRiskLevel": "<Low|Medium|High|Critical>",
  "riskScore": <integer 1-10 where 1=minimal risk, 10=extreme risk>,
  "topRisks": [
    {
      "category": "<Regulatory|Competitive|Financial|Execution|Macro|ESG>",
      "title": "<Short risk title>",
      "description": "<2-3 sentence specific risk description with supporting evidence>",
      "severity": "<Low|Medium|High|Critical>",
      "likelihood": "<Unlikely|Possible|Likely|Very Likely>",
      "mitigants": "<1-2 sentence on how the company is addressing this>"
    }
  ],
  "riskSummary": "<2-3 sentence overall risk narrative that synthesizes the key risk themes>",
  "redFlags": ["<Specific red flag 1 if any>", "<Specific red flag 2 if any>"],
  "positiveFactors": ["<Risk-reducing positive 1>", "<Risk-reducing positive 2>"]
}

Rules:
- Include 3-5 topRisks sorted by severity (highest first)
- redFlags: list only GENUINE concerning signals (max 3). Empty array [] if none.
- positiveFactors: risk-mitigating strengths (e.g. strong cash, diversified revenue)
- Be specific, cite numbers or events where the research supports it
- Return ONLY the JSON object`;

  const response = await llm.invoke([{ role: 'user', content: prompt }]);
  const content = response.content.trim();

  let riskAssessment;
  try {
    const match = content.match(/\{[\s\S]*\}/);
    riskAssessment = JSON.parse(match ? match[0] : content);

    // Attach the raw risk sources to the assessment
    riskAssessment.sources = rawRiskData
      .flatMap((r) => r.sources)
      .filter((s, i, arr) => s.url && arr.findIndex((x) => x.url === s.url) === i)
      .slice(0, 6);
  } catch {
    riskAssessment = {
      overallRiskLevel: state.analysis?.riskLevel || 'Medium',
      riskScore: 5,
      topRisks: [
        {
          category: 'Macro',
          title: 'General Market Risk',
          description: 'Standard market and sector risks apply. Insufficient specific data found.',
          severity: 'Medium',
          likelihood: 'Possible',
          mitigants: 'Diversified operations may provide some cushion.',
        },
      ],
      riskSummary: 'Unable to complete full risk assessment from available data.',
      redFlags: [],
      positiveFactors: ['Established market presence'],
      sources: [],
    };
  }

  emit('stage', {
    stage: 'risk_complete',
    message: `✅ Risk assessment complete — ${riskAssessment.topRisks?.length || 0} risk factors identified`,
    riskLevel: riskAssessment.overallRiskLevel,
  });

  return { riskAssessment, currentStage: 'synthesizing' };
}
