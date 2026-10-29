import { StateGraph, END, START } from '@langchain/langgraph';
import { createInitialState } from './state.js';
import { plannerNode } from './nodes/planner.js';
import { researcherNode } from './nodes/researcher.js';
import { analystNode } from './nodes/analyst.js';
import { riskAssessorNode } from './nodes/riskAssessor.js';
import { synthesizerNode } from './nodes/synthesizer.js';

/**
 * Builds and returns the compiled LangGraph research pipeline.
 *
 * Graph structure (linear pipeline):
 *   __start__ → planner → researcher → analyst → riskAssessor → synthesizer → __end__
 *
 * Each node receives the current AgentState and an `emit` function
 * for real-time SSE progress updates to the frontend.
 *
 * @param {Function} emit - SSE emitter: (eventType, data) => void
 * @returns {CompiledGraph} Compiled LangGraph graph
 */
export function buildResearchGraph(emit) {
  /**
   * State channels — defines how state updates are merged between nodes.
   * Arrays use concat reducers; scalars use replace (last-write-wins).
   */
  const graphState = {
    companyName: {
      value: (_, y) => y ?? '',
      default: () => '',
    },
    researchPlan: {
      value: (_, y) => y ?? [],
      default: () => [],
    },
    researchResults: {
      value: (_, y) => y ?? [],
      default: () => [],
    },
    analysis: {
      value: (_, y) => y ?? null,
      default: () => null,
    },
    riskAssessment: {
      value: (_, y) => y ?? null,
      default: () => null,
    },
    finalReport: {
      value: (_, y) => y ?? null,
      default: () => null,
    },
    currentStage: {
      value: (_, y) => y ?? 'initializing',
      default: () => 'initializing',
    },
    errors: {
      value: (x, y) => [...(x ?? []), ...(y ?? [])],
      default: () => [],
    },
  };

  // Wrap each node to inject the emit function
  const withEmit = (nodeFn) => async (state) => {
    return await nodeFn(state, { emit });
  };

  // Build the StateGraph
  const graph = new StateGraph({ channels: graphState });

  // Register all 5 nodes
  graph.addNode('planner',      withEmit(plannerNode));
  graph.addNode('researcher',   withEmit(researcherNode));
  graph.addNode('analyst',      withEmit(analystNode));
  graph.addNode('riskAssessor', withEmit(riskAssessorNode));
  graph.addNode('synthesizer',  withEmit(synthesizerNode));

  // Wire the pipeline: plan → research → analyze → assess risk → synthesize
  graph.addEdge(START,         'planner');
  graph.addEdge('planner',     'researcher');
  graph.addEdge('researcher',  'analyst');
  graph.addEdge('analyst',     'riskAssessor');
  graph.addEdge('riskAssessor','synthesizer');
  graph.addEdge('synthesizer', END);

  return graph.compile();
}

/**
 * Runs the full research pipeline for a given company.
 *
 * @param {string} companyName - Company to research
 * @param {Function} emit - SSE emitter (eventType, data) => void
 * @returns {Promise<import('./state.js').AgentState>} Final state
 */
export async function runResearchAgent(companyName, emit) {
  const graph = buildResearchGraph(emit);
  const initialState = createInitialState(companyName);

  const finalState = await graph.invoke(initialState, {
    recursionLimit: 30,
  });

  return finalState;
}
