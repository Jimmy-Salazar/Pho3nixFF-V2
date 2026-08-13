import { numberText } from "../utils/studentProgressUtils.js"

export default function StudentThirtyDaySummary({ copy, wodSummary, prSummary }) {
  const metrics = [
    { icon: "🏋️", value: wodSummary?.wods30Days || 0, label: copy.completedWods },
    { icon: "🔥", value: numberText(wodSummary?.calories30Days, 0), label: copy.calories },
    { icon: "📅", value: wodSummary?.trainingDays30Days || 0, label: copy.trainingDays },
    { icon: "🏆", value: prSummary?.prs30Days || 0, label: copy.prs },
  ]

  return (
    <article className="student-progress-card student-summary-card">
      <header>
        <div><p>▦ {copy.last30Days}</p><h2>{copy.connectedPerformance}</h2></div>
      </header>

      <div className="student-summary-metrics">
        {metrics.map((item) => (
          <div key={item.label}>
            <span>{item.icon}</span>
            <strong>{item.value}</strong>
            <small>{item.label}</small>
          </div>
        ))}
      </div>

      <footer>
        <span>{copy.averagePerWod}: <strong>{numberText(wodSummary?.averageCalories, 0)} kcal</strong></span>
        <span>{copy.frequentModality}: <strong>{wodSummary?.frequentModality || copy.noData}</strong></span>
      </footer>
    </article>
  )
}
