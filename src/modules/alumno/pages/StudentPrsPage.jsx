import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { supabase } from "../../../config/supabase.js"
import { useAuth } from "../../auth/context/AuthContext.jsx"
import { useI18n } from "../../../i18n/I18nProvider.jsx"

import StudentSidebar from "../dashboard/components/StudentSidebar.jsx"
import StudentMobileNav from "../dashboard/components/StudentMobileNav.jsx"
import StudentDashboardHeader from "../dashboard/components/StudentDashboardHeader.jsx"

import StudentPrsBestMarks from "../prs/components/StudentPrsBestMarks.jsx"
import StudentPrsEvolution from "../prs/components/StudentPrsEvolution.jsx"
import StudentPrsFeedbackPopup from "../prs/components/StudentPrsFeedbackPopup.jsx"
import StudentPrsHeading from "../prs/components/StudentPrsHeading.jsx"
import StudentPrsHistory from "../prs/components/StudentPrsHistory.jsx"
import StudentPrsLoading from "../prs/components/StudentPrsLoading.jsx"
import StudentPrsModal from "../prs/components/StudentPrsModal.jsx"
import StudentPrsSummary from "../prs/components/StudentPrsSummary.jsx"
import StudentPrsTips from "../prs/components/StudentPrsTips.jsx"
import { getStudentPrsCopy } from "../prs/i18n/studentPrsCopy.js"

import {
  deleteStudentPr,
  fetchStudentPrsBundle,
  saveStudentPr,
  updateStudentPr,
} from "../prs/services/studentPrsService.js"

import {
  buildPrSummary,
  getEvolutionRows,
  getInitials,
  getMembershipStatus,
  hasPrForExerciseAndDate,
  hydratePrRows,
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

export default function StudentPrsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { locale } = useI18n()
  const copy = useMemo(() => getStudentPrsCopy(locale), [locale])

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

  if (loading) return <StudentPrsLoading copy={copy} />

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

        <StudentPrsHeading copy={copy} />

        <StudentPrsSummary
          copy={copy}
          summary={summary}
          onAdd={() => setModalState({ open: true, item: null })}
        />

        <section className="student-prs-grid">
          <div className="student-prs-main-column">
            <StudentPrsEvolution
              copy={copy}
              rows={evolutionRows}
              exercises={data.exercises}
              selectedExerciseId={selectedExerciseId}
              selectedExerciseName={selectedExercise?.nombre}
              onSelectExercise={setSelectedExerciseId}
            />

            <StudentPrsHistory
              copy={copy}
              rows={historyRows}
              totalRecords={summary.allRecords.length}
              page={safeHistoryPage}
              totalPages={totalHistoryPages}
              deletingId={deletingId}
              onEdit={(row) => setModalState({ open: true, item: row })}
              onDelete={handleDeletePr}
              onPageChange={setHistoryPage}
            />
          </div>

          <aside className="student-prs-side-column">
            <StudentPrsBestMarks
              copy={copy}
              rows={summary.bestByExercise}
              onSelectExercise={setSelectedExerciseId}
            />

            <StudentPrsTips copy={copy} />
          </aside>
        </section>
      </section>

      <StudentMobileNav copy={copy} navigate={navigate} />

      <StudentPrsFeedbackPopup
        open={Boolean(success)}
        message={success}
        onClose={() => setSuccess("")}
      />

      {modalState.open ? (
        <StudentPrsModal
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
