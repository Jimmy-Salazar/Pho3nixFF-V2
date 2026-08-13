export default function AdminAthletesStats({ copy, stats, loading }) {
  const cards = [
    {
      icon: "👥",
      value: stats.registered,
      label: copy.registered,
      note: copy.registeredNote,
      breakdown: [
        [copy.men, stats.registeredMen],
        [copy.women, stats.registeredWomen],
      ],
    },
    {
      icon: "✓",
      value: stats.active,
      label: copy.active,
      note: copy.activeNote,
      breakdown: [
        [copy.men, stats.activeMen],
        [copy.women, stats.activeWomen],
      ],
    },
    {
      icon: "◷",
      value: stats.expiring,
      label: copy.expiring,
      note: copy.expiringNote,
      warning: true,
    },
    {
      icon: "○",
      value: stats.inactive,
      label: copy.inactive,
      note: copy.inactiveNote,
    },
  ]

  return (
    <section className="admin-athletes-stats" aria-label={copy.directoryTitle}>
      {cards.map((card) => (
        <article
          key={card.label}
          className={`admin-stat-card admin-athletes-stat-card${card.warning ? " is-warning" : ""}`}
        >
          <div className="admin-stat-icon" aria-hidden="true">{card.icon}</div>
          <div className="admin-stat-content">
            <strong>{loading ? "…" : card.value}</strong>
            <h2>{card.label}</h2>
            <p>{card.note}</p>

            {card.breakdown ? (
              <div className="admin-stat-breakdown">
                {card.breakdown.map(([label, value]) => (
                  <span key={label}>
                    <small>{label}</small>
                    <b>{loading ? "…" : value}</b>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  )
}
