import { supabase } from "../../../../config/supabase.js"
import {
  EMPTY_ADMIN_DASHBOARD,
  buildBirthdayRows,
  buildGrowthSeries,
  formatDateISO,
  formatRelativeTime,
  getMembershipStatus,
  normalizeRole,
  normalizeSex,
} from "../utils/adminDashboardUtils.js"

async function safeQuery(label, query, fallback) {
  try {
    return await query()
  } catch (error) {
    console.warn(`[AdminDashboard] ${label}:`, error)
    return fallback
  }
}

async function loadUsers() {
  const selections = [
    "id,nombre,email,role,fecha_nacimiento,foto_url,sexo,created_at",
    "id,nombre,email,role,fecha_nacimiento,foto_url,sexo",
    "id,nombre,email,role,fecha_nacimiento,foto_url,created_at",
    "id,nombre,email,role,fecha_nacimiento,foto_url",
  ]

  let lastError = null

  for (const selection of selections) {
    const response = await supabase.from("usuarios").select(selection)

    if (!response.error) return response.data || []
    lastError = response.error
  }

  throw lastError || new Error("No se pudieron cargar los usuarios.")
}

async function loadMemberships() {
  const { data, error } = await supabase
    .from("mensualidades")
    .select("id,usuario_id,fecha_inicio,fecha_fin,estado,created_at")
    .order("fecha_fin", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

async function loadAnnouncements(nowIso) {
  const { data, error } = await supabase
    .from("anuncios")
    .select("id,titulo,contenido,fecha_publicacion,activo,created_at,media_url,media_tipo")
    .eq("activo", true)
    .lte("fecha_publicacion", nowIso)
    .order("fecha_publicacion", { ascending: false })
    .limit(8)

  if (error) throw error
  return data || []
}

async function loadPublishedWods() {
  const { data, error } = await supabase
    .from("wod")
    .select("id,nombre,descripcion,modo_ranking,modalidad,fecha,activo,publicado,fecha_publicacion")
    .eq("activo", true)
    .order("fecha", { ascending: false })
    .limit(12)

  if (error) throw error
  return data || []
}

function latestMembershipsByUser(rows) {
  const map = new Map()

  for (const row of rows || []) {
    if (!row?.usuario_id || map.has(row.usuario_id)) continue
    map.set(row.usuario_id, row)
  }

  return map
}

function buildMembershipData(athletes, memberships, now) {
  const latestMap = latestMembershipsByUser(memberships)
  const summary = {
    active: 0,
    expiring: 0,
    expired: 0,
    missing: 0,
    totalAthletes: athletes.length,
  }
  const activeRows = []
  const expiringRows = []

  athletes.forEach((athlete) => {
    const membership = latestMap.get(athlete.id) || null
    const status = getMembershipStatus(membership, now)
    const row = {
      id: athlete.id,
      nombre: athlete.nombre || athlete.email || "Atleta PHO3NIX",
      email: athlete.email || "",
      fotoUrl: athlete.foto_url || "",
      sexo: athlete.sexo || null,
      membership,
      status: status.status,
      daysLeft: status.daysLeft,
      fechaFin: membership?.fecha_fin || null,
    }

    if (status.status === "missing") summary.missing += 1
    if (status.status === "expired") summary.expired += 1

    if (status.active) {
      summary.active += 1
      activeRows.push(row)
    }

    if (status.status === "expiring") {
      summary.expiring += 1
      expiringRows.push(row)
    }
  })

  activeRows.sort((a, b) => a.nombre.localeCompare(b.nombre))
  expiringRows.sort((a, b) => Number(a.daysLeft ?? 999) - Number(b.daysLeft ?? 999))

  return { summary, activeRows, expiringRows }
}

function buildSexSummary(rows = []) {
  return rows.reduce(
    (summary, item) => {
      const normalized = normalizeSex(item?.sexo)

      if (normalized === "male") summary.men += 1
      if (normalized === "female") summary.women += 1

      return summary
    },
    { men: 0, women: 0 }
  )
}

function buildActivities({ users, announcements, publishedWods, expiringRows, locale, now }) {
  const last24 = now.getTime() - 24 * 60 * 60 * 1000
  const activities = []

  users
    .filter((user) => user.created_at && new Date(user.created_at).getTime() >= last24)
    .forEach((user) => {
      activities.push({
        id: `user-${user.id}`,
        icon: "👤",
        title: user.nombre || user.email || "Nuevo usuario",
        subtitle: normalizeRole(user.role),
        module: "Usuarios",
        createdAt: user.created_at,
      })
    })

  announcements
    .filter((item) => {
      const value = item.fecha_publicacion || item.created_at
      return value && new Date(value).getTime() >= last24
    })
    .forEach((item) => {
      activities.push({
        id: `announcement-${item.id}`,
        icon: "📣",
        title: item.titulo || "Anuncio publicado",
        subtitle: item.contenido || "Nuevo anuncio PHO3NIX",
        module: "Anuncios",
        createdAt: item.fecha_publicacion || item.created_at,
      })
    })

  publishedWods
    .filter((item) => {
      const value = item.fecha_publicacion
      return item.publicado === true && value && new Date(value).getTime() >= last24
    })
    .forEach((item) => {
      activities.push({
        id: `wod-${item.id}`,
        icon: "🏋",
        title: item.nombre || "WOD publicado",
        subtitle: item.descripcion || "Disponible para atletas",
        module: "WOD",
        createdAt: item.fecha_publicacion,
      })
    })

  expiringRows.slice(0, 5).forEach((item) => {
    activities.push({
      id: `membership-${item.id}-${item.fechaFin}`,
      icon: "▣",
      title: item.nombre,
      subtitle:
        item.daysLeft === 0
          ? locale === "en"
            ? "Membership expires today"
            : "La mensualidad vence hoy"
          : locale === "en"
            ? `Membership expires in ${item.daysLeft} day(s)`
            : `La mensualidad vence en ${item.daysLeft} día(s)`,
      module: locale === "en" ? "Membership" : "Mensualidad",
      createdAt: null,
      sortTime: now.getTime() - 1,
    })
  })

  return activities
    .map((item) => ({
      ...item,
      time: item.createdAt ? formatRelativeTime(item.createdAt, locale, now) : locale === "en" ? "Alert" : "Alerta",
      sortTime: item.sortTime || new Date(item.createdAt || 0).getTime(),
    }))
    .sort((a, b) => b.sortTime - a.sortTime)
    .slice(0, 12)
}

function buildUpcomingEvents({ todayWod, birthdayRows, expiringRows, locale }) {
  const events = []

  if (todayWod) {
    events.push({
      id: `wod-${todayWod.id}`,
      type: "wod",
      icon: "🏋",
      title: todayWod.nombre || (locale === "en" ? "Today WOD" : "WOD del día"),
      subtitle: locale === "en" ? "Published for athletes" : "Publicado para atletas",
      date: todayWod.fecha,
      path: "/admin/wods",
    })
  }

  birthdayRows.slice(0, 3).forEach((item) => {
    events.push({
      id: `birthday-${item.id}`,
      type: "birthday",
      icon: "🎂",
      title: item.nombre,
      subtitle:
        item.daysUntil === 0
          ? locale === "en"
            ? "Birthday today"
            : "Cumple hoy"
          : locale === "en"
            ? `In ${item.daysUntil} day(s)`
            : `En ${item.daysUntil} día(s)`,
      date: item.nextBirthday,
      path: "/admin/dashboard",
    })
  })

  expiringRows.slice(0, 2).forEach((item) => {
    events.push({
      id: `expiration-${item.id}`,
      type: "membership",
      icon: "▣",
      title: item.nombre,
      subtitle:
        item.daysLeft === 0
          ? locale === "en"
            ? "Expires today"
            : "Vence hoy"
          : locale === "en"
            ? `Expires in ${item.daysLeft} day(s)`
            : `Vence en ${item.daysLeft} día(s)`,
      date: item.fechaFin,
      path: "/admin/mensualidades",
    })
  })

  return events
    .sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime()
    )
    .slice(0, 6)
}

export async function loadAdminDashboardData({ locale = "es" } = {}) {
  const now = new Date()
  const nowIso = now.toISOString()
  const todayIso = formatDateISO(now)

  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError

  const authUser = authData?.user
  if (!authUser?.id) throw new Error("No se encontró una sesión activa.")

  const [users, memberships, announcements, publishedWods] = await Promise.all([
    loadUsers(),
    safeQuery("mensualidades", loadMemberships, []),
    safeQuery("anuncios", () => loadAnnouncements(nowIso), []),
    safeQuery("wods", loadPublishedWods, []),
  ])

  const profile =
    users.find((user) => user.id === authUser.id) || {
      id: authUser.id,
      nombre: authUser.user_metadata?.nombre || authUser.email || "PHO3NIX",
      email: authUser.email || "",
      role: authUser.user_metadata?.role || "admin",
      foto_url: "",
    }

  const athletes = users.filter((user) => normalizeRole(user.role) === "alumno")
  const coaches = users.filter((user) => normalizeRole(user.role) === "coach")
  const admins = users.filter((user) => normalizeRole(user.role) === "admin")
  const others = users.filter((user) => !["alumno", "coach", "admin"].includes(normalizeRole(user.role)))

  const membershipData = buildMembershipData(athletes, memberships, now)
  const registeredSexSummary = buildSexSummary(athletes)
  const activeSexSummary = buildSexSummary(membershipData.activeRows)
  const birthdayRows = buildBirthdayRows(users, now)
  const birthdaysThisMonth = birthdayRows
    .filter((item) => item.isThisMonth)
    .sort((a, b) => a.birthDay - b.birthDay)
  const todayBirthdays = birthdayRows.filter((item) => item.daysUntil === 0)

  const visibleWods = publishedWods.filter((item) => {
    if (item.publicado === true && item.fecha_publicacion) {
      return new Date(item.fecha_publicacion) <= now
    }
    return true
  })
  const todayWod = visibleWods.find((item) => item.fecha === todayIso) || null

  const growthSeries = buildGrowthSeries(users, memberships, locale, now)
  const activities = buildActivities({
    users,
    announcements,
    publishedWods,
    expiringRows: membershipData.expiringRows,
    locale,
    now,
  })
  const upcomingEvents = buildUpcomingEvents({
    todayWod,
    birthdayRows,
    expiringRows: membershipData.expiringRows,
    locale,
  })

  return {
    ...EMPTY_ADMIN_DASHBOARD,
    profile,
    metrics: {
      totalUsers: users.length,
      registeredAthletes: athletes.length,
      registeredMen: registeredSexSummary.men,
      registeredWomen: registeredSexSummary.women,
      activeAthletes: membershipData.summary.active,
      activeMen: activeSexSummary.men,
      activeWomen: activeSexSummary.women,
      coaches: coaches.length,
      admins: admins.length,
      expiringSoon: membershipData.summary.expiring,
      todayWodPublished: Boolean(todayWod),
      announcements: announcements.length,
    },
    membershipSummary: membershipData.summary,
    roleSummary: {
      athletes: athletes.length,
      coaches: coaches.length,
      admins: admins.length,
      others: others.length,
    },
    growthSeries,
    hasGrowthData: growthSeries.some(
      (item) => item.existing > 0 || item.newAthletes > 0 || item.departed > 0
    ),
    todayWod,
    announcements,
    activities,
    upcomingEvents,
    birthdaysThisMonth,
    detailRows: {
      registeredAthletes: athletes
        .map((athlete) => ({
          id: athlete.id,
          nombre: athlete.nombre || athlete.email || "Atleta PHO3NIX",
          email: athlete.email || "",
          role: "alumno",
          sexo: athlete.sexo || null,
          fotoUrl: athlete.foto_url || "",
        }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre)),
      activeAthletes: membershipData.activeRows,
      expiringSoon: membershipData.expiringRows,
      birthdaysThisMonth,
      todayBirthdays,
    },
  }
}
