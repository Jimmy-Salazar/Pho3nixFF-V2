const SECTIONS = ["summary", "athletes", "wods", "prs", "memberships"]
const PERIODS = [7, 30, 90, 365]

export default function AdminStatisticsFilters({ copy, section, period, onSection, onPeriod, loading }) {
  const labels = {
    summary: copy.summary,
    athletes: copy.athletes,
    wods: copy.wods,
    prs: copy.prs,
    memberships: copy.memberships,
  }
  const periodLabels = {
    7: copy.days7,
    30: copy.days30,
    90: copy.days90,
    365: copy.days365,
  }

  return (
    <section className="admin-statistics-filters">
      <div className="admin-statistics-tabs" role="tablist" aria-label={copy.title}>
        {SECTIONS.map((key) => (
          <button
            key={key}
            type="button"
            className={section === key ? "is-active" : ""}
            onClick={() => onSection(key)}
            aria-selected={section === key}
          >
            {labels[key]}
          </button>
        ))}
      </div>

      <div className="admin-statistics-periods" aria-label={copy.periodLabel}>
        {PERIODS.map((days) => (
          <button
            key={days}
            type="button"
            className={period === days ? "is-active" : ""}
            onClick={() => onPeriod(days)}
            disabled={loading}
          >
            {periodLabels[days]}
          </button>
        ))}
      </div>
    </section>
  )
}
