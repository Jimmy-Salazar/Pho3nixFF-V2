import { formatKcal } from "../utils/studentWodsUtils.js"

export default function StudentWodsWeeklyCalories({ copy, weekly }) {
  const total = Number(weekly?.total || 0)
  const target = Number(weekly?.target || 6000)
  const percentage = weekly?.percent ?? (target > 0 ? Math.min(Math.round((total / target) * 100), 100) : 0)
  const days = weekly?.days || []
  const maxValue = Math.max(...days.map((item) => Number(item.calories || 0)), 1)

  return (
    <article className="student-wods-card student-wods-weekly">
      <header>
        <div>
          <p>📊 {copy.weeklyCalories}</p>
          <h2>{formatKcal(total)} <small>{copy.kcal}</small></h2>
        </div>
        <span>{percentage}%</span>
      </header>

      <div className="student-wods-progress">
        <i style={{ width: `${percentage}%` }} />
      </div>

      <div className="student-wods-bars">
        {days.map((day) => (
          <div key={day.dateIso}>
            <span style={{ height: `${Math.max((Number(day.calories || 0) / maxValue) * 100, 6)}%` }} />
            <small>{day.label}</small>
          </div>
        ))}
      </div>

      <footer>{copy.target}: {formatKcal(target)} {copy.kcal}</footer>
    </article>
  )
}
