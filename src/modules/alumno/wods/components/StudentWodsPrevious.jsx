import {
  estimateWodCalories,
  formatDateShort,
  formatModoRanking,
} from "../utils/studentWodsUtils.js"

export default function StudentWodsPrevious({ copy, items, locale }) {
  const visible = items.slice(0, 4)

  return (
    <article className="student-wods-card student-wods-previous">
      <header className="student-wods-panel-header">
        <div>
          <p>📅 {copy.previousWods}</p>
          <h2>{copy.previousWods}</h2>
        </div>
        <button type="button">{copy.viewAll}</button>
      </header>

      {visible.length === 0 ? (
        <div className="student-wods-empty">{copy.noPreviousWods}</div>
      ) : (
        <div className="student-wods-previous-grid">
          {visible.map((item) => {
            const kcal = estimateWodCalories(item).value

            return (
              <article key={item.id}>
                <small>{formatDateShort(item.fecha, locale)}</small>
                <strong>{item.nombre || "WOD"}</strong>
                <p>{formatModoRanking(item.modo_ranking, copy)}</p>
                <span>{kcal} {copy.kcal}</span>
              </article>
            )
          })}
        </div>
      )}
    </article>
  )
}
