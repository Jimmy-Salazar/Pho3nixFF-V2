import { getInitials } from "../../dashboard/utils/adminDashboardUtils.js"
import {
  getEditionStatusLabel,
  getModalityLabel,
  getPdaWodTypeLabel,
  getRankingModeLabel,
  getResultMark,
  getResultTypeLabel,
} from "../utils/adminPdaUtils.js"

const TAB_KEYS = ["wods", "results", "ranking"]

export default function AdminPdaWorkspace({
  copy,
  locale,
  editions,
  selectedEdition,
  selectedEditionId,
  onEditionChange,
  onCreateEdition,
  onEditEdition,
  onEditionAction,
  tab,
  onTabChange,
  wods,
  results,
  athletes,
  selectedWodId,
  onWodChange,
  wodRanking,
  generalRanking,
  loadingRanking,
  onAddWod,
  onEditWod,
  onDeleteWod,
  onToggleWodPublished,
  onEditResult,
}) {
  if (!selectedEdition) {
    return (
      <section className="admin-panel admin-pda-empty-edition">
        <span aria-hidden="true">▤</span>
        <h2>{copy.noEdition}</h2>
        <p>{copy.noEditionHelp}</p>
        <button type="button" className="admin-pda-primary-button" onClick={onCreateEdition}>
          + {copy.createEdition}
        </button>
      </section>
    )
  }

  return (
    <>
      <section className="admin-panel admin-pda-edition-bar">
        <div className="admin-pda-edition-selector">
          <label>
            <span>{copy.edition}</span>
            <select value={selectedEditionId} onChange={(event) => onEditionChange(event.target.value)}>
              {editions.map((edition) => (
                <option key={edition.id} value={edition.id}>
                  {edition.nombre} · {edition.anio}
                </option>
              ))}
            </select>
          </label>

          <div className="admin-pda-edition-meta">
            <strong>{selectedEdition.nombre}</strong>
            <span className={`is-${selectedEdition.estado}`}>
              {getEditionStatusLabel(selectedEdition, copy)}
            </span>
            <small>
              {formatDate(selectedEdition.fecha_inicio, locale)} — {formatDate(selectedEdition.fecha_fin, locale)}
            </small>
          </div>
        </div>

        <div className="admin-pda-edition-actions">
          <button type="button" onClick={() => onEditEdition(selectedEdition)}>{copy.editEdition}</button>
          {!selectedEdition.publicada ? (
            <button type="button" className="is-primary" onClick={() => onEditionAction("publish")}>
              {copy.publishEdition}
            </button>
          ) : null}
          {selectedEdition.estado === "borrador" ? (
            <button type="button" className="is-primary" onClick={() => onEditionAction("activate")}>
              {copy.activateEdition}
            </button>
          ) : null}
          {selectedEdition.estado === "activa" ? (
            <button type="button" className="is-danger" onClick={() => onEditionAction("close")}>
              {copy.closeEdition}
            </button>
          ) : null}
          {selectedEdition.estado === "cerrada" ? (
            <button type="button" onClick={() => onEditionAction("reopen")}>
              {copy.reopenEdition}
            </button>
          ) : null}
          <button type="button" className="admin-pda-new-edition" onClick={onCreateEdition}>
            + {copy.createEdition}
          </button>
        </div>
      </section>

      <section className="admin-panel admin-pda-workspace">
        <div className="admin-pda-tabs" role="tablist" aria-label={copy.moduleLabel}>
          {TAB_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              className={tab === key ? "is-active" : ""}
              aria-selected={tab === key}
              onClick={() => onTabChange(key)}
            >
              {key === "wods" && copy.wodsTab}
              {key === "results" && copy.resultsTab}
              {key === "ranking" && copy.rankingTab}
            </button>
          ))}
        </div>

        {tab === "wods" ? (
          <WodsPanel
            copy={copy}
            locale={locale}
            wods={wods}
            onAdd={onAddWod}
            onEdit={onEditWod}
            onDelete={onDeleteWod}
            onTogglePublished={onToggleWodPublished}
          />
        ) : null}

        {tab === "results" ? (
          <ResultsPanel
            copy={copy}
            wods={wods}
            athletes={athletes}
            results={results}
            selectedWodId={selectedWodId}
            onWodChange={onWodChange}
            onEditResult={onEditResult}
            ranking={wodRanking}
            loadingRanking={loadingRanking}
          />
        ) : null}

        {tab === "ranking" ? (
          <GeneralRankingPanel copy={copy} rows={generalRanking} loading={loadingRanking} />
        ) : null}
      </section>
    </>
  )
}

function WodsPanel({ copy, locale, wods, onAdd, onEdit, onDelete, onTogglePublished }) {
  return (
    <div className="admin-pda-panel-content">
      <div className="admin-pda-panel-heading">
        <div>
          <span>{copy.moduleLabel}</span>
          <h2>{copy.wodsTab}</h2>
        </div>
        <button type="button" className="admin-pda-primary-button" onClick={onAdd}>
          + {copy.addWod}
        </button>
      </div>

      {wods.length === 0 ? (
        <div className="admin-pda-empty">{copy.noWods}</div>
      ) : (
        <div className="admin-pda-table-wrap">
          <table className="admin-pda-table">
            <thead>
              <tr>
                <th>{copy.wodNumber}</th>
                <th>{copy.wodName}</th>
                <th>{copy.wodDate}</th>
                <th>{copy.resultType}</th>
                <th>{copy.modality}</th>
                <th>{copy.status}</th>
                <th>{copy.actions}</th>
              </tr>
            </thead>
            <tbody>
              {wods.map((wod) => (
                <tr key={wod.id}>
                  <td><strong className="admin-pda-wod-number">{String(wod.numero).padStart(2, "0")}</strong></td>
                  <td>
                    <div className="admin-pda-name-cell">
                      <strong>{wod.nombre}</strong>
                      <small>{wod.tipo_wod ? getPdaWodTypeLabel(wod.tipo_wod, copy) : getRankingModeLabel(wod, copy)}</small>
                    </div>
                  </td>
                  <td>{wod.fecha ? formatDate(wod.fecha, locale) : "—"}</td>
                  <td>
                    <div className="admin-pda-name-cell">
                      <strong>{getResultTypeLabel(wod, copy)}</strong>
                      <small>{getRankingModeLabel(wod, copy)}</small>
                    </div>
                  </td>
                  <td>{getModalityLabel(wod.modalidad, copy)}</td>
                  <td>
                    <span className={`admin-pda-status ${wod.publicado ? "is-published" : "is-draft"}`}>
                      {wod.publicado ? copy.published : copy.pending}
                    </span>
                  </td>
                  <td>
                    <div className="admin-pda-row-actions">
                      <button type="button" onClick={() => onEdit(wod)}>{copy.edit}</button>
                      <button type="button" onClick={() => onTogglePublished(wod)}>
                        {wod.publicado ? copy.unpublish : copy.publish}
                      </button>
                      <button type="button" className="is-danger" onClick={() => onDelete(wod)}>{copy.delete}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ResultsPanel({
  copy,
  wods,
  athletes,
  results,
  selectedWodId,
  onWodChange,
  onEditResult,
  ranking,
  loadingRanking,
}) {
  const selectedWod = wods.find((row) => row.id === selectedWodId) || null
  const resultsByAthlete = new Map(
    results
      .filter((row) => row.pda_wod_id === selectedWodId)
      .map((row) => [row.usuario_id, row])
  )

  return (
    <div className="admin-pda-panel-content">
      <div className="admin-pda-panel-heading admin-pda-results-heading">
        <div>
          <span>{copy.resultsTab}</span>
          <h2>{selectedWod?.nombre || copy.selectWod}</h2>
          <p>{copy.activeAthletesHelp}</p>
        </div>
        <div className="admin-pda-heading-actions">
          <select value={selectedWodId || ""} onChange={(event) => onWodChange(event.target.value)}>
            <option value="">{copy.selectWod}</option>
            {wods.map((wod) => (
              <option key={wod.id} value={wod.id}>
                {String(wod.numero).padStart(2, "0")} · {wod.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedWod ? (
        <div className="admin-pda-empty">{copy.selectWod}</div>
      ) : athletes.length === 0 ? (
        <div className="admin-pda-empty">{copy.noActiveAthletes}</div>
      ) : (
        <div className="admin-pda-results-layout">
          <div className="admin-pda-table-wrap">
            <table className="admin-pda-table">
              <thead>
                <tr>
                  <th>{copy.athlete}</th>
                  <th>{copy.mark}</th>
                  <th>{copy.position}</th>
                  <th>{copy.points}</th>
                  <th>{copy.actions}</th>
                </tr>
              </thead>
              <tbody>
                {athletes.map((athlete) => {
                  const result = resultsByAthlete.get(athlete.id) || null
                  return (
                    <tr key={athlete.id}>
                      <td><AthleteCell athlete={athlete} /></td>
                      <td>{getResultMark(result, selectedWod)}</td>
                      <td>{result?.posicion ? `#${result.posicion}` : "—"}</td>
                      <td><strong className="admin-pda-points">{Number(result?.puntos || 0).toLocaleString("es-EC")}</strong></td>
                      <td>
                        <button type="button" className="admin-pda-inline-button" onClick={() => onEditResult(athlete, result, selectedWod)}>
                          {result ? copy.editResult : copy.registerResult}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <WodRankingCard copy={copy} wod={selectedWod} rows={ranking} loading={loadingRanking} />
        </div>
      )}
    </div>
  )
}

function WodRankingCard({ copy, wod, rows, loading }) {
  return (
    <aside className="admin-pda-ranking-card">
      <header>
        <span>{copy.rankingMode}</span>
        <h3>{wod.nombre}</h3>
        <p>{getRankingModeLabel(wod, copy)}</p>
      </header>

      {loading ? (
        <div className="admin-pda-empty">…</div>
      ) : rows.length === 0 ? (
        <div className="admin-pda-empty">{copy.noResults}</div>
      ) : (
        <div className="admin-pda-mini-ranking">
          {rows.map((row) => (
            <div key={row.resultado_id} className={Number(row.puntos || 0) === 0 ? "is-zero" : ""}>
              <strong>{row.posicion ? `#${row.posicion}` : "—"}</strong>
              <AthleteCell athlete={{
                nombre: row.atleta_nombre,
                foto_url: row.atleta_foto_url,
                sexo: row.atleta_sexo,
              }} compact />
              <span>{getResultMark(row, wod)}</span>
              <b>{Number(row.puntos || 0).toLocaleString("es-EC")} pts</b>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}

function GeneralRankingPanel({ copy, rows, loading }) {
  return (
    <div className="admin-pda-panel-content">
      <div className="admin-pda-panel-heading">
        <div>
          <span>{copy.points}</span>
          <h2>{copy.rankingTab}</h2>
          <p>{copy.rankingHelp}</p>
        </div>
      </div>

      {loading ? (
        <div className="admin-pda-empty">…</div>
      ) : rows.length === 0 ? (
        <div className="admin-pda-empty">{copy.noRanking}</div>
      ) : (
        <div className="admin-pda-table-wrap">
          <table className="admin-pda-table admin-pda-general-ranking-table">
            <thead>
              <tr>
                <th>{copy.position}</th>
                <th>{copy.athlete}</th>
                <th>{copy.points}</th>
                <th>{copy.completedWods}</th>
                <th>{copy.wins}</th>
                <th>{copy.seconds}</th>
                <th>{copy.thirds}</th>
                <th>{copy.lastPosition}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.usuario_id}>
                  <td><strong className="admin-pda-ranking-position">#{row.posicion_general}</strong></td>
                  <td><AthleteCell athlete={{ nombre: row.atleta_nombre, foto_url: row.atleta_foto_url, sexo: row.atleta_sexo }} /></td>
                  <td><strong className="admin-pda-points is-large">{Number(row.puntos_totales || 0).toLocaleString("es-EC")}</strong></td>
                  <td>{row.wods_completados}</td>
                  <td>{row.primeros_lugares}</td>
                  <td>{row.segundos_lugares}</td>
                  <td>{row.terceros_lugares}</td>
                  <td>{row.ultima_posicion ? `#${row.ultima_posicion}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AthleteCell({ athlete, compact = false }) {
  const name = athlete?.nombre || athlete?.email || "Atleta PHO3NIX"

  return (
    <div className={`admin-pda-athlete-cell${compact ? " is-compact" : ""}`}>
      <div className="admin-pda-avatar">
        {athlete?.foto_url ? <img src={athlete.foto_url} alt={name} /> : <span>{getInitials(name)}</span>}
      </div>
      <div>
        <strong>{name}</strong>
        {!compact ? <small>{athlete?.sexo || athlete?.email || ""}</small> : null}
      </div>
    </div>
  )
}

function formatDate(value, locale) {
  if (!value) return "—"
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number)
  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}
