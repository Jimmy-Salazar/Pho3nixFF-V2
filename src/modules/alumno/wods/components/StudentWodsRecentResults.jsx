import { formatDateShort, formatResultValue } from "../utils/studentWodsUtils.js"

export default function StudentWodsRecentResults({ copy, items, locale, onView, onEdit }) {
  const visible = items.slice(0, 3)

  return (
    <article className="student-wods-card">
      <header className="student-wods-panel-header">
        <div>
          <p>🏆 {copy.recentResults}</p>
          <h2>{copy.recentResults}</h2>
        </div>
        <span>{items.length}</span>
      </header>

      {visible.length === 0 ? (
        <div className="student-wods-empty">{copy.noRecentResults}</div>
      ) : (
        <div className="student-wods-list">
          {visible.map((item) => (
            <article key={item.id}>
              <span>🏆</span>
              <div>
                <strong>{item.wod_nombre || item.wod?.nombre || "WOD"}</strong>
                <small>{formatDateShort(item.fecha || item.created_at, locale)}</small>
              </div>
              <b>
                {formatResultValue(item)}
                <small>{item.modalidad || "RX"}</small>
              </b>
              <div className="student-wods-row-actions">
                {onView ? <button type="button" onClick={() => onView(item)} title={copy.view}>👁️</button> : null}
                {onEdit ? <button type="button" onClick={() => onEdit(item)} title={copy.edit}>✏️</button> : null}
              </div>
            </article>
          ))}
        </div>
      )}

      <button type="button" className="student-wods-wide-action">{copy.allMyResults}</button>
    </article>
  )
}
