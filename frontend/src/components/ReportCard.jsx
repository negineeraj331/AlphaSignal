import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SourcesList } from './SourcesList.jsx';
import { MetricsBadge } from './MetricsBadge.jsx';

/**
 * ReportCard — The final investment recommendation display.
 *
 * Shows:
 * - INVEST / PASS verdict with color-coded banner
 * - Confidence level
 * - Executive summary (markdown-rendered)
 * - Bull case (3 investment reasons)
 * - Bear case (3 risk factors)
 * - Key metrics summary
 * - Source citations
 * - Financial disclaimer
 *
 * @param {{ report: Object, companyName: string }} props
 */
export function ReportCard({ report, companyName }) {
  if (!report) return null;

  const isInvest = report.recommendation === 'INVEST';
  const verdict = report.recommendation || 'PASS';

  const verdictEmoji = isInvest ? '✅' : '🚫';
  const confidenceMap = { High: '🔥 High', Medium: '⚡ Medium', Low: '💫 Low' };

  return (
    <div className={`report-card ${verdict.toLowerCase()}`} id="report-card">
      {/* ── Recommendation Banner ── */}
      <div className={`recommendation-banner ${verdict.toLowerCase()}`}>
        <div className="recommendation-left">
          <span className="recommendation-icon">{verdictEmoji}</span>
          <div>
            <div className="recommendation-label">Investment Decision</div>
            <div className={`recommendation-verdict ${verdict.toLowerCase()}`}>
              {isInvest ? 'INVEST' : 'PASS'}
            </div>
          </div>
        </div>

        <div className="recommendation-right">
          <div className="company-name-display">{companyName}</div>
          <span className={`confidence-badge ${report.confidence || 'Medium'}`}>
            {confidenceMap[report.confidence] || '⚡ Medium'} Confidence
          </span>
        </div>
      </div>

      {/* ── Report Body ── */}
      <div className="report-body">

        {/* Executive Summary */}
        {report.executiveSummary && (
          <section aria-label="Executive Summary">
            <div className="report-section-title">📋 Executive Summary</div>
            <div className="executive-summary">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {report.executiveSummary}
              </ReactMarkdown>
            </div>
          </section>
        )}

        {/* Key Metrics */}
        {report.keyMetrics && (
          <section aria-label="Key Metrics">
            <div className="report-section-title">📊 Key Metrics</div>
            <div
              style={{
                background: 'var(--clr-bg-glass)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-md) var(--space-lg)',
                borderLeft: '3px solid var(--clr-accent-primary)',
                fontSize: '0.9rem',
                color: 'var(--clr-text-secondary)',
                lineHeight: '1.7',
              }}
            >
              {report.keyMetrics}
            </div>
          </section>
        )}

        {/* Bull & Bear Cases */}
        {(report.bullCase?.length > 0 || report.bearCase?.length > 0) && (
          <section aria-label="Bull and Bear Cases">
            <div className="report-section-title">⚖️ Investment Case</div>
            <div className="bull-bear-grid">
              {report.bullCase?.length > 0 && (
                <div className="case-section bull">
                  <div className="case-title bull">🐂 Bull Case</div>
                  <ul className="case-list">
                    {report.bullCase.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
              {report.bearCase?.length > 0 && (
                <div className="case-section bear">
                  <div className="case-title bear">🐻 Bear Case</div>
                  <ul className="case-list">
                    {report.bearCase.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Risk Assessment Matrix */}
        {report.riskAssessment && (
          <section className="risk-matrix-section" aria-label="Risk Assessment">
            <div className="report-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚠️ Risk Assessment
              <MetricsBadge label="Overall Risk" value={report.riskAssessment.overallRiskLevel} size="sm" />
              <MetricsBadge label="Risk Score" value={report.riskAssessment.riskScore} size="sm" />
            </div>
            
            {report.riskAssessment.riskSummary && (
              <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-secondary)', marginBottom: 'var(--space-md)' }}>
                {report.riskAssessment.riskSummary}
              </p>
            )}

            {/* Risk Factors */}
            {report.riskAssessment.topRisks?.length > 0 && (
              <div className="risk-factors-list">
                {report.riskAssessment.topRisks.map((risk, i) => (
                  <div key={i} className={`risk-factor-card ${risk.severity}`}>
                    <div className="risk-factor-header">
                      <span className="risk-factor-title">{risk.title}</span>
                      <span className={`severity-badge ${risk.severity}`}>{risk.severity}</span>
                      <span className="risk-category-badge">{risk.category}</span>
                    </div>
                    <div className="risk-factor-description">{risk.description}</div>
                    {risk.mitigants && (
                      <div className="risk-factor-mitigants">
                        <strong>Mitigants:</strong> {risk.mitigants}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="risk-meta-row">
              {/* Red Flags */}
              {report.riskAssessment.redFlags?.length > 0 && (
                <div className="red-flags-section" style={{ flex: 1 }}>
                  <div className="red-flags-title">🚩 Red Flags</div>
                  <ul className="flag-list">
                    {report.riskAssessment.redFlags.map((flag, i) => (
                      <li key={i}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Positive Factors */}
              {report.riskAssessment.positiveFactors?.length > 0 && (
                <div className="positive-factors-section" style={{ flex: 1 }}>
                  <div className="pos-factors-title">🛡️ Risk Mitigants & Strengths</div>
                  <ul className="flag-list">
                    {report.riskAssessment.positiveFactors.map((factor, i) => (
                      <li key={i}>{factor}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Sources */}
        <SourcesList sources={report.sources} label="Research Sources" max={12} />

        {/* Disclaimer */}
        {report.disclaimer && (
          <div className="disclaimer">⚠️ {report.disclaimer}</div>
        )}
      </div>
    </div>
  );
}
