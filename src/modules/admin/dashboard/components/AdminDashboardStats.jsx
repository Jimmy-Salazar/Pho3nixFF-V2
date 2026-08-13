export default function AdminDashboardStats({ copy, metrics, loading }) {
  const items = [
    {
      key: "registeredAthletes",
      icon: "◎",
      value: metrics.registeredAthletes,
      label: copy.registeredAthletes,
      helper: copy.registeredAthletesHelp,
      breakdown: [
        { key: "men", label: copy.men, value: metrics.registeredMen },
        { key: "women", label: copy.women, value: metrics.registeredWomen },
      ],
    },
    {
      key: "activeAthletes",
      icon: "👥",
      value: metrics.activeAthletes,
      label: copy.activeAthletes,
      helper: copy.activeAthletesHelp,
      breakdown: [
        { key: "men", label: copy.men, value: metrics.activeMen },
        { key: "women", label: copy.women, value: metrics.activeWomen },
      ],
    },
  ]

  return (
    <section className="admin-dashboard-stats" aria-label={copy.operations}>
      {items.map((item) => (
        <article
          key={item.key}
          className={`admin-stat-card ${item.tone ? `is-${item.tone}` : ""}`}
        >
          <span className="admin-stat-icon" aria-hidden="true">{item.icon}</span>

          <div className="admin-stat-content">
            <strong>{loading ? "..." : item.value}</strong>
            <h2>{item.label}</h2>

            {item.breakdown ? (
              <div className="admin-stat-breakdown" aria-label={item.label}>
                {item.breakdown.map((entry) => (
                  <span key={entry.key}>
                    <small>{entry.label}</small>
                    <b>{loading ? "..." : entry.value}</b>
                  </span>
                ))}
              </div>
            ) : null}

            <p>{item.helper}</p>
          </div>
        </article>
      ))}
    </section>
  )
}
