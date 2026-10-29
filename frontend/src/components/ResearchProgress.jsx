import { SourcesList } from './SourcesList.jsx';

/**
 * ResearchProgress — Displays the live research pipeline as it streams in.
 *
 * Shows:
 * 1. Pipeline stage badges (planning → researching → analyzing → risk assessing → synthesizing)
 * 2. Individual research step cards with topic, query, live summary, and sources
 *
 * @param {{ stages: Array, researchSteps: Array }} props
 */
export function ResearchProgress({ stages, researchSteps }) {
  const stageConfig = {
    started:           { icon: '🚀', label: 'Initializing' },
    planning:          { icon: '🗺️', label: 'Planning Research' },
    planning_complete: { icon: '✅', label: 'Research Plan Ready' },
    analyzing:         { icon: '📊', label: 'Scoring & Analysis' },
    risk_assessment:   { icon: '⚠️', label: 'Deep Risk Analysis' },
    risk_complete:     { icon: '🛡️', label: 'Risk Assessment Complete' },
    synthesizing:      { icon: '✍️', label: 'Writing Report' },
    complete:          { icon: '🎯', label: 'Complete' },
  };

  const isSearching = researchSteps.length > 0;
  const currentStage = stages[stages.length - 1];
  const completedSteps = researchSteps.filter((s) => s.status === 'done').length;

  return (
    <div className="progress-panel">
      {/* Header */}
      <div className="progress-header">
        <div className="pulse-dot" />
        <div>
          <div className="progress-title">
            {currentStage?.message || 'Starting research...'}
          </div>
          {isSearching && (
            <div className="progress-subtitle">
              {completedSteps}/{researchSteps.length} research areas complete
            </div>
          )}
        </div>
      </div>

      {/* Stage timeline */}
      <div className="stages-list">
        {stages.map((stage, i) => {
          const config = stageConfig[stage.stage] || { icon: '•', label: stage.stage };
          const isLast = i === stages.length - 1;
          return (
            <div
              key={`${stage.stage}-${i}`}
              className={`stage-item ${isLast ? 'active' : 'done'}`}
            >
              <span className="stage-item-icon">{config.icon}</span>
              <span>{stage.message || config.label}</span>
            </div>
          );
        })}
      </div>

      {/* Research steps */}
      {researchSteps.length > 0 && (
        <div>
          <div className="section-header" style={{ marginBottom: 'var(--space-md)' }}>
            <span className="section-label">Live Research</span>
          </div>
          <div className="research-steps">
            {researchSteps.map((step) => (
              <div
                key={step.step}
                className={`research-step-card ${step.status}`}
              >
                <div className="step-header">
                  <div className="step-number">{step.step}</div>
                  <div className="step-topic">{step.topic}</div>
                  <div className={`step-status ${step.status}`}>
                    {step.status === 'loading' ? (
                      <>
                        <span className="spinner" style={{ width: 12, height: 12 }} />
                        Searching...
                      </>
                    ) : (
                      <>✓ Done</>
                    )}
                  </div>
                </div>

                <div className="step-query">{step.query}</div>

                {step.summary && (
                  <div className="step-summary">
                    {step.summary}
                    {step.sources && step.sources.length > 0 && (
                      <SourcesList sources={step.sources} label="Sources" max={3} />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
