import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useAuth } from "../../auth/context/AuthContext.jsx"
import { useI18n } from "../../../i18n/I18nProvider.jsx"

import AdminDashboardSidebar from "../dashboard/components/AdminDashboardSidebar.jsx"
import AdminMobileNav from "../dashboard/components/AdminMobileNav.jsx"
import { getAdminDashboardCopy } from "../dashboard/i18n/adminDashboardCopy.js"

import {
  DeleteWodModal,
  OperationFeedbackPopup,
  ScheduleWodModal,
  WodDetailsModal,
  WodEditorModal,
} from "../wods/components/AdminWodModals.jsx"
import AdminWodsDirectory from "../wods/components/AdminWodsDirectory.jsx"
import AdminWodsHeader from "../wods/components/AdminWodsHeader.jsx"
import AdminWodsStats from "../wods/components/AdminWodsStats.jsx"
import { getAdminWodsCopy } from "../wods/i18n/adminWodsCopy.js"
import {
  createWodDraft,
  deleteWodComplete,
  fetchAdminWods,
  fetchCurrentAdminProfile,
  schedulePendingWod,
  updatePendingWod,
} from "../wods/services/adminWodsService.js"
import {
  buildCurrentWeekWods,
  buildWodMonthGroups,
  buildWodStats,
  canEditWod,
  filterWods,
  getPreferredWodMonthKey,
  isPastDate,
} from "../wods/utils/adminWodsUtils.js"

import "../../../styles/adminDashboard.css"
import "../../../styles/adminWods.css"

const EMPTY_STATS = { total: 0, drafts: 0, scheduled: 0, active: 0, historical: 0 }

export default function AdminWodsPage() {
  const navigate = useNavigate()
  const { locale, setLocale } = useI18n()
  const { user, nombre, rol, logout } = useAuth()
  const dashboardCopy = useMemo(() => getAdminDashboardCopy(locale), [locale])
  const copy = useMemo(() => getAdminWodsCopy(locale), [locale])

  const [profile, setProfile] = useState(null)
  const [wods, setWods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedMonthKey, setSelectedMonthKey] = useState("")

  const [editorTarget, setEditorTarget] = useState(undefined)
  const [savingEditor, setSavingEditor] = useState(false)
  const [scheduleTarget, setScheduleTarget] = useState(null)
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [scheduleError, setScheduleError] = useState("")
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [detailsTarget, setDetailsTarget] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const loadProfile = useCallback(async () => {
    try {
      const nextProfile = await fetchCurrentAdminProfile(user, { nombre, rol })
      setProfile(nextProfile)
    } catch (profileError) {
      console.error("ADMIN WODS PROFILE ERROR:", profileError)
      setProfile({ nombre: nombre || user?.email || "PHO3NIX", email: user?.email, role: rol || "admin" })
    }
  }, [nombre, rol, user])

  const loadWods = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      setWods(await fetchAdminWods())
    } catch (loadError) {
      console.error("ADMIN WODS LOAD ERROR:", loadError)
      setError(loadError?.message || copy.loadError)
    } finally {
      setLoading(false)
    }
  }, [copy.loadError])

  useEffect(() => { loadProfile() }, [loadProfile])
  useEffect(() => { loadWods() }, [loadWods])

  const stats = useMemo(
    () => (loading && wods.length === 0 ? EMPTY_STATS : buildWodStats(wods)),
    [loading, wods]
  )
  const filteredWods = useMemo(
    () => filterWods(wods, { search, status: statusFilter }),
    [search, statusFilter, wods]
  )
  const weekWods = useMemo(
    () => buildCurrentWeekWods(filteredWods),
    [filteredWods]
  )
  const monthGroups = useMemo(
    () => buildWodMonthGroups(filteredWods, locale),
    [filteredWods, locale]
  )

  useEffect(() => {
    const preferredMonthKey = getPreferredWodMonthKey(monthGroups)

    setSelectedMonthKey((current) => {
      if (current && monthGroups.some((group) => group.key === current)) return current
      return preferredMonthKey
    })
  }, [monthGroups])

  async function handleLogout() {
    try {
      await logout()
    } catch (logoutError) {
      console.error("ADMIN WODS LOGOUT ERROR:", logoutError)
      window.location.href = "/"
    }
  }

  function openCreate() {
    setEditorTarget(null)
  }

  function openEdit(wod) {
    if (!canEditWod(wod)) {
      setFeedback({ tone: "error", message: copy.pendingOnly })
      return
    }
    setDetailsTarget(null)
    setEditorTarget(wod)
  }

  function openSchedule(wod) {
    if (!canEditWod(wod)) {
      setFeedback({ tone: "error", message: copy.pendingOnly })
      return
    }
    setDetailsTarget(null)
    setScheduleError("")
    setScheduleTarget(wod)
  }

  async function handleSaveEditor(payload) {
    try {
      setSavingEditor(true)
      if (editorTarget?.id) {
        await updatePendingWod(editorTarget.id, payload)
        setFeedback({ tone: "success", message: copy.updatedSuccess })
      } else {
        await createWodDraft(payload)
        setFeedback({ tone: "success", message: copy.createdSuccess })
      }
      setEditorTarget(undefined)
      await loadWods()
    } catch (operationError) {
      console.error("ADMIN WODS SAVE ERROR:", operationError)
      setFeedback({ tone: "error", message: mapOperationError(operationError, copy) })
    } finally {
      setSavingEditor(false)
    }
  }

  async function handleSchedule(date) {
    if (!scheduleTarget?.id) return

    if (isPastDate(date)) {
      setScheduleError(copy.pastDate)
      return
    }

    try {
      setSavingSchedule(true)
      setScheduleError("")
      await schedulePendingWod(scheduleTarget.id, date)
      setScheduleTarget(null)
      await loadWods()
      setFeedback({ tone: "success", message: copy.scheduledSuccess })
    } catch (operationError) {
      console.error("ADMIN WODS SCHEDULE ERROR:", operationError)
      setScheduleError(mapOperationError(operationError, copy))
    } finally {
      setSavingSchedule(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget?.id) return

    try {
      setDeleting(true)
      await deleteWodComplete(deleteTarget.id)
      setDeleteTarget(null)
      setDetailsTarget(null)
      await loadWods()
      setFeedback({ tone: "success", message: copy.deletedSuccess })
    } catch (operationError) {
      console.error("ADMIN WODS DELETE ERROR:", operationError)
      setFeedback({ tone: "error", message: operationError?.message || copy.operationError })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="admin-dashboard-screen admin-wods-screen">
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
        <AdminWodsHeader
          dashboardCopy={dashboardCopy}
          copy={copy}
          locale={locale}
          setLocale={setLocale}
          profile={profile}
          loading={loading}
          onLogout={handleLogout}
        />

        <main className="admin-dashboard-content admin-wods-content">
          {error ? (
            <section className="admin-dashboard-error" role="alert">
              <div><strong>{copy.loadError}</strong><p>{error}</p></div>
              <button type="button" onClick={loadWods}>{copy.retry}</button>
            </section>
          ) : null}

          <AdminWodsStats copy={copy} stats={stats} loading={loading} />

          <AdminWodsDirectory
            copy={copy}
            locale={locale}
            weekRows={weekWods}
            monthGroups={monthGroups}
            selectedMonthKey={selectedMonthKey}
            stats={stats}
            loading={loading}
            search={search}
            statusFilter={statusFilter}
            onSearch={setSearch}
            onStatusFilter={setStatusFilter}
            onMonthChange={setSelectedMonthKey}
            onCreate={openCreate}
            onView={setDetailsTarget}
            onEdit={openEdit}
            onSchedule={openSchedule}
            onDelete={setDeleteTarget}
          />
        </main>
      </div>

      <AdminMobileNav copy={dashboardCopy} navigate={navigate} />

      {editorTarget !== undefined ? (
        <WodEditorModal
          copy={copy}
          locale={locale}
          wod={editorTarget}
          saving={savingEditor}
          onClose={() => !savingEditor && setEditorTarget(undefined)}
          onSave={handleSaveEditor}
        />
      ) : null}

      {scheduleTarget ? (
        <ScheduleWodModal
          copy={copy}
          locale={locale}
          wod={scheduleTarget}
          saving={savingSchedule}
          error={scheduleError}
          onClose={() => !savingSchedule && setScheduleTarget(null)}
          onSchedule={handleSchedule}
        />
      ) : null}

      {deleteTarget ? (
        <DeleteWodModal
          copy={copy}
          locale={locale}
          wod={deleteTarget}
          saving={deleting}
          onClose={() => !deleting && setDeleteTarget(null)}
          onDelete={handleDelete}
        />
      ) : null}

      {detailsTarget ? (
        <WodDetailsModal
          copy={copy}
          locale={locale}
          wod={detailsTarget}
          onClose={() => setDetailsTarget(null)}
          onEdit={() => openEdit(detailsTarget)}
          onSchedule={() => openSchedule(detailsTarget)}
          onDelete={() => {
            setDeleteTarget(detailsTarget)
            setDetailsTarget(null)
          }}
        />
      ) : null}

      {feedback ? (
        <OperationFeedbackPopup copy={copy} feedback={feedback} onClose={() => setFeedback(null)} />
      ) : null}
    </div>
  )
}

function mapOperationError(error, copy) {
  const message = String(error?.message || "")
  if (message.includes("DUPLICATE_WOD_DATE")) return copy.duplicateDate
  if (message.includes("PAST_WOD_DATE")) return copy.pastDate
  if (message.includes("PENDING_WOD_REQUIRED")) return copy.pendingOnly
  return error?.message || copy.operationError
}
