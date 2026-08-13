import {
  formatDateShort,
  formatModoRanking,
  formatResultValue,
  getRegisterAvailability,
  getWodCaloriesValue,
} from "../utils/studentWodsUtils.js"

export default function StudentWodsListSection({
  copy,
  title,
  subtitle,
  rows = [],
  locale,
  emptyText,
  onView,
  onEdit,
  onRegister,
  onRanking,
}) {
  return (
    <article className="student-wods-card student-wods-list-section">
      <header className="student-wods-panel-header">
        <div>
          <p>{subtitle}</p>
          <h2>{title}</h2>
        </div>
        <span>{rows.length}</span>
      </header>

      {rows.length === 0 ? (
        <div className="student-wods-empty">{emptyText}</div>
      ) : (
        <div className="student-wods-wod-list">
          {rows.map((item) => {
            const wod = item.wod || item
            const availability = getRegisterAvailability(wod)
            const canRegister = !item.registered && availability.canRegister

            return (
              <article key={item.id || wod.id}>
                <div>
                  <small>{formatDateShort(wod.fecha, locale)}</small>
                  <strong>{wod.nombre || "WOD"}</strong>
                  <p>{formatModoRanking(wod.modo_ranking, copy)} · {getWodCaloriesValue(wod, item.calorias_estimadas)} {copy.kcal}</p>
                </div>

                <b>{item.registered ? formatResultValue(item) : copy.pending}</b>

                <div className="student-wods-row-actions">
                  <button type="button" onClick={() => onView?.(item)} title={copy.view}>👁️</button>
                  <button type="button" onClick={() => onRanking?.(wod)} title="Ranking">🏆</button>
                  {item.registered ? (
                    <button type="button" onClick={() => onEdit?.(item)} title={copy.edit}>✏️</button>
                  ) : (
                    <button type="button" disabled={!canRegister} onClick={() => onRegister?.(item)} title={copy.registerResult}>✎</button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </article>
  )
}
