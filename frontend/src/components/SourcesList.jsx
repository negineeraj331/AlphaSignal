/**
 * SourcesList — Displays a list of research sources as clickable chips.
 *
 * Used in both the ResearchProgress panel (per-step sources) and
 * the final ReportCard (all aggregated sources).
 *
 * @param {{ sources: Array<{url:string, title:string}>, label?: string, max?: number }} props
 */
export function SourcesList({ sources = [], label = 'Sources', max = 10 }) {
  if (!sources || sources.length === 0) return null;

  const visible = sources
    .filter((s) => s.url)
    .slice(0, max);

  if (visible.length === 0) return null;

  /**
   * Extracts a readable hostname from a URL.
   * @param {string} url
   */
  function getHostname(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url.slice(0, 30);
    }
  }

  return (
    <div className="sources-list-wrapper">
      {label && (
        <div className="sources-list-label">
          <span className="source-icon">🔗</span> {label}
        </div>
      )}
      <div className="sources-grid">
        {visible.map((source, i) => (
          <a
            key={i}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="source-chip"
            title={source.title || source.url}
            aria-label={`Source: ${source.title || getHostname(source.url)}`}
          >
            🌐 {source.title ? source.title.slice(0, 40) : getHostname(source.url)}
          </a>
        ))}
      </div>
    </div>
  );
}
