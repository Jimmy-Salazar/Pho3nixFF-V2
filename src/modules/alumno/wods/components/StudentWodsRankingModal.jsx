import { useEffect, useMemo, useState } from "react"

import { fetchWodRanking } from "../services/studentWodsService.js"
import {
  formatModoRanking,
  formatResultValue,
  getInitials,
} from "../utils/studentWodsUtils.js"

const SEX_FILTERS = [
  { key: "all", es: "Todos", en: "All" },
  { key: "male", es: "Hombres", en: "Men" },
  { key: "female", es: "Mujeres", en: "Women" },
]

const ROWS_PER_PAGE = 8

export default function StudentWodsRankingModal({
  copy,
  locale,
  wod,
  currentUserId,
  seedRows = [],
  onClose,
}) {
  const [loading, setLoading] = useState(Boolean(wod?.id))
  const [error, setError] = useState("")
  const [rows, setRows] = useState(seedRows)
  const [sexFilter, setSexFilter] = useState("all")
  const [page, setPage] = useState(1)

  useEffect(() => {
    let alive = true

    async function loadRanking() {
      if (!wod?.id) {
        setRows(seedRows)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError("")
        const payload = await fetchWodRanking(wod.id)

        if (alive) {
          setRows(payload.length > 0 ? payload : seedRows)
        }
      } catch (rankingError) {
        console.error("Error cargando ranking del WOD:", rankingError)
        if (alive) {
          setError(locale === "en" ? "Could not load ranking." : "No se pudo cargar el ranking.")
          setRows(seedRows)
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadRanking()

    return () => {
      alive = false
    }
  }, [wod?.id])

  const rankingRows = useMemo(() => {
    return normalizeRankingRows(rows, wod)
      .filter((item) => matchSex(item, sexFilter))
  }, [rows, sexFilter, wod])

  const totalPages = Math.max(Math.ceil(rankingRows.length / ROWS_PER_PAGE), 1)
  const safePage = Math.min(page, totalPages)
  const startIndex = (safePage - 1) * ROWS_PER_PAGE
  const paginatedRows = rankingRows.slice(startIndex, startIndex + ROWS_PER_PAGE)

  useEffect(() => {
    setPage(1)
  }, [sexFilter, wod?.id])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  return (
    <section className="student-wods-ranking-modal-shell" role="dialog" aria-modal="true">
      <div className="student-wods-ranking-modal-backdrop" onClick={onClose} />

      <article className="student-wods-ranking-modal-card">
        <header className="student-wods-ranking-modal-header">
          <div>
            <p>🏆 Ranking</p>
            <h2>{wod?.nombre || "WOD"}</h2>
            <small>{formatModoRanking(wod?.modo_ranking, copy)}</small>
          </div>

          <button type="button" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>

        <div className="student-wods-ranking-filters is-modal is-gender-only">
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

        {error ? <div className="student-wods-error">{error}</div> : null}

        {loading ? (
          <div className="student-wods-ranking-modal-empty">
            {locale === "en" ? "Loading ranking..." : "Cargando ranking..."}
          </div>
        ) : rankingRows.length === 0 ? (
          <div className="student-wods-ranking-modal-empty">
            {copy.noHistory}
          </div>
        ) : (
          <>
            <div className="student-wods-ranking-modal-list is-gender-only">
              <div className="student-wods-ranking-head is-modal">
                <span>#</span>
                <span>{locale === "en" ? "Athlete" : "Atleta"}</span>
                <span>{locale === "en" ? "Score" : "Marca"}</span>
              </div>

              {paginatedRows.map((item, index) => {
                const position = startIndex + index + 1
                const isMine =
                  item.usuario_id === currentUserId ||
                  item.usuario === currentUserId ||
                  item.user_id === currentUserId

                return (
                  <article key={item.id || `${item.name}-${position}`} className={isMine ? "is-mine" : ""}>
                    <b>{position}</b>

                    <div className="student-wods-ranking-athlete">
                      <span>
                        {item.photoUrl ? <img src={item.photoUrl} alt="" /> : getInitials(item.name)}
                      </span>

                      <div>
                        <strong>{item.name}{isMine ? " (Tú)" : ""}</strong>
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

            <footer className="student-wods-ranking-pagination">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                disabled={safePage <= 1}
              >
                ← {locale === "en" ? "Previous" : "Anterior"}
              </button>

              <span>
                {locale === "en" ? "Page" : "Página"} {safePage} / {totalPages}
                <small>{rankingRows.length} atleta(s)</small>
              </span>

              <button
                type="button"
                onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                disabled={safePage >= totalPages}
              >
                {locale === "en" ? "Next" : "Siguiente"} →
              </button>
            </footer>
          </>
        )}
      </article>
    </section>
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
