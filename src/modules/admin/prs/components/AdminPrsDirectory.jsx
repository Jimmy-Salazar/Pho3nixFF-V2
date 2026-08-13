import {
  formatDate,
  formatWeight,
  getAthleteFromRecord,
  getAthleteName,
} from "../utils/adminPrsUtils.js"

export default function AdminPrsDirectory({
  copy,
  locale,
  loading,
  rows,
  search,
  selectedExerciseId,
  ranking,
  genderFilter,
  onSearch,
  onSelectExercise,
  onGenderFilter,
  onCreateExercise,
  onEditExercise,
  onDeleteExercise,
  onOpenHistory,
}) {
  const selectedExercise = rows.find((row) => String(row.id) === String(selectedExerciseId)) || null

  return (
    <section className="admin-prs-directory" id="admin-quick-actions">
      <div className="admin-prs-toolbar">
        <label className="admin-prs-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder={copy.searchPlaceholder}
          />
        </label>

        <button type="button" className="admin-prs-toolbar-button" onClick={onCreateExercise}>
          <span aria-hidden="true">＋</span>
          {copy.newExercise}
        </button>
      </div>

      <div className="admin-prs-workspace">
        <section className="admin-prs-panel admin-prs-exercises-panel">
          <header className="admin-prs-panel-header">
            <div>
              <span>{copy.exercisesTable}</span>
              <p>{copy.exercisesSubtitle}</p>
            </div>
            <strong>{rows.length}</strong>
          </header>

          {loading ? (
            <EmptyState text={copy.loading} />
          ) : rows.length === 0 ? (
            <EmptyState text={copy.noExercises} />
          ) : (
            <div className="admin-prs-table-wrap">
              <table className="admin-prs-table admin-prs-exercises-table">
                <thead>
                  <tr>
                    <th>{copy.exercise}</th>
                    <th>{copy.bestMark}</th>
                    <th>{copy.previousMark}</th>
                    <th>{copy.improvement}</th>
                    <th>{copy.records}</th>
                    <th>{copy.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <ExerciseRow
                      key={row.id}
                      copy={copy}
                      locale={locale}
                      row={row}
                      selected={String(row.id) === String(selectedExerciseId)}
                      onSelect={() => onSelectExercise(row.id)}
                      onEdit={() => onEditExercise(row)}
                      onDelete={() => onDeleteExercise(row)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-prs-panel admin-prs-ranking-panel">
          <header className="admin-prs-panel-header admin-prs-ranking-header">
            <div>
              <span>{copy.ranking}</span>
              <p>{selectedExercise?.nombre || copy.selectExercise}</p>
            </div>
            <strong>{ranking.length}</strong>
          </header>

          <div className="admin-prs-gender-filter" role="group" aria-label={copy.ranking}>
            {[
              { key: "all", label: copy.all },
              { key: "male", label: copy.men },
              { key: "female", label: copy.women },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                className={genderFilter === item.key ? "is-active" : ""}
                onClick={() => onGenderFilter(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {!selectedExercise ? (
            <EmptyState text={copy.selectExercise} />
          ) : loading ? (
            <EmptyState text={copy.loading} />
          ) : ranking.length === 0 ? (
            <EmptyState text={copy.noRanking} />
          ) : (
            <div className="admin-prs-table-wrap admin-prs-ranking-table-wrap">
              <table className="admin-prs-table admin-prs-ranking-table">
                <thead>
                  <tr>
                    <th>{copy.position}</th>
                    <th>{copy.athlete}</th>
                    <th>{copy.weight}</th>
                    <th>{copy.date}</th>
                    <th>{copy.history}</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((record, index) => (
                    <RankingRow
                      key={`${record.id || index}-${index}`}
                      copy={copy}
                      locale={locale}
                      record={record}
                      position={index + 1}
                      onOpenHistory={() => onOpenHistory(record)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </section>
  )
}

function ExerciseRow({ copy, locale, row, selected, onSelect, onEdit, onDelete }) {
  return (
    <tr className={selected ? "is-selected" : ""} onClick={onSelect}>
      <td data-label={copy.exercise}>
        <button type="button" className="admin-prs-exercise-name" onClick={onSelect}>
          <span aria-hidden="true">🏋</span>
          <span>
            <strong>{row.nombre}</strong>
            <small>{row.athleteCount} {copy.athletesWithPr.toLowerCase()}</small>
          </span>
        </button>
      </td>
      <td data-label={copy.bestMark}>
        <strong className="admin-prs-weight">{formatWeight(row.bestWeight, locale)}</strong>
        <small>{row.bestRecord ? getAthleteName(row.bestRecord) : "—"}</small>
      </td>
      <td data-label={copy.previousMark}>
        <strong>{formatWeight(row.previousWeight, locale)}</strong>
        <small>{row.previousRecord ? getAthleteName(row.previousRecord) : "—"}</small>
      </td>
      <td data-label={copy.improvement}>
        {Number(row.improvement) > 0 ? (
          <span className="admin-prs-improvement">+{formatWeight(row.improvement, locale)} · +{row.improvementPercent}%</span>
        ) : (
          <span className="admin-prs-muted">—</span>
        )}
      </td>
      <td data-label={copy.records}><span className="admin-prs-count-pill">{row.historyCount}</span></td>
      <td data-label={copy.actions}>
        <div className="admin-prs-row-actions">
          <button type="button" onClick={(event) => { event.stopPropagation(); onEdit() }} aria-label={`${copy.edit} ${row.nombre}`}>✎</button>
          <button type="button" className="is-danger" onClick={(event) => { event.stopPropagation(); onDelete() }} aria-label={`${copy.delete} ${row.nombre}`}>🗑</button>
        </div>
      </td>
    </tr>
  )
}

function RankingRow({ copy, locale, record, position, onOpenHistory }) {
  const athlete = getAthleteFromRecord(record)
  const name = getAthleteName(record)

  return (
    <tr>
      <td data-label={copy.position}><span className={`admin-prs-position position-${Math.min(position, 4)}`}>#{position}</span></td>
      <td data-label={copy.athlete}>
        <div className="admin-prs-athlete-cell">
          <span className="admin-prs-athlete-avatar">
            {athlete?.foto_url ? <img src={athlete.foto_url} alt={name} /> : String(name).slice(0, 2).toUpperCase()}
          </span>
          <span><strong>{name}</strong><small>{athlete?.email || "PHO3NIX"}</small></span>
        </div>
      </td>
      <td data-label={copy.weight}><strong className="admin-prs-weight">{formatWeight(record.peso_libras, locale)}</strong></td>
      <td data-label={copy.date}>{formatDate(record.fecha, locale)}</td>
      <td data-label={copy.history}><button type="button" className="admin-prs-history-button" onClick={onOpenHistory}>{copy.history}</button></td>
    </tr>
  )
}

function EmptyState({ text }) {
  return <div className="admin-prs-empty">{text}</div>
}
