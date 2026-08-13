import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useAuth } from "../../auth/context/AuthContext.jsx"
import { useI18n } from "../../../i18n/I18nProvider.jsx"

import AdminDashboardSidebar from "../dashboard/components/AdminDashboardSidebar.jsx"
import AdminMobileNav from "../dashboard/components/AdminMobileNav.jsx"
import { getAdminDashboardCopy } from "../dashboard/i18n/adminDashboardCopy.js"

import AdminPrsDirectory from "../prs/components/AdminPrsDirectory.jsx"
import AdminPrsHeader from "../prs/components/AdminPrsHeader.jsx"
import AdminPrsStats from "../prs/components/AdminPrsStats.jsx"
import {
  DeleteExerciseModal,
  ExerciseModal,
  OperationFeedbackPopup,
  PrHistoryModal,
} from "../prs/components/AdminPrModals.jsx"
import { getAdminPrsCopy } from "../prs/i18n/adminPrsCopy.js"
import {
  createExercise,
  deleteExerciseComplete,
  fetchAdminPrData,
  fetchCurrentAdminProfile,
  updateExercise,
} from "../prs/services/adminPrsService.js"
import {
  buildExerciseRows,
  buildHistory,
  buildPrStats,
  buildRanking,
  filterExerciseRows,
  getAthleteId,
} from "../prs/utils/adminPrsUtils.js"

import "../../../styles/adminDashboard.css"
import "../../../styles/adminPrs.css"

const EMPTY_STATS = { total: 0, thisMonth: 0, exercisesWithPr: 0, athletesWithPr: 0 }

export default function AdminPrsPage() {
  const navigate = useNavigate()
  const { locale, setLocale } = useI18n()
  const { user, nombre, rol, logout } = useAuth()
  const dashboardCopy = useMemo(() => getAdminDashboardCopy(locale), [locale])
  const copy = useMemo(() => getAdminPrsCopy(locale), [locale])

  const [profile, setProfile] = useState(null)
  const [data, setData] = useState({ exercises: [], athletes: [], records: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [selectedExerciseId, setSelectedExerciseId] = useState("")
  const [genderFilter, setGenderFilter] = useState("all")

  const [exerciseEditor, setExerciseEditor] = useState(undefined)
  const [savingExercise, setSavingExercise] = useState(false)
  const [deleteExerciseTarget, setDeleteExerciseTarget] = useState(null)
  const [deletingExercise, setDeletingExercise] = useState(false)
  const [historyTarget, setHistoryTarget] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const loadProfile = useCallback(async () => {
    try {
      setProfile(await fetchCurrentAdminProfile(user, { nombre, rol }))
    } catch (profileError) {
      console.error("ADMIN PRS PROFILE ERROR:", profileError)
      setProfile({ nombre: nombre || user?.email || "PHO3NIX", email: user?.email, role: rol || "admin" })
    }
  }, [nombre, rol, user])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const nextData = await fetchAdminPrData()
      setData(nextData)
      setSelectedExerciseId((current) => {
        if (current && nextData.exercises.some((exercise) => String(exercise.id) === String(current))) return current
        return nextData.exercises[0]?.id || ""
      })
    } catch (loadError) {
      console.error("ADMIN PRS LOAD ERROR:", loadError)
      setError(loadError?.message || copy.loadError)
    } finally {
      setLoading(false)
    }
  }, [copy.loadError])

  useEffect(() => { loadProfile() }, [loadProfile])
  useEffect(() => { loadData() }, [loadData])

  const exerciseRows = useMemo(
    () => buildExerciseRows(data.exercises, data.records),
    [data.exercises, data.records]
  )
  const filteredRows = useMemo(
    () => filterExerciseRows(exerciseRows, search),
    [exerciseRows, search]
  )
  const stats = useMemo(
    () => (loading && data.records.length === 0 ? EMPTY_STATS : buildPrStats(data.records, exerciseRows)),
    [data.records, exerciseRows, loading]
  )
  const ranking = useMemo(
    () => buildRanking(data.records, selectedExerciseId, genderFilter),
    [data.records, genderFilter, selectedExerciseId]
  )
  const historyRows = useMemo(() => {
    if (!historyTarget) return []
    return buildHistory(data.records, getAthleteId(historyTarget), historyTarget.ejercicio_id)
  }, [data.records, historyTarget])

  async function handleLogout() {
    try {
      await logout()
    } catch (logoutError) {
      console.error("ADMIN PRS LOGOUT ERROR:", logoutError)
      window.location.href = "/"
    }
  }

  async function handleSaveExercise(name) {
    const normalized = name.trim().toLowerCase()
    const duplicated = data.exercises.some((exercise) => {
      const sameName = String(exercise.nombre || "").trim().toLowerCase() === normalized
      const differentId = String(exercise.id) !== String(exerciseEditor?.id || "")
      return sameName && differentId
    })

    if (duplicated) {
      setFeedback({ tone: "error", message: copy.duplicateExercise })
      return
    }

    try {
      setSavingExercise(true)
      const saved = exerciseEditor?.id
        ? await updateExercise(exerciseEditor.id, name)
        : await createExercise(name)

      const wasEditing = Boolean(exerciseEditor?.id)
      setExerciseEditor(undefined)
      await loadData()
      if (saved?.id) setSelectedExerciseId(saved.id)
      setFeedback({
        tone: "success",
        message: wasEditing ? copy.exerciseUpdatedSuccess : copy.exerciseCreatedSuccess,
      })
    } catch (operationError) {
      console.error("ADMIN PRS EXERCISE SAVE ERROR:", operationError)
      setFeedback({ tone: "error", message: operationError?.message || copy.operationError })
    } finally {
      setSavingExercise(false)
    }
  }

  async function handleDeleteExercise() {
    if (!deleteExerciseTarget?.id) return

    try {
      setDeletingExercise(true)
      await deleteExerciseComplete(deleteExerciseTarget.id)
      setDeleteExerciseTarget(null)
      await loadData()
      setFeedback({ tone: "success", message: copy.exerciseDeletedSuccess })
    } catch (operationError) {
      console.error("ADMIN PRS EXERCISE DELETE ERROR:", operationError)
      setFeedback({ tone: "error", message: operationError?.message || copy.operationError })
    } finally {
      setDeletingExercise(false)
    }
  }

  return (
    <div className="admin-dashboard-screen admin-prs-screen">
      <div className="admin-dashboard-orb admin-dashboard-orb-a" aria-hidden="true" />
      <div className="admin-dashboard-orb admin-dashboard-orb-b" aria-hidden="true" />

      <AdminDashboardSidebar
        copy={dashboardCopy}
        profile={profile}
        locale={locale}
        setLocale={setLocale}
        navigate={navigate}
        onLogout={handleLogout}
      />

      <div className="admin-dashboard-main">
        <AdminPrsHeader
          dashboardCopy={dashboardCopy}
          copy={copy}
          locale={locale}
          setLocale={setLocale}
          profile={profile}
          loading={!profile}
          onLogout={handleLogout}
        />

        <main className="admin-dashboard-content admin-prs-content">
          {error ? (
            <section className="admin-dashboard-error" role="alert">
              <div><strong>{copy.loadError}</strong><p>{error}</p></div>
              <button type="button" onClick={loadData}>{copy.retry}</button>
            </section>
          ) : null}

          <AdminPrsStats copy={copy} stats={stats} loading={loading} />

          <AdminPrsDirectory
            copy={copy}
            locale={locale}
            loading={loading}
            rows={filteredRows}
            search={search}
            selectedExerciseId={selectedExerciseId}
            ranking={ranking}
            genderFilter={genderFilter}
            onSearch={setSearch}
            onSelectExercise={setSelectedExerciseId}
            onGenderFilter={setGenderFilter}
            onCreateExercise={() => setExerciseEditor(null)}
            onEditExercise={setExerciseEditor}
            onDeleteExercise={setDeleteExerciseTarget}
            onOpenHistory={setHistoryTarget}
          />
        </main>
      </div>

      <AdminMobileNav copy={dashboardCopy} navigate={navigate} />

      {exerciseEditor !== undefined ? (
        <ExerciseModal
          copy={copy}
          exercise={exerciseEditor}
          saving={savingExercise}
          onClose={() => !savingExercise && setExerciseEditor(undefined)}
          onSave={handleSaveExercise}
        />
      ) : null}

      {deleteExerciseTarget ? (
        <DeleteExerciseModal
          copy={copy}
          locale={locale}
          exercise={deleteExerciseTarget}
          saving={deletingExercise}
          onClose={() => !deletingExercise && setDeleteExerciseTarget(null)}
          onDelete={handleDeleteExercise}
        />
      ) : null}

      {historyTarget ? (
        <PrHistoryModal
          copy={copy}
          locale={locale}
          record={historyTarget}
          rows={historyRows}
          onClose={() => setHistoryTarget(null)}
        />
      ) : null}

      {feedback ? (
        <OperationFeedbackPopup feedback={feedback} onClose={() => setFeedback(null)} />
      ) : null}
    </div>
  )
}
