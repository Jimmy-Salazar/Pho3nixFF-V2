export default function StudentPdaGeneralRanking({ copy, rows, currentUserId }) {
  return (
    <section className="student-pda-card student-pda-ranking">
      <header className="student-pda-section-head">
        <div>
          <span>LEADERBOARD</span>
          <h2>{copy.ranking}</h2>
        </div>
      </header>

      {rows?.length ? (
        <div className="student-pda-ranking-list">
          {rows.slice(0, 15).map((row) => {
            const own = row.usuario_id === currentUserId

            return (
              <article key={`${row.usuario_id}-${row.categoria_id}`} className={own ? "is-me" : ""}>
                <strong>#{row.posicion_general || "—"}</strong>

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
                  <b>{Number(row.puntos_totales || 0)}</b>
                  <small>{copy.pts}</small>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="student-pda-empty">{copy.noRanking}</div>
      )}
    </section>
  )
}

function getInitials(name) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean)
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "PH"
}
