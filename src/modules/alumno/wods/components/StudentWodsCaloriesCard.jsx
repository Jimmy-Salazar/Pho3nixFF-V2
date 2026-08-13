import { formatKcal } from "../utils/studentWodsUtils.js"

export default function StudentWodsCaloriesCard({ copy, calories, loading }) {
  const value = Number(calories?.value || 0)

  return (
    <article className="student-wods-card student-wods-calories">
      <header>
        <div>
          <p>🔥 {copy.estimatedCalories}</p>
          <h2>{copy.calories}</h2>
        </div>
        <span>🔥</span>
      </header>

      <strong>{loading ? "..." : formatKcal(value)}</strong>
      <small>{copy.kcal}</small>

      <div className="student-wods-calories-range">
        <span>{formatKcal(calories?.min || 0)}</span>
        <span>{formatKcal(calories?.max || value || 0)}</span>
      </div>
    </article>
  )
}
