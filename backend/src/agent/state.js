/**
 * Agent State Schema
 * Defines the shape of data flowing through the LangGraph pipeline.
 * Each field is accumulated/updated by different nodes in the graph.
 */

/**
 * @typedef {Object} ResearchStep
 * @property {string} query - The search query used
 * @property {string} topic - Topic category (e.g., "Financial Health")
 * @property {string} summary - Synthesized summary from search results
 * @property {Array<{url: string, title: string}>} sources - Source links
 */

/**
 * @typedef {Object} AnalysisMetrics
 * @property {number} financialHealth - Score 1-10
 * @property {number} competitiveMoat - Score 1-10
 * @property {number} growthPotential - Score 1-10
 * @property {string} riskLevel - "Low" | "Medium" | "High"
 * @property {number} overallScore - Weighted average 1-10
 */

/**
 * @typedef {Object} FinalReport
 * @property {"INVEST" | "PASS"} recommendation - Final decision
 * @property {"High" | "Medium" | "Low"} confidence - Confidence level
 * @property {string} executiveSummary - 2-3 paragraph summary
 * @property {string[]} bullCase - 3 key reasons to invest
 * @property {string[]} bearCase - 3 key risks / reasons to pass
 * @property {string} disclaimer - Standard financial disclaimer
 */

/**
 * @typedef {Object} RiskFactor
 * @property {string} category - Risk category (Regulatory, Competitive, Financial, Execution, Macro, ESG)
 * @property {string} title - Short risk title
 * @property {string} description - Detailed risk description
 * @property {"Low"|"Medium"|"High"|"Critical"} severity - Risk severity
 * @property {string} likelihood - How likely this risk is to materialize
 * @property {string} mitigants - How the company is addressing this risk
 */

/**
 * @typedef {Object} RiskAssessment
 * @property {"Low"|"Medium"|"High"|"Critical"} overallRiskLevel - Overall risk level
 * @property {number} riskScore - Risk score 1-10 (1=minimal, 10=extreme)
 * @property {RiskFactor[]} topRisks - Structured list of identified risks
 * @property {string} riskSummary - Narrative risk summary
 * @property {string[]} redFlags - Genuine red-flag signals
 * @property {string[]} positiveFactors - Risk-mitigating strengths
 * @property {Array<{url:string, title:string}>} sources - Research sources
 */

/**
 * @typedef {Object} AgentState
 * @property {string} companyName - Input company name
 * @property {string[]} researchPlan - List of research questions to answer
 * @property {ResearchStep[]} researchResults - Accumulated research findings
 * @property {AnalysisMetrics | null} analysis - Scored analysis
 * @property {RiskAssessment | null} riskAssessment - Deep risk analysis
 * @property {FinalReport | null} finalReport - The investment recommendation
 * @property {string} currentStage - Current pipeline stage
 * @property {string[]} errors - Any errors encountered
 */

/**
 * Returns the initial state for a new research session.
 * @param {string} companyName
 * @returns {AgentState}
 */
export function createInitialState(companyName) {
  return {
    companyName,
    researchPlan: [],
    researchResults: [],
    analysis: null,
    riskAssessment: null,
    finalReport: null,
    currentStage: 'initializing',
    errors: [],
  };
}

export default {
  createInitialState,
};
