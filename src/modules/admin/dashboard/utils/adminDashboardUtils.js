export const EMPTY_ADMIN_DASHBOARD = {
  profile: null,
  metrics: {
    totalUsers: 0,
    registeredAthletes: 0,
    registeredMen: 0,
    registeredWomen: 0,
    activeAthletes: 0,
    activeMen: 0,
    activeWomen: 0,
    coaches: 0,
    admins: 0,
    expiringSoon: 0,
    todayWodPublished: false,
    announcements: 0,
  },
  membershipSummary: {
    active: 0,
    expiring: 0,
    expired: 0,
    missing: 0,
    totalAthletes: 0,
  },
  roleSummary: {
    athletes: 0,
    coaches: 0,
    admins: 0,
    others: 0,
  },
  growthSeries: [],
  hasGrowthData: false,
  todayWod: null,
  announcements: [],
  activities: [],
  upcomingEvents: [],
  birthdaysThisMonth: [],
  detailRows: {
    registeredAthletes: [],
    activeAthletes: [],
    expiringSoon: [],
    birthdaysThisMonth: [],
    todayBirthdays: [],
  },
}

export const ADMIN_NAV_ITEMS = [
  { key: "dashboard", icon: "⌂", path: "/admin/dashboard" },
  { key: "athletes", icon: "👥", path: "/admin/atleta" },
  { key: "wods", icon: "🏋", path: "/admin/wods" },
  { key: "records", icon: "🏆", path: "/admin/pr" },
  { key: "statistics", icon: "↗", path: "/admin/estadisticas", adminOnly: true, labelEs: "Estadísticas", labelEn: "Statistics" },
  { key: "announcements", icon: "◉", path: "/admin/anuncios" },
  { key: "pda", icon: "▤", path: "/admin/pda", adminOnly: true, labelEs: "PDA's", labelEn: "PDA's" },
  { key: "competitions", icon: "★", path: "/admin/competencias" },
]

export function normalizeRole(value) {
  const role = String(value || "").trim().toLowerCase()

  if (["admin", "administrador"].includes(role)) return "admin"
  if (["coach", "entrenador"].includes(role)) return "coach"
  if (["alumno", "atleta", "student", "athlete"].includes(role)) return "alumno"

  return role || "unknown"
}

export function normalizeSex(value) {
  const sex = String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  if (["hombre", "masculino", "male", "man", "m"].includes(sex)) return "male"
  if (["mujer", "femenino", "female", "woman", "f"].includes(sex)) return "female"

  return "unknown"
}

export function formatDateISO(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date)
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function parseLocalDate(value) {
  if (!value) return null
  if (value instanceof Date) return value

  const text = String(value)
  const parts = text.slice(0, 10).split("-").map(Number)

  if (parts.length === 3 && parts.every(Number.isFinite)) {
    return new Date(parts[0], parts[1] - 1, parts[2])
  }

  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function startOfDay(value = new Date()) {
  const date = value instanceof Date ? new Date(value) : new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

export function daysBetween(fromValue, toValue) {
  const from = startOfDay(fromValue)
  const to = startOfDay(toValue)
  return Math.round((to.getTime() - from.getTime()) / 86400000)
}

export function getMembershipStatus(membership, now = new Date()) {
  if (!membership?.fecha_fin) {
    return { status: "missing", active: false, daysLeft: null }
  }

  const endDate = parseLocalDate(membership.fecha_fin)
  if (!endDate) {
    return { status: "missing", active: false, daysLeft: null }
  }

  const daysLeft = daysBetween(now, endDate)
  const explicitState = String(membership.estado || "").trim().toLowerCase()
  const explicitlyInactive = [
    "inactivo",
    "inactiva",
    "vencido",
    "vencida",
    "cancelado",
    "cancelada",
  ].includes(explicitState)

  if (explicitlyInactive || daysLeft < 0) {
    return { status: "expired", active: false, daysLeft }
  }

  if (daysLeft <= 7) {
    return { status: "expiring", active: true, daysLeft }
  }

  return { status: "active", active: true, daysLeft }
}

export function getNextBirthday(fechaNacimiento, today = new Date()) {
  const birthDate = parseLocalDate(fechaNacimiento)
  if (!birthDate) return null

  const current = startOfDay(today)
  let next = new Date(current.getFullYear(), birthDate.getMonth(), birthDate.getDate())

  if (next < current) {
    next = new Date(current.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate())
  }

  return next
}

export function buildBirthdayRows(users = [], now = new Date()) {
  const currentMonth = now.getMonth()

  return users
    .filter((user) => user?.fecha_nacimiento)
    .map((user) => {
      const birthDate = parseLocalDate(user.fecha_nacimiento)
      const nextBirthday = getNextBirthday(user.fecha_nacimiento, now)

      if (!birthDate || !nextBirthday) return null

      return {
        id: user.id,
        nombre: user.nombre || user.email || "Miembro PHO3NIX",
        role: normalizeRole(user.role),
        fotoUrl: user.foto_url || "",
        fechaNacimiento: user.fecha_nacimiento,
        birthDay: birthDate.getDate(),
        birthMonth: birthDate.getMonth(),
        nextBirthday,
        daysUntil: daysBetween(now, nextBirthday),
        isThisMonth: birthDate.getMonth() === currentMonth,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.daysUntil - b.daysUntil || a.nombre.localeCompare(b.nombre))
}

export function getInitials(name) {
  const parts = String(name || "PH")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return "PH"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function formatDateLabel(value, locale = "es") {
  const date = value instanceof Date ? value : parseLocalDate(value)
  if (!date) return "—"

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function formatLongDate(value, locale = "es") {
  const date = value instanceof Date ? value : parseLocalDate(value)
  if (!date) return "—"

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

export function formatRelativeTime(value, locale = "es", now = new Date()) {
  if (!value) return locale === "en" ? "Now" : "Ahora"

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return locale === "en" ? "Now" : "Ahora"

  const diffMinutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60000))

  if (diffMinutes < 1) return locale === "en" ? "Now" : "Ahora"
  if (diffMinutes < 60) return `${diffMinutes} min`

  const hours = Math.floor(diffMinutes / 60)
  if (hours < 24) return `${hours} h`

  const days = Math.floor(hours / 24)
  return `${days} d`
}

export function getActiveAdminNavKey(pathname) {
  const path = String(pathname || "").toLowerCase()

  if (path.startsWith("/admin/atleta") || path.startsWith("/admin/atletas") || path.startsWith("/admin/alumnos") || path.startsWith("/admin/users")) return "athletes"
  if (path.startsWith("/admin/wods")) return "wods"
  if (path.startsWith("/admin/estadisticas") || path.startsWith("/admin/statistics")) return "statistics"
  if (path.includes("personalrecord") || path.includes("/admin/pr") || path.includes("/rm")) return "records"
  if (path.startsWith("/admin/nutricion")) return "nutrition"
  if (path.startsWith("/admin/mensualidades")) return "memberships"
  if (path.startsWith("/admin/anuncios")) return "announcements"
  if (path.startsWith("/admin/challenge")) return "challenges"
  if (path.startsWith("/admin/pda")) return "pda"
  if (path.startsWith("/admin/competencias")) return "competitions"

  return "dashboard"
}

export function buildGrowthSeries(
  users = [],
  memberships = [],
  locale = "es",
  now = new Date()
) {
  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
    month: "short",
  })

  const athletes = users.filter((user) => normalizeRole(user.role) === "alumno")
  const athleteIds = new Set(athletes.map((athlete) => String(athlete.id)))
  const membershipsByAthlete = new Map()

  memberships.forEach((membership) => {
    const athleteId = String(membership?.usuario_id || "")
    if (!athleteId || !athleteIds.has(athleteId)) return

    const startDate = parseLocalDate(membership.fecha_inicio || membership.created_at)
    const endDate = parseLocalDate(membership.fecha_fin)
    if (!startDate || !endDate) return

    const rows = membershipsByAthlete.get(athleteId) || []
    rows.push({ startDate, endDate })
    membershipsByAthlete.set(athleteId, rows)
  })

  membershipsByAthlete.forEach((rows) => {
    rows.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  })

  const lifecycleByAthlete = athletes.map((athlete) => {
    const rows = membershipsByAthlete.get(String(athlete.id)) || []
    const createdAt = athlete.created_at ? new Date(athlete.created_at) : null
    const validCreatedAt = createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : null
    const firstMembershipStart = rows[0]?.startDate || null
    const firstJoinDate = validCreatedAt || firstMembershipStart
    const lastMembershipEnd = rows.length ? rows[rows.length - 1].endDate : null

    return {
      id: athlete.id,
      firstJoinDate,
      lastMembershipEnd,
      memberships: rows,
    }
  })

  const months = []

  for (let offset = 11; offset >= 0; offset -= 1) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999)

    let existing = 0
    let newAthletes = 0
    let departed = 0

    lifecycleByAthlete.forEach((athlete) => {
      const joinedBeforeMonth =
        athlete.firstJoinDate && athlete.firstJoinDate < monthStart
      const hadNotLeftBeforeMonth =
        !athlete.lastMembershipEnd || athlete.lastMembershipEnd >= monthStart

      if (joinedBeforeMonth && hadNotLeftBeforeMonth) existing += 1

      if (
        athlete.firstJoinDate &&
        athlete.firstJoinDate >= monthStart &&
        athlete.firstJoinDate <= monthEnd
      ) {
        newAthletes += 1
      }

      if (
        athlete.lastMembershipEnd &&
        athlete.lastMembershipEnd >= monthStart &&
        athlete.lastMembershipEnd <= monthEnd &&
        athlete.lastMembershipEnd < now
      ) {
        departed += 1
      }
    })

    months.push({
      year: monthStart.getFullYear(),
      month: monthStart.getMonth(),
      label: formatter.format(monthStart).replace(".", ""),
      existing,
      newAthletes,
      departed,
    })
  }

  const firstMonthWithData = months.findIndex(
    (item) => item.existing > 0 || item.newAthletes > 0 || item.departed > 0
  )

  if (firstMonthWithData === -1) return []

  // Only expose the historical period that already contains real information.
  // New months are appended automatically until the rolling window reaches 12 months.
  return months.slice(firstMonthWithData)
}
