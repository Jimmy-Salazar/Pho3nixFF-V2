import { formatProfileDate } from "../utils/studentProfileUtils.js"

export default function StudentProfileRecentPrs({ copy, rows, locale, onViewAll }) {
  return (
    <article className="student-profile-card student-profile-recent">
      <header><div><p>🕒 {copy.recentPrs}</p><h2>{copy.latestPr}</h2></div></header>

      <div className="student-profile-recent-list">
        {rows.length === 0 ? (
          <div className="student-profile-empty">{copy.noPrs}</div>
        ) : (
          rows.map((row) => (
            <div key={row.id}>
              <span>🏋️</span>
              <div><strong>{row.ejercicio_nombre}</strong><small>{formatProfileDate(row.fecha, locale)}</small></div>
              <b>{row.peso_libras} lb</b>
            </div>
          ))
        )}
      </div>

      <button type="button" className="student-profile-wide-button" onClick={onViewAll}>{copy.viewRecords}</button>
    </article>
  )
}
