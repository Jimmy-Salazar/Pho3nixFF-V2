import {
  formatDateLong,
  formatModoRanking,
  formatResultValue,
} from "../utils/studentWodsUtils.js"

export default function StudentWodsDetailModal({ copy, item, locale, onClose }) {
  if (!item) return null

  const wod = item.wod || item

  return (
    <section className="student-wods-form-shell">
      <div className="student-wods-form-backdrop" onClick={onClose} />
      <article className="student-wods-form-card">
        <header>
          <div>
            <p>{copy.detail}</p>
            <h2>{wod.nombre || item.wod_nombre || "WOD"}</h2>
            <small>{formatDateLong(wod.fecha || item.fecha, locale)}</small>
          </div>
          <button type="button" onClick={onClose}>×</button>
        </header>

        <div className="student-wods-detail-body">
          <p><strong>{copy.mode}:</strong> {formatModoRanking(wod.modo_ranking, copy)}</p>
          <p><strong>{copy.resultForm}:</strong> {formatResultValue(item)}</p>
          {wod.descripcion ? <p className="is-description">{wod.descripcion}</p> : null}
          {item.notas || item.observacion ? <p><strong>{copy.notes}:</strong> {item.notas || item.observacion}</p> : null}
        </div>
      </article>
    </section>
  )
}
