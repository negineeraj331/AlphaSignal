import { useState, useCallback, useRef } from 'react';

// In dev, Vite proxies /api → localhost:3001, so we use relative paths.
// In production, set VITE_API_URL to the backend's deployed URL.
const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * useResearchStream — Custom hook for consuming the backend SSE stream.
 *
 * Uses fetch + ReadableStream (not EventSource) because we need to POST
 * the company name as a request body, and EventSource only supports GET.
 *
 * Returns:
 * - state: { status, stages, researchSteps, analysis, report, error }
 * - startResearch(companyName): kicks off the research pipeline
 * - reset(): clears state for a new search
 */
export function useResearchStream() {
  const [status, setStatus] = useState('idle'); // idle | loading | complete | error
  const [stages, setStages] = useState([]);
  const [researchSteps, setResearchSteps] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setStatus('idle');
    setStages([]);
    setResearchSteps([]);
    setAnalysis(null);
    setReport(null);
    setError(null);
  }, []);

  const startResearch = useCallback(async (companyName) => {
    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setStages([]);
    setResearchSteps([]);
    setAnalysis(null);
    setReport(null);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer

        let currentEventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              handleEvent(currentEventType, data);
            } catch {
              // Ignore parse errors
            }
            currentEventType = '';
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Research failed. Please try again.');
      setStatus('error');
    }

    function handleEvent(eventType, data) {
      switch (eventType) {
        case 'stage':
          setStages((prev) => {
            // Avoid duplicate stages
            const exists = prev.some((s) => s.stage === data.stage && s.message === data.message);
            if (exists) return prev;
            return [...prev, { ...data, timestamp: Date.now() }];
          });
          break;

        case 'research_step':
          setResearchSteps((prev) => {
            const exists = prev.some((s) => s.step === data.step);
            if (exists) return prev;
            return [...prev, { ...data, status: 'loading', timestamp: Date.now() }];
          });
          break;

        case 'research_result':
          setResearchSteps((prev) =>
            prev.map((s) =>
              s.step === data.stepIndex + 1
                ? { ...s, status: 'done', summary: data.summary, sources: data.sources }
                : s,
            ),
          );
          break;

        case 'analysis':
          setAnalysis(data.metrics);
          break;

        case 'complete':
          setReport(data.report);
          if (data.analysis) setAnalysis(data.analysis);
          setStatus('complete');
          break;

        case 'error':
          setError(data.message || 'An error occurred.');
          setStatus('error');
          break;
      }
    }
  }, []);

  return {
    status,
    stages,
    researchSteps,
    analysis,
    report,
    error,
    startResearch,
    reset,
  };
}
