import { normalizeRole, normalizeSex, parseLocalDate } from "../../dashboard/utils/adminDashboardUtils.js"

export const ROLE_OPTIONS = [
  { value: "all", key: "roleAll" },
  { value: "Alumno", key: "roleAthlete" },
  { value: "Coach", key: "roleCoach" },
  { value: "Admin", key: "roleAdmin" },
]

export const ROLE_PICKER_OPTIONS = [
  { value: "Alumno", key: "roleAthlete", noteKey: "regularAccess" },
  { value: "Coach", key: "roleCoach", noteKey: "sportManagement" },
  { value: "Admin", key: "roleAdmin", noteKey: "fullAccess" },
]

export const STATUS_FILTERS = [
  { value: "all", key: "filterAll" },
  { value: "active", key: "filterActive" },
  { value: "expiring", key: "filterExpiring" },
  { value: "inactive", key: "filterInactive" },
]

export function getDaysLeft(value, now = new Date()) {
  const end = parseLocalDate(value)
  if (!end) return null

  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())

  return Math.ceil((endDay.getTime() - startToday.getTime()) / 86400000)
}

export function buildAthleteStatus(user, membership, now = new Date()) {
  const role = normalizeRole(user?.role)

  if (role === "admin") {
    return {
      code: "forced",
      active: true,
      expiring: false,
      forced: true,
      daysLeft: null,
      membership: null,
    }
  }

  if (!membership?.fecha_fin) {
    return {
      code: "inactive",
      active: false,
      expiring: false,
      forced: false,
      daysLeft: null,
      membership: membership || null,
    }
  }

  const daysLeft = getDaysLeft(membership.fecha_fin, now)
  const state = String(membership.estado || "").trim().toLowerCase()
  const explicitlyInactive = [
    "inactivo",
    "inactiva",
    "vencido",
    "vencida",
    "cancelado",
    "cancelada",
  ].includes(state)

  if (explicitlyInactive || daysLeft === null || daysLeft < 0) {
    return {
      code: "inactive",
      active: false,
      expiring: false,
      forced: false,
      daysLeft,
      membership,
    }
  }

  if (daysLeft <= 7) {
    return {
      code: "expiring",
      active: true,
      expiring: true,
      forced: false,
      daysLeft,
      membership,
    }
  }

  return {
    code: "active",
    active: true,
    expiring: false,
    forced: false,
    daysLeft,
    membership,
  }
}

export function enrichUsers(users = [], membershipsMap = new Map(), now = new Date()) {
  return users.map((user) => ({
    ...user,
    normalizedRole: normalizeRole(user?.role),
    normalizedSex: normalizeSex(user?.sexo),
    status: buildAthleteStatus(user, membershipsMap.get(user.id), now),
  }))
}

export function buildAthleteStats(rows = []) {
  const athletes = rows.filter((row) => row.normalizedRole === "alumno")
  const activeAthletes = athletes.filter((row) => row.status.active)

  return {
    registered: athletes.length,
    registeredMen: athletes.filter((row) => row.normalizedSex === "male").length,
    registeredWomen: athletes.filter((row) => row.normalizedSex === "female").length,
    active: activeAthletes.length,
    activeMen: activeAthletes.filter((row) => row.normalizedSex === "male").length,
    activeWomen: activeAthletes.filter((row) => row.normalizedSex === "female").length,
    expiring: athletes.filter((row) => row.status.expiring).length,
    inactive: athletes.filter((row) => !row.status.active).length,
  }
}


export function searchUsers(rows = [], search = "") {
  const needle = String(search || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  if (!needle) return rows

  return rows.filter((row) => {
    const haystack = [row.nombre, row.email, row.cedula, row.telefono]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")

    return haystack.includes(needle)
  })
}

export function filterAthletes(rows = [], { role = "all", status = "all" } = {}) {
  const normalizedRoleFilter = normalizeRole(role)

  return rows.filter((row) => {
    const roleMatches = role === "all" || row.normalizedRole === normalizedRoleFilter

    if (!roleMatches) return false
    if (status === "active") return row.status.code === "active"
    if (status === "expiring") return row.status.expiring
    if (status === "inactive") return row.status.code === "inactive"

    return true
  })
}

export function getStatusCount(rows = [], status = "all") {
  if (status === "active") return rows.filter((row) => row.status.code === "active").length
  if (status === "expiring") return rows.filter((row) => row.status.expiring).length
  if (status === "inactive") return rows.filter((row) => row.status.code === "inactive").length
  return rows.length
}

export function getStatusLabel(status, copy) {
  if (status?.forced) return copy.alwaysActive
  if (status?.expiring) return copy.expiringLabel
  if (status?.active) return copy.activeLabel
  return copy.inactiveLabel
}


export function toRolePickerValue(role) {
  const normalized = normalizeRole(role)
  if (normalized === "admin") return "Admin"
  if (normalized === "coach") return "Coach"
  return "Alumno"
}

export function getRoleLabel(role, copy) {
  const normalized = normalizeRole(role)
  if (normalized === "admin") return copy.roleAdmin
  if (normalized === "coach") return copy.roleCoach
  if (normalized === "alumno") return copy.roleAthlete
  return role || copy.unknown
}

export function formatDate(value, locale = "es") {
  const date = parseLocalDate(value)
  if (!date) return "—"

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function formatMembershipHint(status, copy) {
  if (status?.forced) return copy.alwaysActive
  if (status?.daysLeft === null) return copy.noPayment
  if (status.daysLeft === 0) return copy.today
  if (status.daysLeft > 0) return `${status.daysLeft} ${copy.days}`
  return copy.inactiveLabel
}

export function getTodayISO() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
