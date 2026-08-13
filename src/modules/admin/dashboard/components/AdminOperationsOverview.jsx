const MOVEMENT_KEYS = [
  { key: "existing", className: "is-existing" },
  { key: "newAthletes", className: "is-new" },
  { key: "departed", className: "is-departed" },
]

export default function AdminOperationsOverview({
  copy,
  growthSeries,
  hasGrowthData,
  roleSummary,
  metrics,
  loading,
}) {
  const maxValue = Math.max(
    1,
    ...growthSeries.flatMap((item) =>
      MOVEMENT_KEYS.map((series) => Number(item?.[series.key] || 0))
    )
  )

  const totalRoles = Math.max(
    1,
    Number(roleSummary.athletes || 0) +
      Number(roleSummary.coaches || 0) +
      Number(roleSummary.admins || 0) +
      Number(roleSummary.others || 0)
  )

  const roles = [
    { key: "athletes", label: copy.athletes, value: roleSummary.athletes },
    { key: "coaches", label: copy.coaches, value: roleSummary.coaches },
    { key: "admins", label: copy.administrators, value: roleSummary.admins },
  ]

  const movementLabels = {
    existing: copy.existingAthletes,
    newAthletes: copy.newAthletes,
    departed: copy.departedAthletes,
  }

  return (
    <section className="admin-panel admin-operations-panel">
      <div className="admin-panel-heading">
        <div>
          <span>{copy.operations}</span>
          <h2>{copy.growthTitle}</h2>
          <p>{copy.growthSubtitle}</p>
        </div>
      </div>

      <div className="admin-growth-legend" aria-label={copy.growthLegend}>
        {MOVEMENT_KEYS.map((series) => (
          <span key={series.key}>
            <i className={series.className} aria-hidden="true" />
            {movementLabels[series.key]}
          </span>
        ))}
      </div>

      <div className="admin-operations-content">
        <div className="admin-growth-chart-scroll">
          <div
            className="admin-growth-chart"
            role="img"
            aria-label={copy.growthTitle}
            style={{ "--admin-growth-month-count": Math.max(1, growthSeries.length) }}
          >
            {hasGrowthData ? (
              growthSeries.map((item) => (
                <div key={`${item.year}-${item.month}`} className="admin-growth-month">
                  <div className="admin-growth-bars">
                    {MOVEMENT_KEYS.map((series) => {
                      const value = Number(item?.[series.key] || 0)
                      const height = value > 0 ? Math.max(8, (value / maxValue) * 100) : 0

                      return (
                        <div
                          key={series.key}
                          className={`admin-growth-bar ${series.className}`}
                          title={`${item.label}: ${movementLabels[series.key]} ${value}`}
                          aria-label={`${item.label}: ${movementLabels[series.key]} ${value}`}
                        >
                          <strong>{value}</strong>
                          <div className="admin-growth-track">
                            <span style={{ height: `${height}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <small>{item.label}</small>
                </div>
              ))
            ) : (
              <div className="admin-growth-empty">{copy.noGrowthData}</div>
            )}
          </div>
        </div>

        <div className="admin-role-summary">
          <div className="admin-role-summary-title">
            <span>{copy.currentCommunity}</span>
            <strong>{loading ? "..." : metrics.totalUsers}</strong>
          </div>

          {roles.map((item) => {
            const percent = Math.round((Number(item.value || 0) / totalRoles) * 100)

            return (
              <div key={item.key} className="admin-role-row">
                <div>
                  <span>{item.label}</span>
                  <strong>{loading ? "..." : item.value}</strong>
                </div>
                <div className="admin-role-track">
                  <span style={{ width: `${percent}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
