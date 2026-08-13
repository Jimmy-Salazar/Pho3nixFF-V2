import { formatPercent } from "../utils/adminStatisticsUtils.js"

const CARDS = [
  { key: "activeAthletes", icon: "👥", helper: "activeAthletesHelp" },
  { key: "expiringSoon", icon: "◴", helper: "expiringSoonHelp", tone: "warning" },
  { key: "wodParticipationRate", icon: "W", label: "wodParticipation", helper: "wodParticipationHelp", percent: true },
  { key: "prCount", icon: "🏆", label: "registeredPrs", helper: "registeredPrsHelp" },
]

export default function AdminStatisticsSummary({ copy, summary, loading }) {
  return (
    <section className="admin-statistics-kpis" aria-label={copy.summary}>
      {CARDS.map((card) => {
        const value = card.percent ? formatPercent(summary?.[card.key]) : Number(summary?.[card.key] || 0)
        return (
          <article key={card.key} className={`admin-statistics-kpi ${card.tone ? `is-${card.tone}` : ""}`}>
            <div className="admin-statistics-kpi-icon" aria-hidden="true">{card.icon}</div>
            <div>
              <small>{copy[card.label || card.key]}</small>
              <strong>{loading ? "..." : value}</strong>
              <p>{copy[card.helper]}</p>
            </div>
          </article>
        )
      })}
    </section>
  )
}
