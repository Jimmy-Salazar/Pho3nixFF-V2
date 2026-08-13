export default function AdminWodsStats({ copy, stats, loading }) {
  const cards = [
    {
      icon: "🏋",
      value: stats.total,
      label: copy.total,
      note: copy.totalNote,
    },
    {
      icon: "◷",
      value: stats.drafts + stats.scheduled,
      label: copy.pending,
      note: copy.pendingNote,
      breakdown: [
        [copy.drafts, stats.drafts],
        [copy.scheduled, stats.scheduled],
      ],
    },
    {
      icon: "●",
      value: stats.active,
      label: copy.active,
      note: copy.activeNote,
      active: true,
    },
    {
      icon: "↺",
      value: stats.historical,
      label: copy.historical,
      note: copy.historicalNote,
    },
  ]

  return (
    <section className="admin-wods-stats" aria-label={copy.directoryTitle}>
      {cards.map((card) => (
        <article
          key={card.label}
          className={`admin-stat-card admin-wods-stat-card${card.active ? " is-active-wod" : ""}`}
        >
          <div className="admin-stat-icon" aria-hidden="true">{card.icon}</div>
          <div className="admin-stat-content">
            <strong>{loading ? "…" : card.value}</strong>
            <h2>{card.label}</h2>
            <p>{card.note}</p>
            {card.breakdown ? (
              <div className="admin-wods-stat-breakdown">
                {card.breakdown.map(([label, value]) => (
                  <span key={label}><small>{label}</small><b>{loading ? "…" : value}</b></span>
                ))}
              </div>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  )
}
