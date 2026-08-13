const CARDS = [
  { key: "total", icon: "🏆", label: "totalRecords" },
  { key: "thisMonth", icon: "📈", label: "monthRecords" },
  { key: "exercisesWithPr", icon: "🏋", label: "exercisesWithPr" },
  { key: "athletesWithPr", icon: "👥", label: "athletesWithPr" },
]

export default function AdminPrsStats({ copy, stats, loading }) {
  return (
    <section className="admin-prs-stats" aria-label={copy.module}>
      {CARDS.map((card) => (
        <article key={card.key} className="admin-prs-stat-card">
          <span className="admin-prs-stat-icon" aria-hidden="true">{card.icon}</span>
          <div>
            <small>{copy[card.label]}</small>
            <strong>{loading ? "..." : stats[card.key]}</strong>
          </div>
        </article>
      ))}
    </section>
  )
}
