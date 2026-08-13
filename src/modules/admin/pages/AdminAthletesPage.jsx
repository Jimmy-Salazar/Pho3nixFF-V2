import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useAuth } from "../../auth/context/AuthContext.jsx"
import { useI18n } from "../../../i18n/I18nProvider.jsx"

import AdminDashboardSidebar from "../dashboard/components/AdminDashboardSidebar.jsx"
import AdminMobileNav from "../dashboard/components/AdminMobileNav.jsx"
import AdminAthletesHeader from "../athletes/components/AdminAthletesHeader.jsx"
import { getAdminDashboardCopy } from "../dashboard/i18n/adminDashboardCopy.js"

import {
  CreateAthleteModal,
  DeleteAthleteModal,
  EditAthleteModal,
  MembershipModal,
  OperationConfirmationPopup,
} from "../athletes/components/AdminAthleteModals.jsx"
import AdminAthletesDirectory from "../athletes/components/AdminAthletesDirectory.jsx"
import AdminAthletesStats from "../athletes/components/AdminAthletesStats.jsx"
import { getAdminAthletesCopy } from "../athletes/i18n/adminAthletesCopy.js"
import {
  activateMensualidad,
  createStudent,
  deactivateLatestMensualidad,
  deleteUserComplete,
  fetchCurrentAdminProfile,
  fetchLatestMensualidadesByUserIds,
  fetchUsers,
  updateUserBasic,
} from "../athletes/services/adminAthletesService.js"
import {
  buildAthleteStats,
  enrichUsers,
  filterAthletes,
  formatDate,
  getRoleLabel,
  getStatusLabel,
  searchUsers,
} from "../athletes/utils/adminAthletesUtils.js"

import "../../../styles/adminDashboard.css"
import "../../../styles/adminAthletes.css"

function escapeCsvCell(value) {
  let text = String(value ?? "")

  // Evita que Excel interprete datos del usuario como fórmulas.
  if (/^[=+\-@]/.test(text)) text = `'${text}`

  return `"${text.replace(/"/g, '""')}"`
}

const EMPTY_STATS = {
  registered: 0,
  registeredMen: 0,
  registeredWomen: 0,
  active: 0,
  activeMen: 0,
  activeWomen: 0,
  expiring: 0,
  inactive: 0,
}

export default function AdminAthletesPage() {
  const navigate = useNavigate()
  const { locale, setLocale } = useI18n()
  const { user, nombre, rol, logout } = useAuth()
  const dashboardCopy = useMemo(() => getAdminDashboardCopy(locale), [locale])
  const copy = useMemo(() => getAdminAthletesCopy(locale), [locale])

  const [profile, setProfile] = useState(null)
  const [rows, setRows] = useState([])
  const [membershipsMap, setMembershipsMap] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [role, setRole] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [editing, setEditing] = useState(false)
  const [membershipTarget, setMembershipTarget] = useState(null)
  const [membershipMode, setMembershipMode] = useState("activate")
  const [membershipSaving, setMembershipSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmationMessage, setConfirmationMessage] = useState("")

  const loadProfile = useCallback(async () => {
    const nextProfile = await fetchCurrentAdminProfile(user, { nombre, rol })
    setProfile(nextProfile)
  }, [nombre, rol, user])

  const loadRows = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const users = await fetchUsers({ search: "", role: "all", limit: 300 })
      const ids = users.map((item) => item.id).filter(Boolean)
      const nextMembershipsMap = await fetchLatestMensualidadesByUserIds(ids)

      setRows(users)
      setMembershipsMap(nextMembershipsMap)
    } catch (loadError) {
      console.error("ADMIN ATHLETES LOAD ERROR:", loadError)
      setError(loadError?.message || copy.loadError)
    } finally {
      setLoading(false)
    }
  }, [copy.loadError])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    loadRows()
  }, [loadRows])

  const enrichedRows = useMemo(
    () => enrichUsers(rows, membershipsMap),
    [membershipsMap, rows]
  )

  const stats = useMemo(
    () => (loading && rows.length === 0 ? EMPTY_STATS : buildAthleteStats(enrichedRows)),
    [enrichedRows, loading, rows.length]
  )

  const searchedRows = useMemo(
    () => searchUsers(enrichedRows, search),
    [enrichedRows, search]
  )

  const roleRows = useMemo(
    () => filterAthletes(searchedRows, { role, status: "all" }),
    [role, searchedRows]
  )

  const filteredRows = useMemo(
    () => filterAthletes(searchedRows, { role, status: statusFilter }),
    [role, searchedRows, statusFilter]
  )

  async function handleLogout() {
    try {
      await logout()
    } catch (logoutError) {
      console.error("ADMIN ATHLETES LOGOUT ERROR:", logoutError)
      window.location.href = "/"
    }
  }

  function openMembership(userRow) {
    if (userRow.status.forced) return
    setMembershipTarget(userRow)
    setMembershipMode(userRow.status.active ? "deactivate" : "activate")
  }

  async function handleCreate(payload) {
    try {
      setCreating(true)
      await createStudent(payload)
      setCreateOpen(false)
      await loadRows()
      setConfirmationMessage(copy.createdSuccess)
    } catch (operationError) {
      console.error("ADMIN ATHLETES CREATE ERROR:", operationError)
      window.alert(operationError?.message || copy.operationError)
    } finally {
      setCreating(false)
    }
  }

  async function handleEdit(payload) {
    if (!editTarget?.id) return

    try {
      setEditing(true)
      await updateUserBasic(editTarget.id, payload)
      setEditTarget(null)
      await loadRows()
      setConfirmationMessage(copy.updatedSuccess)
    } catch (operationError) {
      console.error("ADMIN ATHLETES EDIT ERROR:", operationError)
      window.alert(operationError?.message || copy.operationError)
    } finally {
      setEditing(false)
    }
  }

  async function handleMembership(payload) {
    if (!membershipTarget?.id) return

    try {
      setMembershipSaving(true)

      if (membershipMode === "activate") {
        await activateMensualidad({
          usuario_id: membershipTarget.id,
          fecha_inicio: payload.startDate,
          fecha_fin: payload.endDate,
        })
      } else {
        const membershipId = membershipTarget.status.membership?.id
        if (!membershipId) throw new Error(copy.operationError)
        await deactivateLatestMensualidad({ mensualidad_id: membershipId })
      }

      setMembershipTarget(null)
      await loadRows()
      setConfirmationMessage(
        membershipMode === "activate"
          ? copy.membershipActivatedSuccess
          : copy.membershipDeactivatedSuccess
      )
    } catch (operationError) {
      console.error("ADMIN ATHLETES MEMBERSHIP ERROR:", operationError)
      window.alert(operationError?.message || copy.operationError)
    } finally {
      setMembershipSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget?.id) return

    try {
      setDeleting(true)
      await deleteUserComplete(deleteTarget.id)
      setDeleteTarget(null)
      await loadRows()
      setConfirmationMessage(copy.deletedSuccess)
    } catch (operationError) {
      console.error("ADMIN ATHLETES DELETE ERROR:", operationError)
      window.alert(operationError?.message || copy.operationError)
    } finally {
      setDeleting(false)
    }
  }

  function handleExport() {
    const columns = [
      { label: copy.name, value: (item) => item.nombre || "" },
      { label: copy.email, value: (item) => item.email || "" },
      { label: copy.phone, value: (item) => item.telefono || "" },
      { label: copy.idNumber, value: (item) => item.cedula || "" },
      { label: copy.role, value: (item) => getRoleLabel(item.role, copy) },
      { label: copy.status, value: (item) => getStatusLabel(item.status, copy) },
      {
        label: copy.endDate,
        value: (item) =>
          item.status.membership?.fecha_fin
            ? formatDate(item.status.membership.fecha_fin, locale)
            : "",
      },
    ]

    const csvLines = [
      "sep=;",
      columns.map((column) => escapeCsvCell(column.label)).join(";"),
      ...filteredRows.map((item) =>
        columns.map((column) => escapeCsvCell(column.value(item))).join(";")
      ),
    ]

    const blob = new Blob(["\uFEFF", csvLines.join("\r\n")], {
      type: "text/csv;charset=utf-8",
    })
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = objectUrl
    link.download = `pho3nix-atletas-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(objectUrl)
    setConfirmationMessage(copy.exportedSuccess)
  }

  return (
    <div className="admin-dashboard-screen admin-athletes-screen">
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
        <AdminAthletesHeader
          dashboardCopy={dashboardCopy}
          copy={copy}
          locale={locale}
          setLocale={setLocale}
          profile={profile}
          loading={!profile}
          onLogout={handleLogout}
        />

        <main className="admin-dashboard-content admin-athletes-content">
          {error ? (
            <section className="admin-dashboard-error" role="alert">
              <div>
                <strong>{copy.loadError}</strong>
                <p>{error}</p>
              </div>
              <button type="button" onClick={loadRows}>{copy.retry}</button>
            </section>
          ) : null}

          <AdminAthletesStats copy={copy} stats={stats} loading={loading} />

          <AdminAthletesDirectory
            copy={copy}
            locale={locale}
            loading={loading}
            rows={filteredRows}
            allRows={roleRows}
            search={search}
            role={role}
            statusFilter={statusFilter}
            onSearchChange={setSearch}
            onRoleChange={setRole}
            onStatusChange={setStatusFilter}
            onCreate={() => setCreateOpen(true)}
            onExport={handleExport}
            onRefresh={loadRows}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
            onMembership={openMembership}
          />
        </main>
      </div>

      <AdminMobileNav copy={dashboardCopy} navigate={navigate} />

      {createOpen ? (
        <CreateAthleteModal
          copy={copy}
          locale={locale}
          loading={creating}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
      ) : null}

      {editTarget ? (
        <EditAthleteModal
          copy={copy}
          user={editTarget}
          loading={editing}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
        />
      ) : null}

      {membershipTarget ? (
        <MembershipModal
          copy={copy}
          locale={locale}
          user={membershipTarget}
          mode={membershipMode}
          loading={membershipSaving}
          onClose={() => setMembershipTarget(null)}
          onSubmit={handleMembership}
        />
      ) : null}

      {deleteTarget ? (
        <DeleteAthleteModal
          copy={copy}
          locale={locale}
          user={deleteTarget}
          loading={deleting}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      ) : null}

      {confirmationMessage ? (
        <OperationConfirmationPopup
          copy={copy}
          message={confirmationMessage}
          onClose={() => setConfirmationMessage("")}
        />
      ) : null}
    </div>
  )
}
