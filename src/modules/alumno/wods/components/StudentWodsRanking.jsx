import { useMemo, useState } from "react"

import {
  formatResultValue,
  getInitials,
} from "../utils/studentWodsUtils.js"

const SEX_FILTERS = [
  { key: "all", es: "Todos", en: "All" },
  { key: "male", es: "Hombres", en: "Men" },
  { key: "female", es: "Mujeres", en: "Women" },
]

export default function StudentWodsRanking({
  copy,
  locale,
  wod,
  rows = [],
  currentUserId,
  onViewAll,
}) {
  const [sexFilter, setSexFilter] = useState("all")

  const rankingRows = useMemo(() => {
    return normalizeRankingRows(rows, wod)
      .filter((item) => matchSex(item, sexFilter))
      .slice(0, 5)
  }, [rows, sexFilter, wod])

  const title = wod?.nombre ? `Ranking - ${wod.nombre}` : "Ranking del WOD"

  return (
    <article className="student-wods-card student-wods-ranking-card">
      <header className="student-wods-panel-header">
        <div>
          <p>🏆 {title}</p>
          <h2>{title}</h2>
        </div>

        <button type="button" onClick={onViewAll}>
          {copy.viewAll}
        </button>
      </header>

      <div className="student-wods-ranking-filters is-gender-only">
        <FilterGroup
          title={locale === "en" ? "Gender" : "Género"}
          options={SEX_FILTERS.map((item) => ({
            key: item.key,
            label: locale === "en" ? item.en : item.es,
          }))}
          value={sexFilter}
          onChange={setSexFilter}
        />
      </div>

      {rankingRows.length === 0 ? (
        <div className="student-wods-empty">
          {copy.noHistory}
        </div>
      ) : (
        <div className="student-wods-ranking-table is-gender-only">
          <div className="student-wods-ranking-head">
            <span>#</span>
            <span>{locale === "en" ? "Athlete" : "Atleta"}</span>
            <span>{locale === "en" ? "Score" : "Marca"}</span>
          </div>

          {rankingRows.map((item, index) => {
            const isMine =
              item.usuario_id === currentUserId ||
              item.usuario === currentUserId ||
              item.user_id === currentUserId

            return (
              <article
                key={item.id || `${item.name}-${index}`}
                className={isMine ? "is-mine" : ""}
              >
                <b>{index + 1}</b>

                <div className="student-wods-ranking-athlete">
                  <span>
                    {item.photoUrl ? <img src={item.photoUrl} alt="" /> : getInitials(item.name)}
                  </span>

                  <div>
                    <strong>
                      {item.name}
                      {isMine ? " (Tú)" : ""}
                    </strong>
                    <small>Atleta PHO3NIX</small>
                  </div>
                </div>

                <strong className="student-wods-ranking-score">
                  {formatResultValue(item)}
                </strong>
              </article>
            )
          })}
        </div>
      )}

      <footer>
        {locale === "en" ? "Ranking updates with registered results." : "Ranking actualizado con resultados registrados."}
      </footer>
    </article>
  )
}

function FilterGroup({ title, options, value, onChange }) {
  return (
    <div className="student-wods-filter-group">
      <small>{title}</small>

      <div>
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            className={option.key === value ? "is-active" : ""}
            onClick={() => onChange(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function normalizeRankingRows(rows, wod) {
  const mode = String(wod?.modo_ranking || "").toLowerCase()
  const safeRows = Array.isArray(rows) ? rows : []

  const filtered = safeRows.filter((item) => {
    return (
      Number(item?.tiempo_segundos || 0) > 0 ||
      Number(item?.repeticiones || 0) > 0 ||
      String(item?.tiempo_texto || "").trim().length > 0
    )
  })

  const sorted = [...filtered].sort((a, b) => {
    if (mode === "menor_es_mejor") {
      const aTime = Number(a.tiempo_segundos || Number.MAX_SAFE_INTEGER)
      const bTime = Number(b.tiempo_segundos || Number.MAX_SAFE_INTEGER)
      if (aTime !== bTime) return aTime - bTime
      return Number(b.repeticiones || 0) - Number(a.repeticiones || 0)
    }

    if (mode === "mayor_es_mejor") {
      const aReps = Number(a.repeticiones || 0)
      const bReps = Number(b.repeticiones || 0)
      if (aReps !== bReps) return bReps - aReps
      return Number(a.tiempo_segundos || Number.MAX_SAFE_INTEGER) - Number(b.tiempo_segundos || Number.MAX_SAFE_INTEGER)
    }

    return new Date(a.created_at || 0) - new Date(b.created_at || 0)
  })

  return sorted.map((item) => ({
    ...item,
    name: item.nombre || item.usuario_nombre || item.usuarios?.nombre || "Atleta PHO3NIX",
    photoUrl: item.foto_url || item.usuarios?.foto_url || null,
    sexKey: normalizeSex(item.sexo || item.usuarios?.sexo || item.genero || item.gender),
  }))
}

function normalizeSex(value) {
  const text = String(value || "").trim().toLowerCase()
  if (["m", "masculino", "hombre", "male", "man"].includes(text)) return "male"
  if (["f", "femenino", "mujer", "female", "woman"].includes(text)) return "female"
  return "unknown"
}

function matchSex(item, filter) {
  if (filter === "all") return true
  return item.sexKey === filter
}
