import { Router } from 'express';
import { runResearchAgent } from '../agent/graph.js';

const router = Router();

/**
 * POST /api/research
 *
 * Initiates an investment research session for a given company.
 * Streams progress events via Server-Sent Events (SSE).
 *
 * Request body: { companyName: string }
 *
 * SSE Event types:
 * - stage: Pipeline stage transitions
 * - research_step: Individual search query started
 * - research_result: Individual search result received
 * - analysis: Scoring metrics computed
 * - complete: Final report ready (includes full report data)
 * - error: Error occurred
 */
router.post('/research', async (req, res) => {
  const { companyName } = req.body;

  // Validate input
  if (!companyName || typeof companyName !== 'string' || companyName.trim().length === 0) {
    return res.status(400).json({ error: 'companyName is required' });
  }

  const company = companyName.trim().slice(0, 100); // Safety limit

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
  res.flushHeaders();

  // Track if client disconnected
  let clientDisconnected = false;
  req.on('close', () => {
    clientDisconnected = true;
  });

  /**
   * SSE emitter function — sends a typed event to the client.
   * @param {string} eventType - SSE event type
   * @param {Object} data - Event payload
   */
  function emit(eventType, data) {
    if (clientDisconnected) return;
    try {
      res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {
      // Client disconnected mid-stream
    }
  }

  try {
    const hasOpenAI = process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your_openai_api_key_here');
    const hasTavily = process.env.TAVILY_API_KEY && !process.env.TAVILY_API_KEY.includes('your_tavily_api_key_here');

    if (!hasOpenAI || !hasTavily) {
      const missing = [!hasOpenAI && 'OPENAI_API_KEY', !hasTavily && 'TAVILY_API_KEY'].filter(Boolean).join(' and ');
      emit('error', {
        message: `Missing API key(s): ${missing}. Please set them in your backend/.env file to run research.`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Emit start event
    emit('stage', {
      stage: 'started',
      message: `🚀 Starting investment research for "${company}"`,
      companyName: company,
      timestamp: new Date().toISOString(),
    });

    // Run the full research pipeline
    const finalState = await runResearchAgent(company, emit);

    // Emit the complete event with the full report
    emit('complete', {
      companyName: company,
      report: finalState.finalReport,
      analysis: finalState.analysis,
      researchResults: finalState.researchResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Research agent error:', error);
    let userMsg = error.message || 'An unexpected error occurred during research.';
    if (userMsg.includes('429') || userMsg.toLowerCase().includes('credits') || userMsg.toLowerCase().includes('quota')) {
      userMsg = 'OpenAI account has no credits remaining (429). Please add credits to your OpenAI account at https://platform.openai.com/settings/organization/billing to run research.';
    } else if (userMsg.includes('401') || userMsg.toLowerCase().includes('incorrect api key')) {
      userMsg = 'Invalid OpenAI API key. Please verify your OPENAI_API_KEY in backend/.env';
    }
    emit('error', {
      message: userMsg,
      timestamp: new Date().toISOString(),
    });
  } finally {
    res.end();
  }
});

export default router;
