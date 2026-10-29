/**
 * MetricsCard — Displays the 4 scored dimensions from the analyst node.
 *
 * Renders:
 * - Financial Health (1-10 with animated bar)
 * - Competitive Moat (1-10 with animated bar)
 * - Growth Potential (1-10 with animated bar)
 * - Risk Level (Low/Medium/High badge)
 * - Overall Score (composite)
 *
 * @param {{ analysis: Object }} props
 */
export function MetricsCard({ analysis }) {
  if (!analysis) return null;

  /**
   * Determine color tier from score value.
   * @param {number} score 1-10
   */
  function scoreTier(score) {
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  const metrics = [
    {
      id: 'financial',
      label: 'Financial Health',
      score: analysis.financialHealth,
      reasoning: analysis.financialHealthReasoning,
      icon: '💰',
    },
    {
      id: 'moat',
      label: 'Competitive Moat',
      score: analysis.competitiveMoat,
      reasoning: analysis.competitiveMoatReasoning,
      icon: '🏰',
    },
    {
      id: 'growth',
      label: 'Growth Potential',
      score: analysis.growthPotential,
      reasoning: analysis.growthPotentialReasoning,
      icon: '📈',
    },
    {
      id: 'risk',
      label: 'Risk Level',
      score: null,
      riskLevel: analysis.riskLevel,
      reasoning: analysis.riskLevelReasoning,
      icon: '⚠️',
    },
  ];

  return (
    <div className="metrics-section">
      <div className="section-header">
        <span className="section-label">Quantitative Scores</span>
      </div>

      <div className="metrics-grid">
        {metrics.map((m, i) => (
          <div
            key={m.id}
            className="metric-card"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="metric-label">
              {m.icon} {m.label}
            </div>

            {m.score !== null ? (
              <>
                <div className={`metric-score ${scoreTier(m.score)}`}>
                  {m.score}
                  <span style={{ fontSize: '0.9rem', opacity: 0.5 }}>/10</span>
                </div>
                <div className="metric-bar">
                  <div
                    className={`metric-bar-fill ${scoreTier(m.score)}`}
                    style={{ width: `${m.score * 10}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <div style={{ margin: 'var(--space-sm) 0' }}>
                  <span className={`risk-badge ${m.riskLevel}`}>{m.riskLevel}</span>
                </div>
                <div className="metric-bar">
                  <div
                    className={`metric-bar-fill ${
                      m.riskLevel === 'Low' ? 'high' : m.riskLevel === 'Medium' ? 'medium' : 'low'
                    }`}
                    style={{
                      width: m.riskLevel === 'Low' ? '25%' : m.riskLevel === 'Medium' ? '60%' : '90%',
                    }}
                  />
                </div>
              </>
            )}

            <div className="metric-reasoning">{m.reasoning}</div>
          </div>
        ))}
      </div>

      {/* Overall score */}
      {analysis.overallScore && (
        <div className="overall-score-card">
          <div>
            <div className="metric-label" style={{ marginBottom: 4 }}>
              ⭐ Overall Investment Score
            </div>
            <div className="overall-label">Weighted composite across all dimensions</div>
          </div>
          <div className="overall-value">
            {typeof analysis.overallScore === 'number'
              ? analysis.overallScore.toFixed(1)
              : analysis.overallScore}
            <span style={{ fontSize: '1rem', opacity: 0.5 }}>/10</span>
          </div>
        </div>
      )}
    </div>
  );
}
