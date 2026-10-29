/**
 * MetricsBadge — Compact inline badge for a single scored metric.
 *
 * Displays a pill-shaped badge with:
 * - A label (e.g. "Financial Health")
 * - A score (e.g. 8/10) or level (e.g. "Low Risk")
 * - Color-coded by tier (high=green, medium=amber, low=red)
 *
 * Used in condensed views — e.g. inside risk factor cards or
 * summary rows where the full MetricsCard would be too large.
 *
 * @param {{
 *   label: string,
 *   value: number | string,
 *   max?: number,
 *   size?: 'sm' | 'md'
 * }} props
 */
export function MetricsBadge({ label, value, max = 10, size = 'md' }) {
  /**
   * Determines color tier from a numeric score or string level.
   */
  function getTier() {
    if (typeof value === 'number') {
      if (value >= 7) return 'high';
      if (value >= 4) return 'medium';
      return 'low';
    }
    // String levels: Low risk = good (high tier), High risk = bad (low tier)
    const v = String(value).toLowerCase();
    if (v === 'low' || v === 'high confidence') return 'high';
    if (v === 'medium') return 'medium';
    if (v === 'high' || v === 'critical') return 'low';
    return 'medium';
  }

  const tier = getTier();
  const displayValue = typeof value === 'number' ? `${value}${max ? `/${max}` : ''}` : value;
  const badgeSize = size === 'sm' ? 'badge-sm' : 'badge-md';

  return (
    <span
      className={`metrics-badge ${tier} ${badgeSize}`}
      title={`${label}: ${displayValue}`}
      aria-label={`${label}: ${displayValue}`}
    >
      <span className="badge-label">{label}</span>
      <span className="badge-value">{displayValue}</span>
    </span>
  );
}
