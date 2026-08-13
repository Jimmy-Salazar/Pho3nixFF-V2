import { formatCompactNumber } from "../utils/studentDashboardUtils.js"

export default function WeekProgress({ copy, completed, target, calories, caloriesTarget, series }) {
  const safeTarget = Math.max(Number(target || 1), 1)
  const safeCompleted = Math.min(Number(completed || 0), safeTarget)
  const percent = Math.round((safeCompleted / safeTarget) * 100)
  const labels = ["L", "M", "X", "J", "V", "S", "D"]
  const maxSeries = Math.max(...series, caloriesTarget, 1)

  return (
    <div className="student-week-card">
      <div className="student-week-summary">
        <strong>{percent}%</strong>
        <p>
          {safeCompleted} / {safeTarget} {copy.completed}
        </p>
        <small>
          {formatCompactNumber(calories)} / {formatCompactNumber(caloriesTarget)} kcal
        </small>
      </div>

      <div className="student-week-dots">
        {labels.map((day, index) => {
          const done = index < safeCompleted
          return (
            <span key={`${day}-${index}`} className={done ? "is-done" : ""}>
              <em>{day}</em>
              <b>{done ? "✓" : index + 1}</b>
            </span>
          )
        })}
      </div>

      <div className="student-week-chart" aria-hidden="true">
        {series.map((value, index) => (
          <span
            key={`${value}-${index}`}
            style={{ height: `${Math.max((Number(value || 0) / maxSeries) * 100, 8)}%` }}
          />
        ))}
      </div>
    </div>
  )
}
