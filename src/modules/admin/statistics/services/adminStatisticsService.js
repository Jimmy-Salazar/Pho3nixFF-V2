import { supabase } from "../../../../config/supabase.js"
import {
  EMPTY_STATISTICS_DATA,
  buildActivitySeries,
  buildAthleteDetail,
  buildAthleteStatistics,
  buildHighlightedAthletes,
  buildInactiveAthletes,
  buildMembershipSummary,
  buildPrMovementSeries,
  buildPrStatistics,
  buildWodStatistics,
  buildWodWeekSeries,
  calculateWodParticipationRate,
  formatDateIso,
  getStatisticsRange,
  getWeekRange,
  normalizeRole,
  startOfDay,
} from "../utils/adminStatisticsUtils.js"

async function optionalQuery(label, queryFn, diagnostics, fallback = []) {
  try {
    return await queryFn()
  } catch (error) {
    console.warn(`[AdminStatistics] ${label}:`, error)
    diagnostics.push({ label, message: error?.message || String(error) })
    return fallback
  }
}

async function fetchUsers() {
  const fieldSets = [
    "id,nombre,email,role,sexo,foto_url,fecha_nacimiento,telefono,created_at",
    "id,nombre,email,role,sexo,foto_url,fecha_nacimiento,created_at",
    "id,nombre,email,role,sexo,foto_url,created_at",
    "id,nombre,email,role,sexo,foto_url",
  ]

  let lastError = null
  for (const fields of fieldSets) {
    const result = await supabase.from("usuarios").select(fields).order("nombre", { ascending: true })
    if (!result.error) return result.data || []
    lastError = result.error
  }

  throw lastError || new Error("No se pudieron cargar los usuarios.")
}

async function fetchUserById(userId) {
  const fieldSets = [
    "id,nombre,email,role,sexo,foto_url,fecha_nacimiento,telefono,created_at",
    "id,nombre,email,role,sexo,foto_url,fecha_nacimiento,created_at",
    "id,nombre,email,role,sexo,foto_url,created_at",
    "id,nombre,email,role,sexo,foto_url",
  ]

  let lastError = null
  for (const fields of fieldSets) {
    const result = await supabase.from("usuarios").select(fields).eq("id", userId).maybeSingle()
    if (!result.error) return result.data || null
    lastError = result.error
  }

  throw lastError || new Error("No se pudo cargar el atleta.")
}

async function fetchMemberships() {
  const { data, error } = await supabase
    .from("mensualidades")
    .select("id,usuario_id,fecha_inicio,fecha_fin,estado,created_at")
    .order("fecha_fin", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

async function fetchMembershipsByAthlete(athleteId) {
  const { data, error } = await supabase
    .from("mensualidades")
    .select("id,usuario_id,fecha_inicio,fecha_fin,estado,created_at")
    .eq("usuario_id", athleteId)
    .order("fecha_fin", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

async function fetchNutritionProfiles() {
  const fieldSets = [
    "usuario_id,meta,updated_at,created_at",
    "usuario_id,meta,updated_at",
    "usuario_id,meta,created_at",
    "usuario_id,meta",
  ]

  let lastError = null

  for (const fields of fieldSets) {
    const result = await supabase.from("nutricion_perfil").select(fields)
    if (!result.error) return result.data || []
    lastError = result.error
  }

  throw lastError || new Error("No se pudieron cargar los perfiles nutricionales.")
}

async function fetchExercises() {
  const { data, error } = await supabase
    .from("ejercicios")
    .select("id,nombre")
    .order("nombre", { ascending: true })

  if (error) throw error
  return data || []
}

async function fetchPrRecords(startIso = null, endIso = null) {
  const pageSize = 1000
  const rows = []
  let from = 0

  while (true) {
    let query = supabase
      .from("rm")
      .select("id,usuario,ejercicio_id,peso_libras,fecha,created_at")
      .order("fecha", { ascending: true })
      .order("created_at", { ascending: true })
      .range(from, from + pageSize - 1)

    if (startIso) query = query.gte("fecha", startIso)
    if (endIso) query = query.lte("fecha", endIso)

    const { data, error } = await query
    if (error) throw error

    const page = data || []
    rows.push(...page)
    if (page.length < pageSize) break
    from += pageSize
  }

  return rows
}

async function fetchPrRecordsByAthlete(athleteId) {
  const { data, error } = await supabase
    .from("rm")
    .select("id,usuario,ejercicio_id,peso_libras,fecha,created_at")
    .eq("usuario", athleteId)
    .order("fecha", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) throw error
  return data || []
}

async function fetchWods(startIso, endIso) {
  const fieldSets = [
    "id,nombre,descripcion,fecha,modo_ranking,modalidad,activo,publicado,fecha_publicacion,created_at",
    "id,nombre,descripcion,fecha,modo_ranking,modalidad,activo,publicado,fecha_publicacion",
    "id,nombre,fecha,modo_ranking,modalidad,activo,publicado,fecha_publicacion",
    "id,nombre,fecha,activo,publicado,fecha_publicacion",
  ]

  let lastError = null
  for (const fields of fieldSets) {
    const result = await supabase
      .from("wod")
      .select(fields)
      .gte("fecha", startIso)
      .lte("fecha", endIso)
      .order("fecha", { ascending: true })

    if (!result.error) return result.data || []
    lastError = result.error
  }

  throw lastError || new Error("No se pudieron cargar los WODs.")
}

async function fetchWodResults(startIso, endIso) {
  const fieldSets = [
    "id,wod_id,usuario_id,fecha,modalidad,tiempo_segundos,tiempo_texto,repeticiones,resultado,calorias_estimadas,created_at",
    "id,wod_id,usuario_id,fecha,modalidad,tiempo_segundos,tiempo_texto,repeticiones,calorias_estimadas,created_at",
    "id,wod_id,usuario_id,fecha,modalidad,tiempo_segundos,repeticiones,calorias_estimadas,created_at",
  ]

  let lastError = null
  for (const fields of fieldSets) {
    const result = await supabase
      .from("wod_resultados")
      .select(fields)
      .gte("fecha", startIso)
      .lte("fecha", endIso)
      .order("fecha", { ascending: true })
      .order("created_at", { ascending: true })

    if (!result.error) return result.data || []
    lastError = result.error
  }

  throw lastError || new Error("No se pudieron cargar los resultados WOD.")
}

async function fetchWodResultsByAthlete(athleteId, startIso, endIso) {
  const { data, error } = await supabase
    .from("wod_resultados")
    .select("id,wod_id,usuario_id,fecha,modalidad,tiempo_segundos,repeticiones,calorias_estimadas,created_at")
    .eq("usuario_id", athleteId)
    .gte("fecha", startIso)
    .lte("fecha", endIso)
    .order("fecha", { ascending: true })

  if (error) throw error
  return data || []
}

async function fetchWodResultCountByAthlete(athleteId) {
  const { count, error } = await supabase
    .from("wod_resultados")
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", athleteId)

  if (error) throw error
  return count || 0
}

async function fetchLatestWodResultByAthlete(athleteId) {
  const { data, error } = await supabase
    .from("wod_resultados")
    .select("id,fecha,created_at")
    .eq("usuario_id", athleteId)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)

  if (error) throw error
  return data?.[0] || null
}

async function fetchAttendance(startIso, endIso) {
  const { data, error } = await supabase
    .from("asistencia")
    .select("id,usuario_id,fecha")
    .gte("fecha", startIso)
    .lte("fecha", endIso)
    .order("fecha", { ascending: true })

  if (error) throw error
  return data || []
}

async function fetchAttendanceByAthlete(athleteId, startIso, endIso) {
  const { data, error } = await supabase
    .from("asistencia")
    .select("id,usuario_id,fecha")
    .eq("usuario_id", athleteId)
    .gte("fecha", startIso)
    .lte("fecha", endIso)
    .order("fecha", { ascending: true })

  if (error) throw error
  return data || []
}

async function fetchLatestAttendanceByAthlete(athleteId) {
  const { data, error } = await supabase
    .from("asistencia")
    .select("id,usuario_id,fecha")
    .eq("usuario_id", athleteId)
    .order("fecha", { ascending: false })
    .limit(1)

  if (error) throw error
  return data?.[0] || null
}

function isVisiblePublishedWod(wod, now = new Date()) {
  if (wod?.activo === false) return false
  if (wod?.publicado === false) return false
  if (wod?.fecha_publicacion && new Date(wod.fecha_publicacion) > now) return false
  return true
}

function isRowInRange(row, range) {
  const raw = row?.fecha || row?.created_at
  if (!raw) return false
  const date = new Date(String(raw).length === 10 ? `${raw}T00:00:00` : raw)
  return !Number.isNaN(date.getTime()) && date >= range.start && date <= range.end
}

async function assertAdmin(locale = "es") {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError

  const authUser = authData?.user
  if (!authUser?.id) {
    throw new Error(locale === "en" ? "No active session was found." : "No se encontró una sesión activa.")
  }

  const storedProfile = await fetchUserById(authUser.id)
  const profile = storedProfile || {
    id: authUser.id,
    nombre: authUser.user_metadata?.nombre || authUser.email || "PHO3NIX",
    email: authUser.email || "",
    role: authUser.user_metadata?.role || authUser.app_metadata?.role || "unknown",
    foto_url: "",
  }

  if (normalizeRole(profile.role || profile.rol) !== "admin") {
    const error = new Error(locale === "en"
      ? "This section is restricted to administrators."
      : "Esta sección es exclusiva para administradores.")
    error.code = "ADMIN_ONLY"
    throw error
  }

  return profile
}

export async function loadAdminStatisticsData({ days = 30, locale = "es" } = {}) {
  const diagnostics = []
  const now = new Date()
  const range = getStatisticsRange(days, now)
  const week = getWeekRange(now)
  const inactivityStart = startOfDay(new Date(now.getTime() - 30 * 86400000))
  const queryStart = inactivityStart < range.start ? inactivityStart : range.start
  const queryStartIso = formatDateIso(queryStart)
  const queryEndIso = range.endIso
  const wodHistoryDays = Math.max(range.days, 90)
  const wodHistoryStart = startOfDay(new Date(range.start.getTime() - wodHistoryDays * 86400000))
  const wodHistoryStartIso = formatDateIso(wodHistoryStart)

  const profile = await assertAdmin(locale)
  const users = await fetchUsers()

  const [memberships, nutritionProfiles, exercises, prAll, wodHistory, wodResultsHistory, attendanceAll] = await Promise.all([
    optionalQuery("mensualidades", fetchMemberships, diagnostics),
    optionalQuery("nutricion_perfil", fetchNutritionProfiles, diagnostics, null),
    optionalQuery("ejercicios", fetchExercises, diagnostics),
    optionalQuery("rm", () => fetchPrRecords(null, queryEndIso), diagnostics),
    optionalQuery("wod", () => fetchWods(wodHistoryStartIso, range.endIso), diagnostics),
    optionalQuery("wod_resultados", () => fetchWodResults(wodHistoryStartIso, range.endIso), diagnostics),
    optionalQuery("asistencia", () => fetchAttendance(queryStartIso, queryEndIso), diagnostics),
  ])

  const athletes = users.filter((user) => normalizeRole(user.role) === "alumno")
  const membershipData = buildMembershipSummary(athletes, memberships, now)
  const prRecords = prAll.filter((row) => isRowInRange(row, range))
  const wodResults = wodResultsHistory.filter((row) => isRowInRange(row, range))
  const attendance = attendanceAll.filter((row) => isRowInRange(row, range))
  const visibleWodHistory = wodHistory.filter((wod) => isVisiblePublishedWod(wod, now))
  const visibleWods = visibleWodHistory.filter((wod) => isRowInRange(wod, range))

  const activitySeries = buildActivitySeries({ range, locale, wodResults, prRecords, attendance })
  const weekResults = wodResultsHistory.filter((row) => {
    const date = new Date(`${String(row.fecha || "").slice(0, 10)}T00:00:00`)
    return !Number.isNaN(date.getTime()) && date >= week.start && date <= week.end
  })
  const wodWeekSeries = buildWodWeekSeries(weekResults, locale, now)
  const prMovementSeries = buildPrMovementSeries(prRecords, exercises, 5)
  const highlightedAthletes = buildHighlightedAthletes({ users: athletes, wodResults, prRecords, attendance, limit: 5 })
  const inactiveAthletes = buildInactiveAthletes({
    athletes,
    activeIds: membershipData.activeIds,
    recentWodResults: wodResultsHistory,
    recentPrRecords: prAll,
    recentAttendance: attendanceAll,
  })
  const athleteStats = buildAthleteStatistics({
    athletes,
    memberships,
    nutritionProfiles,
    wodResults,
    prRecords,
    attendance,
    recentWodResults: wodResultsHistory,
    recentPrRecords: prAll,
    recentAttendance: attendanceAll,
    range,
    locale,
    now,
  })
  const prStats = buildPrStatistics({ prRecords, historyRecords: prAll, exercises, athletes, range, locale })
  const wodStats = buildWodStatistics({
    wods: visibleWods,
    results: wodResults,
    historyWods: visibleWodHistory,
    historyResults: wodResultsHistory,
    users: athletes,
    activeAthleteCount: membershipData.activeIds.size,
    range,
  })

  const wodParticipationRate = calculateWodParticipationRate({
    activeAthleteCount: membershipData.activeIds.size,
    publishedWodCount: visibleWods.length,
    wodResults,
  })

  return {
    ...EMPTY_STATISTICS_DATA,
    profile,
    range: { days: range.days, startIso: range.startIso, endIso: range.endIso },
    summary: {
      activeAthletes: membershipData.activeIds.size,
      expiringSoon: membershipData.summary.expiring,
      wodParticipationRate,
      prCount: prRecords.length,
    },
    membershipSummary: membershipData.summary,
    activitySeries,
    wodWeekSeries,
    prMovementSeries,
    highlightedAthletes,
    athletes: athleteStats.rows.map((row) => ({
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      fotoUrl: row.fotoUrl,
      sexo: row.sexo,
      fechaNacimiento: row.fechaNacimiento,
      createdAt: row.createdAt,
      membershipStatus: row.membershipStatus,
    })),
    athleteStats,
    prStats,
    wodStats,
    alerts: {
      expiringSoon: membershipData.summary.expiring,
      inactiveAthletes: inactiveAthletes.length,
      prCount: prRecords.length,
    },
    diagnostics,
  }
}

export async function loadAdminAthleteStatisticsDetail({ athleteId, days = 30, locale = "es" } = {}) {
  if (!athleteId) throw new Error(locale === "en" ? "Select an athlete." : "Selecciona un atleta.")

  const diagnostics = []
  const now = new Date()
  const range = getStatisticsRange(days, now)
  await assertAdmin(locale)

  const athlete = await fetchUserById(athleteId)
  if (!athlete || normalizeRole(athlete.role) !== "alumno") {
    throw new Error(locale === "en" ? "The selected athlete was not found." : "No se encontró el atleta seleccionado.")
  }

  const [memberships, exercises, prRecords, wodResults, totalWodCount, latestWod, attendance, latestAttendance] = await Promise.all([
    optionalQuery("mensualidades_atleta", () => fetchMembershipsByAthlete(athleteId), diagnostics),
    optionalQuery("ejercicios", fetchExercises, diagnostics),
    optionalQuery("rm_atleta", () => fetchPrRecordsByAthlete(athleteId), diagnostics),
    optionalQuery("wod_resultados_atleta", () => fetchWodResultsByAthlete(athleteId, range.startIso, range.endIso), diagnostics),
    optionalQuery("wod_resultados_total_atleta", () => fetchWodResultCountByAthlete(athleteId), diagnostics, 0),
    optionalQuery("wod_resultado_ultimo_atleta", () => fetchLatestWodResultByAthlete(athleteId), diagnostics, null),
    optionalQuery("asistencia_atleta", () => fetchAttendanceByAthlete(athleteId, range.startIso, range.endIso), diagnostics),
    optionalQuery("asistencia_ultima_atleta", () => fetchLatestAttendanceByAthlete(athleteId), diagnostics, null),
  ])

  return buildAthleteDetail({
    athlete,
    memberships,
    exercises,
    prRecords,
    wodResults,
    totalWodCount,
    latestWod,
    attendance,
    latestAttendance,
    range,
    locale,
    now,
    diagnostics,
  })
}
