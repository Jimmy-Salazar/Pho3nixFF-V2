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
  DeletePrModal,
  EditPrModal,
  ExerciseModal,
  OperationFeedbackPopup,
  PrHistoryModal,
  RegisterPrModal,
} from "../prs/components/AdminPrModals.jsx"
import { getAdminPrsCopy } from "../prs/i18n/adminPrsCopy.js"
import {
  createExercise,
  createPrRecord,
  deleteExerciseComplete,
  deletePrRecord,
  fetchAdminPrData,
  fetchCurrentAdminProfile,
  updateExercise,
  updatePrRecord,
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

  const [registerPrOpen, setRegisterPrOpen] = useState(false)
  const [savingPr, setSavingPr] = useState(false)
  const [editPrTarget, setEditPrTarget] = useState(null)
  const [savingPrEdit, setSavingPrEdit] = useState(false)
  const [deletePrTarget, setDeletePrTarget] = useState(null)
  const [deletingPr, setDeletingPr] = useState(false)
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

  async function handleSavePr({ athleteId, exerciseId, weightLb, date }) {
    const duplicated = data.records.some(
      (record) =>
        String(record?.usuario) === String(athleteId) &&
        String(record?.ejercicio_id) === String(exerciseId) &&
        String(record?.fecha || "").slice(0, 10) === String(date || "").slice(0, 10)
    )

    if (duplicated) {
      setFeedback({ tone: "error", message: copy.duplicatePrDate })
      return
    }

    if (!user?.id) {
      setFeedback({ tone: "error", message: copy.operationError })
      return
    }

    try {
      setSavingPr(true)
      await createPrRecord({
        athleteId,
        exerciseId,
        weightLb,
        date,
        registeredBy: user.id,
      })

      setRegisterPrOpen(false)
      await loadData()
      setSelectedExerciseId(exerciseId)
      setFeedback({ tone: "success", message: copy.createdSuccess })
    } catch (operationError) {
      console.error("ADMIN PRS CREATE ERROR:", operationError)
      const duplicateFromDatabase =
        operationError?.code === "23505" ||
        String(operationError?.message || "").includes("rm_usuario_ejercicio_fecha_unique")

      setFeedback({
        tone: "error",
        message: duplicateFromDatabase
          ? copy.duplicatePrDate
          : operationError?.message || copy.operationError,
      })
    } finally {
      setSavingPr(false)
    }
  }

  async function handleUpdatePr({ exerciseId, weightLb, date }) {
    if (!editPrTarget?.id) return

    const athleteId = getAthleteId(editPrTarget)
    const duplicated = data.records.some(
      (record) =>
        String(record?.id) !== String(editPrTarget.id) &&
        String(getAthleteId(record)) === String(athleteId) &&
        String(record?.ejercicio_id) === String(exerciseId) &&
        String(record?.fecha || "").slice(0, 10) === String(date || "").slice(0, 10)
    )

    if (duplicated) {
      setFeedback({ tone: "error", message: copy.duplicatePrDate })
      return
    }

    try {
      setSavingPrEdit(true)
      await updatePrRecord({
        prId: editPrTarget.id,
        exerciseId,
        weightLb,
        date,
      })

      setEditPrTarget(null)
      await loadData()
      setSelectedExerciseId(exerciseId)
      setFeedback({ tone: "success", message: copy.prUpdatedSuccess })
    } catch (operationError) {
      console.error("ADMIN PRS UPDATE ERROR:", operationError)

      const duplicateFromDatabase =
        operationError?.code === "23505" ||
        String(operationError?.message || "").includes("rm_usuario_ejercicio_fecha_unique")

      setFeedback({
        tone: "error",
        message: duplicateFromDatabase
          ? copy.duplicatePrDate
          : operationError?.message || copy.operationError,
      })
    } finally {
      setSavingPrEdit(false)
    }
  }

  async function handleDeletePr() {
    if (!deletePrTarget?.id) return

    try {
      setDeletingPr(true)
      await deletePrRecord(deletePrTarget.id)
      setDeletePrTarget(null)
      await loadData()
      setFeedback({ tone: "success", message: copy.prDeletedSuccess })
    } catch (operationError) {
      console.error("ADMIN PRS DELETE ERROR:", operationError)
      setFeedback({ tone: "error", message: operationError?.message || copy.operationError })
    } finally {
      setDeletingPr(false)
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
            onCreatePr={() => setRegisterPrOpen(true)}
            onCreateExercise={() => setExerciseEditor(null)}
            onEditExercise={setExerciseEditor}
            onDeleteExercise={setDeleteExerciseTarget}
            onOpenHistory={setHistoryTarget}
          />
        </main>
      </div>

      <AdminMobileNav copy={dashboardCopy} navigate={navigate} />

      {registerPrOpen ? (
        <RegisterPrModal
          copy={copy}
          locale={locale}
          athletes={data.athletes}
          exercises={data.exercises}
          selectedExerciseId={selectedExerciseId}
          saving={savingPr}
          onClose={() => !savingPr && setRegisterPrOpen(false)}
          onSave={handleSavePr}
        />
      ) : null}

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
          onEdit={(item) => {
            setHistoryTarget(null)
            setEditPrTarget(item)
          }}
          onDelete={(item) => {
            setHistoryTarget(null)
            setDeletePrTarget(item)
          }}
        />
      ) : null}

      {editPrTarget ? (
        <EditPrModal
          copy={copy}
          record={editPrTarget}
          exercises={data.exercises}
          saving={savingPrEdit}
          onClose={() => !savingPrEdit && setEditPrTarget(null)}
          onSave={handleUpdatePr}
        />
      ) : null}

      {deletePrTarget ? (
        <DeletePrModal
          copy={copy}
          locale={locale}
          record={deletePrTarget}
          saving={deletingPr}
          onClose={() => !deletingPr && setDeletePrTarget(null)}
          onDelete={handleDeletePr}
        />
      ) : null}

      {feedback ? (
        <OperationFeedbackPopup feedback={feedback} onClose={() => setFeedback(null)} />
      ) : null}
    </div>
  )
}
