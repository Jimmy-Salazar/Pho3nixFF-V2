import { formatDateCompact, formatLb } from "../utils/studentPrsUtils.js"

export default function StudentPrsBestMarks({ copy, rows = [], onSelectExercise }) {
  return (
    <article className="student-prs-card">
      <header>
        <div>
          <p>🏅 {copy.bestMarks}</p>
          <h2>{copy.topByMovement}</h2>
        </div>
        <span>{rows.length}</span>
      </header>

      <div className="student-prs-best-list">
        {rows.length === 0 ? (
          <div className="student-prs-empty">{copy.registerFirstMarks}</div>
        ) : (
          rows.slice(0, 8).map((row) => (
            <button key={row.id} type="button" onClick={() => onSelectExercise(row.ejercicio_id)}>
              <span>🏋️</span>
              <div>
                <b>{row.ejercicio_nombre}</b>
                <strong>{formatLb(row.peso_libras)}</strong>
                <small>{formatDateCompact(row.fecha)}</small>
              </div>
            </button>
          ))
        )}
      </div>
    </article>
  )
}
