import { formatPdaResult } from "../utils/studentPdaUtils.js"

export default function StudentPdaWodRankingModal({ copy, wod, rows, loading, currentUserId, onClose }) {
  return (
    <div className="student-pda-modal-shell" role="dialog" aria-modal="true">
      <button type="button" className="student-pda-modal-backdrop" onClick={onClose} />

      <section className="student-pda-modal student-pda-ranking-modal">
        <header>
          <div>
            <span>{copy.rankingWod}</span>
            <h2>{wod?.nombre || `WOD ${wod?.numero || ""}`}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={copy.close}>×</button>
        </header>

        <div className="student-pda-modal-body">
          {loading ? (
            <div className="student-pda-empty">{copy.loading}</div>
          ) : rows?.length ? (
            <div className="student-pda-ranking-list is-modal">
              {rows.map((row) => (
                <article key={row.resultado_id} className={row.usuario_id === currentUserId ? "is-me" : ""}>
                  <strong>#{row.posicion || "—"}</strong>

                  <div className="student-pda-ranking-athlete">
                    {row.atleta_foto_url ? (
                      <img src={row.atleta_foto_url} alt={row.atleta_nombre || copy.athlete} />
                    ) : (
                      <span>{getInitials(row.atleta_nombre)}</span>
                    )}
                    <div>
                      <b>{row.atleta_nombre || copy.athlete}</b>
                      <small>{row.categoria_nombre || ""}</small>
                    </div>
                  </div>

                  <div className="student-pda-ranking-points">
                    <b>{formatPdaResult(row, wod, copy)}</b>
                    <small>{Number(row.puntos || 0)} {copy.pts}</small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="student-pda-empty">{copy.noRanking}</div>
          )}
        </div>
      </section>
    </div>
  )
}

function getInitials(name) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean)
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "PH"
}
