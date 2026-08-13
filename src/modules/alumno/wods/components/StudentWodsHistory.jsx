import { formatResultValue, getInitials } from "../utils/studentWodsUtils.js"

export default function StudentWodsHistory({ copy, rows, currentUserId, onView, onEdit }) {
  const visibleRows = rows.slice(0, 4)

  return (
    <article className="student-wods-card">
      <header className="student-wods-panel-header">
        <div>
          <p>🕒 {copy.historyDay}</p>
          <h2>{copy.historyDay}</h2>
        </div>
        <span>{rows.length}</span>
      </header>

      {visibleRows.length === 0 ? (
        <Empty text={copy.noHistory} />
      ) : (
        <div className="student-wods-list">
          {visibleRows.map((item, index) => {
            const isMine =
              item.usuario_id === currentUserId ||
              item.usuario === currentUserId ||
              item.user_id === currentUserId

            return (
              <article key={item.id || index} className={isMine ? "is-mine" : ""}>
                <span>{getInitials(item.nombre || item.usuario_nombre || copy.athleteFallback)}</span>
                <div>
                  <strong>
                    {item.nombre || item.usuario_nombre || copy.athleteFallback}
                    {isMine ? " (Tú)" : ""}
                  </strong>
                  <small>{item.modalidad || "RX"}</small>
                </div>
                <b>
                  {formatResultValue(item)}
                  <small>{index + 1}°</small>
                </b>
                <div className="student-wods-row-actions">
                  {onView ? <button type="button" onClick={() => onView(item)} title={copy.view}>👁️</button> : null}
                  {isMine && onEdit ? <button type="button" onClick={() => onEdit(item)} title={copy.edit}>✏️</button> : null}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <button type="button" className="student-wods-wide-action">{copy.fullHistory}</button>
    </article>
  )
}

function Empty({ text }) {
  return <div className="student-wods-empty">{text}</div>
}
