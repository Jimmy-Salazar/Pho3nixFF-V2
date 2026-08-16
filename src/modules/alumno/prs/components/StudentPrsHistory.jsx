import { formatDateCompact, formatLb } from "../utils/studentPrsUtils.js"

export default function StudentPrsHistory({
  copy,
  rows = [],
  totalRecords,
  page,
  totalPages,
  deletingId,
  onEdit,
  onDelete,
  onPageChange,
}) {
  return (
    <article className="student-prs-card">
      <header>
        <div>
          <p>🕒 {copy.prHistory}</p>
          <h2>{copy.latestRecords}</h2>
        </div>
        <span>{totalRecords}</span>
      </header>

      <div className="student-prs-history">
        {rows.length === 0 ? (
          <div className="student-prs-empty">{copy.noPrRecords}</div>
        ) : (
          rows.map((row) => (
            <div key={row.id}>
              <span>
                <b>{formatDateCompact(row.fecha)}</b>
                <small>{row.ejercicio_nombre}</small>
              </span>
              <strong>{formatLb(row.peso_libras)}</strong>
              <button type="button" onClick={() => onEdit(row)}>✎</button>
              <button type="button" onClick={() => onDelete(row)} disabled={deletingId === row.id}>🗑</button>
            </div>
          ))
        )}
      </div>

      <footer className="student-prs-pagination">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>←</button>
        <span>{copy.page} {page} / {totalPages}</span>
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>→</button>
      </footer>
    </article>
  )
}
