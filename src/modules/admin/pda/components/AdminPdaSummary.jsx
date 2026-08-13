export default function AdminPdaSummary({ copy, summary, loading }) {
  const cards = [
    { icon: "▤", value: summary.totalWods, label: copy.totalWods, note: copy.totalWodsNote },
    { icon: "●", value: summary.publishedWods, label: copy.publishedWods, note: copy.publishedWodsNote },
    { icon: "👥", value: summary.activeAthletes, label: copy.activeAthletes, note: copy.activeAthletesNote },
    { icon: "★", value: summary.completedResults, label: copy.completedResults, note: copy.completedResultsNote },
  ]

  return (
    <section className="admin-pda-summary" aria-label={copy.moduleLabel}>
      {cards.map((card) => (
        <article key={card.label} className="admin-stat-card admin-pda-summary-card">
          <div className="admin-stat-icon" aria-hidden="true">{card.icon}</div>
          <div className="admin-stat-content">
            <strong>{loading ? "…" : card.value}</strong>
            <h2>{card.label}</h2>
            <p>{card.note}</p>
          </div>
        </article>
      ))}
    </section>
  )
}
