import { useState } from 'react';
import { useResearchStream } from './hooks/useResearchStream';
import { SearchBar } from './components/SearchBar';
import { ResearchProgress } from './components/ResearchProgress';
import { MetricsCard } from './components/MetricsCard';
import { ReportCard } from './components/ReportCard';

export default function App() {
  const [companyName, setCompanyName] = useState('');
  const { status, stages, researchSteps, analysis, report, error, startResearch, reset } =
    useResearchStream();

  const handleSearch = (name) => {
    setCompanyName(name);
    startResearch(name);
  };

  const handleReset = () => {
    setCompanyName('');
    reset();
  };

  const isLoading = status === 'loading';
  const isComplete = status === 'complete';
  const isError = status === 'error';

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-logo">
          <div className="logo-icon">📡</div>
          <span className="logo-text">AlphaSignal</span>
        </div>
        <h1>AI Investment Research Agent</h1>
        <p>
          Enter any company name. Our AI agent will research it across financials,
          competitive moat, growth trajectory, and risk — then deliver a clear{' '}
          <strong style={{ color: 'var(--clr-invest)' }}>INVEST</strong> or{' '}
          <strong style={{ color: 'var(--clr-pass)' }}>PASS</strong> recommendation.
        </p>
      </header>

      {/* ── Search ── */}
      <main>
        <SearchBar
          onSearch={handleSearch}
          isLoading={isLoading}
        />

        {/* ── Error state ── */}
        {isError && (
          <div className="error-card" role="alert">
            <h3>Research Failed</h3>
            <p>{error}</p>
            <button className="retry-btn" onClick={handleReset}>
              Try Again
            </button>
          </div>
        )}

        {/* ── Live Research Progress ── */}
        {(isLoading || (isComplete && stages.length > 0)) && (
          <ResearchProgress stages={stages} researchSteps={researchSteps} />
        )}

        {/* ── Analysis Metrics (appear as soon as analyst node finishes) ── */}
        {analysis && <MetricsCard analysis={analysis} />}

        {/* ── Final Report ── */}
        {isComplete && report && (
          <>
            <ReportCard report={report} companyName={companyName} />
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
              <button
                id="new-research-btn"
                className="search-button"
                style={{ padding: 'var(--space-md) var(--space-2xl)' }}
                onClick={handleReset}
              >
                <span>Research Another Company</span>
                <span className="btn-arrow">→</span>
              </button>
            </div>
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <p>
          AlphaSignal · Powered by{' '}
          <a href="https://openai.com" target="_blank" rel="noopener noreferrer">GPT-4o</a>
          {' '}+{' '}
          <a href="https://tavily.com" target="_blank" rel="noopener noreferrer">Tavily</a>
          {' '}+{' '}
          <a href="https://langchain.com/langgraph" target="_blank" rel="noopener noreferrer">LangGraph.js</a>
        </p>
        <p style={{ marginTop: 4 }}>For informational purposes only. Not financial advice.</p>
      </footer>
    </div>
  );
}
