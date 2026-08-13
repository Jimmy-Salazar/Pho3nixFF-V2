import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { supabase } from "../../../config/supabase.js"
import { useAuth } from "../../auth/context/AuthContext.jsx"
import { useI18n } from "../../../i18n/I18nProvider.jsx"

import StudentSidebar from "../dashboard/components/StudentSidebar.jsx"
import StudentMobileNav from "../dashboard/components/StudentMobileNav.jsx"
import StudentDashboardHeader from "../dashboard/components/StudentDashboardHeader.jsx"

import {
  deleteStudentPr,
  fetchStudentPrsBundle,
  saveStudentPr,
  updateStudentPr,
} from "../prs/services/studentPrsService.js"

import {
  buildPrSummary,
  formatDateCompact,
  formatLb,
  getEvolutionRows,
  getInitials,
  getMembershipStatus,
  hasPrForExerciseAndDate,
  hydratePrRows,
  todayISO,
} from "../prs/utils/studentPrsUtils.js"

import "../../../styles/studentPrs.css"

const DEFAULT_DATA = {
  profile: null,
  membership: null,
  exercises: [],
  personalRows: [],
  globalRows: [],
  users: [],
}

const HISTORY_PAGE_SIZE = 6

const COPY = {
  es: {
    home: "Inicio",
    wods: "WODs",
    records: "Mis PR",
    progress: "Progreso",
    profile: "Perfil",
    membership: "Mensualidad",
    logout: "Salir",
    loadingPrs: "Cargando PRs...",
    loadError: "No se pudo cargar PRs.",
    personalRecords: "Personal Records",
    noPrRegistered: "Sin PR registrado",
    firstPrHint: "Registra tu primera marca personal.",
    registerNewPr: "Registrar nuevo PR",
    athlete: "Atleta PHO3NIX",
    registeredPrs: "PR registrados",
    totalPersonalMarks: "Total de marcas personales",
    latestPr: "Último PR",
    noPr: "Sin PR",
    bestOverallPr: "Mejor PR general",
    strongExercise: "Ejercicio fuerte",
    evolution: "Evolución",
    selectExercise: "Selecciona un ejercicio",
    noMarksForExercise: "Todavía no tienes marcas para este ejercicio.",
    prHistory: "Historial de PR",
    latestRecords: "Últimos registros",
    noPrRecords: "Todavía no tienes registros de PR.",
    page: "Página",
    bestMarks: "Mejores marcas",
    topByMovement: "Top por movimiento",
    registerFirstMarks: "Registra tus primeras marcas.",
    tipsTitle: "Tips PHO3NIX",
    tipsMain: "Sé Fénix. Renace más fuerte cada día.",
    tipTechnique: "Técnica primero, peso después.",
    tipRegister: "Registra tus PR y celebra cada avance.",
    tipProgress: "Progresión constante, no ego.",
    editPr: "Editar PR",
    savePr: "Guardar PR",
    saving: "Guardando...",
    cancel: "Cancelar",
    exercise: "Ejercicio",
    weightLb: "Peso en libras",
    date: "Fecha",
    xAxisDates: "Fechas de PR",
    yAxisWeight: "Peso en LBS",
    validExercise: "Selecciona un ejercicio.",
    validWeight: "Ingresa un peso válido en libras.",
    validDate: "Selecciona la fecha del PR.",
    duplicated: "Ya tienes un PR registrado para este ejercicio en esa fecha.",
    saveError: "No se pudo guardar el PR.",
    saveSuccess: "PR registrado correctamente.",
    updateSuccess: "PR actualizado correctamente.",
    deleteSuccess: "PR eliminado correctamente.",
    deleteError: "No se pudo eliminar el PR.",
    confirmDelete: "¿Eliminar el PR de",
  },
  en: {
    home: "Home",
    wods: "WODs",
    records: "My PRs",
    progress: "Progress",
    profile: "Profile",
    membership: "Membership",
    logout: "Logout",
    loadingPrs: "Loading PRs...",
    loadError: "Could not load PRs.",
    personalRecords: "Personal Records",
    noPrRegistered: "No PR registered",
    firstPrHint: "Register your first personal record.",
    registerNewPr: "Register new PR",
    athlete: "PHO3NIX Athlete",
    registeredPrs: "Registered PRs",
    totalPersonalMarks: "Total personal records",
    latestPr: "Latest PR",
    noPr: "No PR",
    bestOverallPr: "Best overall PR",
    strongExercise: "Strongest exercise",
    evolution: "Evolution",
    selectExercise: "Select an exercise",
    noMarksForExercise: "You do not have marks for this exercise yet.",
    prHistory: "PR History",
    latestRecords: "Latest records",
    noPrRecords: "You do not have PR records yet.",
    page: "Page",
    bestMarks: "Best marks",
    topByMovement: "Top by movement",
    registerFirstMarks: "Register your first marks.",
    tipsTitle: "PHO3NIX Tips",
    tipsMain: "Be Phoenix. Rise stronger every day.",
    tipTechnique: "Technique first, weight later.",
    tipRegister: "Log your PRs and celebrate every improvement.",
    tipProgress: "Consistent progress, no ego.",
    editPr: "Edit PR",
    savePr: "Save PR",
    saving: "Saving...",
    cancel: "Cancel",
    exercise: "Exercise",
    weightLb: "Weight in pounds",
    date: "Date",
    xAxisDates: "PR dates",
    yAxisWeight: "Weight in LBS",
    validExercise: "Select an exercise.",
    validWeight: "Enter a valid weight in pounds.",
    validDate: "Select the PR date.",
    duplicated: "You already have a PR for this exercise on that date.",
    saveError: "Could not save PR.",
    saveSuccess: "PR saved successfully.",
    updateSuccess: "PR updated successfully.",
    deleteSuccess: "PR deleted successfully.",
    deleteError: "Could not delete PR.",
    confirmDelete: "Delete PR for",
  },
}

export default function StudentPrsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { locale } = useI18n()
  const copy = COPY[locale] || COPY.es

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [data, setData] = useState(DEFAULT_DATA)
  const [selectedExerciseId, setSelectedExerciseId] = useState("")
  const [historyPage, setHistoryPage] = useState(1)
  const [modalState, setModalState] = useState({ open: false, item: null })

  const userId = user?.id

  useEffect(() => {
    if (!success) return undefined

    const timeoutId = window.setTimeout(() => {
      setSuccess("")
    }, 2400)

    return () => window.clearTimeout(timeoutId)
  }, [success])

  useEffect(() => {
    let alive = true

    async function loadData() {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError("")
        const payload = await fetchStudentPrsBundle(userId)
        if (!alive) return

        setData(payload)
        setSelectedExerciseId(payload.exercises?.[0]?.id || "")
      } catch (loadError) {
        console.error("Error cargando PRs de atleta:", loadError)
        if (alive) setError(loadError.message || copy.loadError)
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadData()

    return () => {
      alive = false
    }
  }, [userId, copy.loadError])

  const summary = useMemo(() => buildPrSummary(data.personalRows), [data.personalRows])
  const membership = useMemo(() => getMembershipStatus(data.membership), [data.membership])
  const evolutionRows = useMemo(() => {
    const target = selectedExerciseId || summary.latestPr?.ejercicio_id || data.exercises[0]?.id
    return getEvolutionRows(data.personalRows, target)
  }, [data.personalRows, selectedExerciseId, summary.latestPr?.ejercicio_id, data.exercises])

  const selectedExercise = data.exercises.find((item) => String(item.id) === String(selectedExerciseId))
  const profileName = data.profile?.nombre || user?.email || copy.athlete
  const initials = getInitials(profileName)
  const highlighted = summary.bestPr || summary.latestPr || null
  const totalHistoryPages = Math.max(Math.ceil(summary.allRecords.length / HISTORY_PAGE_SIZE), 1)
  const safeHistoryPage = Math.min(historyPage, totalHistoryPages)
  const historyStart = (safeHistoryPage - 1) * HISTORY_PAGE_SIZE
  const historyRows = summary.allRecords.slice(historyStart, historyStart + HISTORY_PAGE_SIZE)

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
    } catch (logoutError) {
      console.error("Error cerrando sesión:", logoutError)
    } finally {
      window.location.replace("/")
    }
  }

  async function handleSavePr(form, currentPr = null) {
    if (!userId) return

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      if (!form.ejercicio_id) throw new Error(copy.validExercise)
      if (!form.peso_libras || Number(form.peso_libras) <= 0) throw new Error(copy.validWeight)
      if (!form.fecha) throw new Error(copy.validDate)

      const duplicated = hasPrForExerciseAndDate(data.personalRows, form.ejercicio_id, form.fecha, currentPr?.id || null)
      if (duplicated) throw new Error(copy.duplicated)

      const saved = currentPr?.id
        ? await updateStudentPr(userId, currentPr.id, form)
        : await saveStudentPr(userId, form)

      setData((current) => {
        const personalRows = currentPr?.id
          ? current.personalRows.map((item) => (String(item.id) === String(saved.id) ? saved : item))
          : [saved, ...current.personalRows]

        const globalRows = currentPr?.id
          ? current.globalRows.map((item) => (String(item.id) === String(saved.id) ? saved : item))
          : [saved, ...current.globalRows]

        return {
          ...current,
          personalRows: hydratePrRows(personalRows, current.exercises, current.users),
          globalRows: hydratePrRows(globalRows, current.exercises, current.users),
        }
      })

      setSelectedExerciseId(form.ejercicio_id)
      setModalState({ open: false, item: null })
      setHistoryPage(1)
      setSuccess(currentPr?.id ? copy.updateSuccess : copy.saveSuccess)
    } catch (saveError) {
      console.error("Error guardando PR:", saveError)
      setError(saveError.message || copy.saveError)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeletePr(row) {
    if (!userId || !row?.id || deletingId) return
    if (!window.confirm(`${copy.confirmDelete} ${row.ejercicio_nombre} (${row.peso_libras} lb)?`)) return

    try {
      setDeletingId(row.id)
      setError("")
      await deleteStudentPr(userId, row.id)

      setData((current) => ({
        ...current,
        personalRows: current.personalRows.filter((item) => String(item.id) !== String(row.id)),
        globalRows: current.globalRows.filter((item) => String(item.id) !== String(row.id)),
      }))

      setSuccess(copy.deleteSuccess)
    } catch (deleteError) {
      console.error("Error eliminando PR:", deleteError)
      setError(deleteError.message || copy.deleteError)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <main className="student-prs-page">
        <div className="student-prs-loading">
          <span>🏆</span>
          <strong>{copy.loadingPrs}</strong>
        </div>
      </main>
    )
  }

  return (
    <main className="student-prs-page">
      <StudentSidebar
        copy={copy}
        membership={membership}
        navigate={navigate}
        onLogout={handleLogout}
      />

      <section className="student-prs-content">
        <StudentDashboardHeader
          profileName={profileName}
          initials={initials}
          photoUrl={data.profile?.foto_url}
          onLogout={handleLogout}
          copy={copy}
        />

        {error ? <div className="student-prs-alert is-error">{error}</div> : null}

        <section className="student-prs-top-heading">
          <p>{copy.personalRecords}</p>
          <h1>{copy.records}</h1>
          <span>{copy.firstPrHint}</span>
        </section>

        <section className="student-prs-summary">
          <Metric icon="🏆" title={copy.registeredPrs} value={summary.total} helper={copy.totalPersonalMarks} />
          <Metric icon="🕒" title={copy.latestPr} value={formatLb(summary.latestPr?.peso_libras)} helper={summary.latestPr?.ejercicio_nombre || copy.noPr} />
          <Metric icon="⭐" title={copy.bestOverallPr} value={formatLb(summary.bestPr?.peso_libras)} helper={summary.bestPr?.ejercicio_nombre || copy.noPr} />
          <Metric icon="💪" title={copy.strongExercise} value={summary.strongest?.ejercicio_nombre || "--"} helper={formatLb(summary.strongest?.peso_libras)} />
          <button
            type="button"
            className="student-prs-add-card"
            onClick={() => setModalState({ open: true, item: null })}
          >
            <span>＋</span>
            <div>
              <small>{copy.personalRecords}</small>
              <strong>{copy.registerNewPr}</strong>
              <p>{copy.firstPrHint}</p>
            </div>
          </button>
        </section>

        <section className="student-prs-grid">
          <div className="student-prs-main-column">
            <article className="student-prs-card">
              <header>
                <div>
                  <p>📈 {copy.evolution}</p>
                  <h2>{selectedExercise?.nombre || copy.selectExercise}</h2>
                </div>
                <select value={selectedExerciseId || ""} onChange={(event) => setSelectedExerciseId(event.target.value)}>
                  {data.exercises.map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>{exercise.nombre}</option>
                  ))}
                </select>
              </header>

              <Evolution rows={evolutionRows} copy={copy} />
            </article>

            <article className="student-prs-card">
              <header>
                <div>
                  <p>🕒 {copy.prHistory}</p>
                  <h2>{copy.latestRecords}</h2>
                </div>
                <span>{summary.allRecords.length}</span>
              </header>

              <div className="student-prs-history">
                {historyRows.length === 0 ? (
                  <div className="student-prs-empty">{copy.noPrRecords}</div>
                ) : (
                  historyRows.map((row) => (
                    <div key={row.id}>
                      <span>
                        <b>{formatDateCompact(row.fecha)}</b>
                        <small>{row.ejercicio_nombre}</small>
                      </span>
                      <strong>{formatLb(row.peso_libras)}</strong>
                      <button type="button" onClick={() => setModalState({ open: true, item: row })}>✎</button>
                      <button type="button" onClick={() => handleDeletePr(row)} disabled={deletingId === row.id}>🗑</button>
                    </div>
                  ))
                )}
              </div>

              <footer className="student-prs-pagination">
                <button type="button" disabled={safeHistoryPage <= 1} onClick={() => setHistoryPage(safeHistoryPage - 1)}>←</button>
                <span>{copy.page} {safeHistoryPage} / {totalHistoryPages}</span>
                <button type="button" disabled={safeHistoryPage >= totalHistoryPages} onClick={() => setHistoryPage(safeHistoryPage + 1)}>→</button>
              </footer>
            </article>
          </div>

          <aside className="student-prs-side-column">
            <article className="student-prs-card">
              <header>
                <div>
                  <p>🏅 {copy.bestMarks}</p>
                  <h2>{copy.topByMovement}</h2>
                </div>
                <span>{summary.bestByExercise.length}</span>
              </header>

              <div className="student-prs-best-list">
                {summary.bestByExercise.length === 0 ? (
                  <div className="student-prs-empty">{copy.registerFirstMarks}</div>
                ) : (
                  summary.bestByExercise.slice(0, 8).map((row) => (
                    <button key={row.id} type="button" onClick={() => setSelectedExerciseId(row.ejercicio_id)}>
                      <span>🏋️</span>
                      <div>
                        <b>{row.ejercicio_nombre}</b>
                        <strong>{formatLb(row.peso_libras)}</strong>
                        <small>{formatDateCompact(row.fecha)}</small>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </article>

            <article className="student-prs-card student-prs-tips">
              <p>🔥 {copy.tipsTitle}</p>
              <h2>{copy.tipsMain}</h2>
              <small>✓ {copy.tipTechnique}</small>
              <small>✓ {copy.tipRegister}</small>
              <small>✓ {copy.tipProgress}</small>
            </article>
          </aside>
        </section>
      </section>

      <StudentMobileNav copy={copy} navigate={navigate} />

      <ActionConfirmationPopup
        open={Boolean(success)}
        message={success}
        onClose={() => setSuccess("")}
      />

      {modalState.open ? (
        <PrModal
          exercises={data.exercises}
          item={modalState.item}
          saving={saving}
          onClose={() => !saving && setModalState({ open: false, item: null })}
          onSave={handleSavePr}
          copy={copy}
        />
      ) : null}
    </main>
  )
}

function ActionConfirmationPopup({ open, message, onClose }) {
  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-live="assertive"
      aria-label={message}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(0, 0, 0, 0.68)",
        backdropFilter: "blur(7px)",
      }}
    >
      <button
        type="button"
        aria-label="Cerrar confirmación"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
          background: "transparent",
          cursor: "default",
        }}
      />

      <section
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(100%, 390px)",
          border: "1px solid rgba(249, 115, 22, 0.38)",
          borderRadius: 28,
          padding: "28px 24px",
          textAlign: "center",
          color: "#fff",
          background:
            "linear-gradient(145deg, rgba(17,17,17,.98), rgba(5,5,5,.98))",
          boxShadow:
            "0 30px 90px rgba(0,0,0,.72), 0 0 42px rgba(249,115,22,.13)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            margin: "0 auto",
            border: "1px solid rgba(249,115,22,.38)",
            borderRadius: "50%",
            color: "#fb923c",
            background: "rgba(249,115,22,.1)",
            fontSize: 32,
            fontWeight: 900,
          }}
        >
          ✓
        </div>

        <p
          style={{
            margin: "20px 0 0",
            color: "#fb923c",
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: "0.22em",
          }}
        >
          PHO3NIX
        </p>

        <h2
          style={{
            margin: "8px 0 0",
            fontSize: "clamp(20px, 5vw, 26px)",
            fontWeight: 900,
            lineHeight: 1.1,
          }}
        >
          {message}
        </h2>

        <p
          style={{
            margin: "10px 0 0",
            color: "rgba(255,255,255,.48)",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          La operación se completó correctamente.
        </p>
      </section>
    </div>
  )
}

function Metric({ icon, title, value, helper }) {
  return (
    <article>
      <span>{icon}</span>
      <div>
        <small>{title}</small>
        <strong>{value}</strong>
        <p>{helper}</p>
      </div>
    </article>
  )
}

function Evolution({ rows = [], copy }) {
  if (rows.length === 0) return <div className="student-prs-empty">{copy.noMarksForExercise}</div>

  const weights = rows.map((row) => Number(row.peso_libras || 0))
  const minWeightRaw = Math.min(...weights)
  const maxWeightRaw = Math.max(...weights)
  const paddingValue = Math.max(Math.round((maxWeightRaw - minWeightRaw) * 0.18), 10)
  const minWeight = Math.max(0, Math.floor((minWeightRaw - paddingValue) / 10) * 10)
  const maxWeight = Math.ceil((maxWeightRaw + paddingValue) / 10) * 10 || 200

  const width = 760
  const height = 310
  const leftPad = 78
  const rightPad = 34
  const topPad = 34
  const bottomPad = 72
  const usableW = width - leftPad - rightPad
  const usableH = height - topPad - bottomPad

  const weightRange = Math.max(maxWeight - minWeight, 1)

  const points = rows.map((row, index) => {
    const x = rows.length <= 1 ? leftPad + usableW / 2 : leftPad + (usableW / (rows.length - 1)) * index
    const y = topPad + usableH - ((Number(row.peso_libras || 0) - minWeight) / weightRange) * usableH

    return { x, y, row }
  })

  const line = points.map((point) => `${point.x},${point.y}`).join(" ")
  const yTicks = [minWeight, Math.round((minWeight + maxWeight) / 2), maxWeight]

  return (
    <div className="student-prs-chart is-xy-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${copy.xAxisDates} / ${copy.yAxisWeight}`}>
        <text className="student-prs-axis-title is-y" x="18" y={height / 2} textAnchor="middle">
          {copy.yAxisWeight}
        </text>

        <text className="student-prs-axis-title is-x" x={leftPad + usableW / 2} y={height - 10} textAnchor="middle">
          {copy.xAxisDates}
        </text>

        <line className="student-prs-axis-line" x1={leftPad} y1={topPad} x2={leftPad} y2={topPad + usableH} />
        <line className="student-prs-axis-line" x1={leftPad} y1={topPad + usableH} x2={leftPad + usableW} y2={topPad + usableH} />

        {yTicks.map((tick) => {
          const y = topPad + usableH - ((tick - minWeight) / weightRange) * usableH

          return (
            <g key={`y-${tick}`}>
              <line className="student-prs-axis-grid is-horizontal" x1={leftPad} y1={y} x2={leftPad + usableW} y2={y} />
              <text className="student-prs-axis-tick is-y" x={leftPad - 12} y={y + 5} textAnchor="end">
                {tick} lb
              </text>
            </g>
          )
        })}

        {points.map((point) => (
          <g key={`x-${point.row.id}`}>
            <line className="student-prs-axis-grid" x1={point.x} y1={topPad} x2={point.x} y2={topPad + usableH} />
            <text
              className="student-prs-axis-tick is-x"
              x={point.x}
              y={topPad + usableH + 25}
              textAnchor="middle"
            >
              {formatDateCompact(point.row.fecha)}
            </text>
          </g>
        ))}

        <polyline points={line} />

        {points.map((point) => (
          <g key={point.row.id}>
            <circle cx={point.x} cy={point.y} r="7" />
            <text className="student-prs-point-label" x={point.x + 10} y={point.y - 10}>
              {formatLb(point.row.peso_libras)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function PrModal({ exercises, item, saving, onClose, onSave, copy }) {
  const [form, setForm] = useState({
    ejercicio_id: item?.ejercicio_id || "",
    peso_libras: item?.peso_libras || "",
    fecha: item?.fecha || todayISO(),
  })

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <section className="student-prs-modal">
      <div onClick={saving ? undefined : onClose} />
      <article>
        <header>
          <h2>{item ? copy.editPr : copy.registerNewPr}</h2>
          <button type="button" onClick={onClose} disabled={saving}>×</button>
        </header>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSave(form, item)
          }}
        >
          <label>
            {copy.exercise}
            <select value={form.ejercicio_id} onChange={(event) => update("ejercicio_id", event.target.value)}>
              <option value="">{copy.selectExercise}</option>
              {exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>{exercise.nombre}</option>
              ))}
            </select>
          </label>

          <label>
            {copy.weightLb}
            <input type="number" min="1" step="0.5" value={form.peso_libras} onChange={(event) => update("peso_libras", event.target.value)} />
          </label>

          <label>
            {copy.date}
            <input type="date" value={form.fecha} onChange={(event) => update("fecha", event.target.value)} />
          </label>

          <footer>
            <button type="button" onClick={onClose} disabled={saving}>{copy.cancel}</button>
            <button type="submit" disabled={saving}>{saving ? copy.saving : copy.savePr}</button>
          </footer>
        </form>
      </article>
    </section>
  )
}