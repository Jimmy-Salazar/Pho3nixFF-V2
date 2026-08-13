import {
  formatPdaDate,
  formatPdaResult,
  getPdaWodStatus,
  getWodPublicationLabel,
} from "../utils/studentPdaUtils.js"

export default function StudentPdaWods({
  copy,
  locale,
  wods,
  results,
  onDetail,
  onRanking,
}) {
  const resultByWod = new Map((results || []).map((row) => [row.pda_wod_id, row]))

  return (
    <section className="student-pda-card student-pda-wods">
      <header className="student-pda-section-head">
        <div>
          <span>PDA</span>
          <h2>{copy.schedule}</h2>
        </div>
      </header>

      {wods?.length ? (
        <div className="student-pda-wod-list">
          {wods.map((wod) => {
            const result = resultByWod.get(wod.id) || null
            const status = getPdaWodStatus(wod, result)

            return (
              <article key={wod.id} className={`student-pda-wod is-${status}`}>
                <div className="student-pda-wod-number">
                  <small>PDA</small>
                  <strong>{String(wod.numero || "").padStart(2, "0")}</strong>
                </div>

                <div className="student-pda-wod-body">
                  <div className="student-pda-wod-meta">
                    <span>{formatPdaDate(wod.fecha, locale)}</span>
                    <span>{wod.tipo_resultado === "tiempo" ? copy.time : copy.reps}</span>
                    <span className={wod.publicado ? "is-published" : "is-draft"}>
                      {getWodPublicationLabel(wod, copy)}
                    </span>
                  </div>

                  <h3>{wod.nombre || `PDA ${wod.numero}`}</h3>
                  <p>{wod.descripcion || "PHO3NIX PDA"}</p>

                  {result ? (
                    <div className="student-pda-wod-result">
                      <small>{copy.result}</small>
                      <strong>{formatPdaResult(result, wod, copy)}</strong>
                      {result?.posicion ? (
                        <span>#{result.posicion} · {Number(result.puntos || 0)} {copy.pts}</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="student-pda-wod-actions">
                  <button type="button" className="student-pda-secondary" onClick={() => onDetail(wod)}>
                    {copy.viewDetail}
                  </button>

                  <button type="button" className="student-pda-secondary" onClick={() => onRanking(wod)}>
                    {copy.viewRanking}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
