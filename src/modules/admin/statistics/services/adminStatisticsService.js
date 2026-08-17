import { supabase } from "../../../../config/supabase.js"
import {
  EMPTY_STATISTICS_DATA,
  expandWodResultsWithParticipants,
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
  parseLocalDate,
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

const PAGE_SIZE = 1000
const IN_QUERY_CHUNK = 200

const WOD_FIELD_SETS = [
  "id,nombre,descripcion,fecha,modo_ranking,modalidad,activo,publicado,fecha_publicacion,created_at",
  "id,nombre,descripcion,fecha,modo_ranking,modalidad,activo,publicado,fecha_publicacion",
  "id,nombre,fecha,modo_ranking,modalidad,activo,publicado,fecha_publicacion",
  "id,nombre,fecha,activo,publicado,fecha_publicacion",
]

const WOD_RESULT_FIELD_SETS = [
  "id,wod_id,usuario_id,fecha,modalidad,tiempo_segundos,tiempo_texto,repeticiones,resultado,calorias_estimadas,created_at",
  "id,wod_id,usuario_id,fecha,modalidad,tiempo_segundos,tiempo_texto,repeticiones,calorias_estimadas,created_at",
  "id,wod_id,usuario_id,fecha,modalidad,tiempo_segundos,repeticiones,calorias_estimadas,created_at",
]

function chunkValues(values = [], size = IN_QUERY_CHUNK) {
  const unique = [...new Set(values.map((value) => String(value || "")).filter(Boolean))]
  const chunks = []
  for (let index = 0; index < unique.length; index += size) {
    chunks.push(unique.slice(index, index + size))
  }
  return chunks
}

async function fetchPagedRows(buildQuery) {
  const rows = []
  let from = 0

  while (true) {
    const { data, error } = await buildQuery(from, from + PAGE_SIZE - 1)
    if (error) throw error

    const page = data || []
    rows.push(...page)
    if (page.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return rows
}

async function fetchWithFieldFallback(fieldSets, buildQuery) {
  let lastError = null

  for (const fields of fieldSets) {
    try {
      return await fetchPagedRows((from, to) => buildQuery(fields, from, to))
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error("No se pudo completar la consulta.")
}

function resultChronologicalTime(row) {
  const day = parseLocalDate(row?.fecha)
  const dayTime = day?.getTime() || 0
  const createdAt = new Date(row?.created_at || 0)
  const createdTime = Number.isNaN(createdAt.getTime()) ? 0 : createdAt.getTime()
  return [dayTime, createdTime]
}

function sortResultsChronologically(a, b) {
  const [aDay, aCreated] = resultChronologicalTime(a)
  const [bDay, bCreated] = resultChronologicalTime(b)
  return aDay - bDay || aCreated - bCreated
}

async function fetchUsers() {
  const fieldSets = [
    "id,nombre,email,role,sexo,foto_url,fecha_nacimiento,telefono,created_at",
    "id,nombre,email,role,sexo,foto_url,fecha_nacimiento,created_at",
    "id,nombre,email,role,sexo,foto_url,created_at",
    "id,nombre,email,role,sexo,foto_url",
  ]

  return fetchWithFieldFallback(fieldSets, (fields, from, to) => (
    supabase
      .from("usuarios")
      .select(fields)
      .order("nombre", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to)
  ))
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
  return fetchPagedRows((from, to) => (
    supabase
      .from("mensualidades")
      .select("id,usuario_id,fecha_inicio,fecha_fin,estado,created_at")
      .order("fecha_fin", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, to)
  ))
}

async function fetchMembershipsByAthlete(athleteId) {
  return fetchPagedRows((from, to) => (
    supabase
      .from("mensualidades")
      .select("id,usuario_id,fecha_inicio,fecha_fin,estado,created_at")
      .eq("usuario_id", athleteId)
      .order("fecha_fin", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, to)
  ))
}


async function fetchNutritionProfiles() {
  const fieldSets = [
    "usuario_id,meta,updated_at,created_at",
    "usuario_id,meta,updated_at",
    "usuario_id,meta,created_at",
    "usuario_id,meta",
  ]

  return fetchWithFieldFallback(fieldSets, (fields, from, to) => (
    supabase
      .from("nutricion_perfil")
      .select(fields)
      .order("usuario_id", { ascending: true })
      .range(from, to)
  ))
}

async function fetchExercises() {
  return fetchPagedRows((from, to) => (
    supabase
      .from("ejercicios")
      .select("id,nombre")
      .order("nombre", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to)
  ))
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
      .order("id", { ascending: true })
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
  return fetchPagedRows((from, to) => (
    supabase
      .from("rm")
      .select("id,usuario,ejercicio_id,peso_libras,fecha,created_at")
      .eq("usuario", athleteId)
      .order("fecha", { ascending: true })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to)
  ))
}

async function fetchWods(startIso, endIso) {
  return fetchWithFieldFallback(WOD_FIELD_SETS, (fields, from, to) => {
    let query = supabase
      .from("wod")
      .select(fields)
      .order("fecha", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to)

    if (startIso) query = query.gte("fecha", startIso)
    if (endIso) query = query.lte("fecha", endIso)
    return query
  })
}

async function fetchWodsByIds(wodIds = []) {
  const rows = []

  for (const ids of chunkValues(wodIds)) {
    const chunkRows = await fetchWithFieldFallback(WOD_FIELD_SETS, (fields, from, to) => (
      supabase
        .from("wod")
        .select(fields)
        .in("id", ids)
        .order("fecha", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to)
    ))
    rows.push(...chunkRows)
  }

  return rows
}

async function fetchWodResults(startIso, endIso) {
  return fetchWithFieldFallback(WOD_RESULT_FIELD_SETS, (fields, from, to) => {
    let query = supabase
      .from("wod_resultados")
      .select(fields)
      .order("fecha", { ascending: true })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to)

    if (startIso) query = query.gte("fecha", startIso)
    if (endIso) query = query.lte("fecha", endIso)
    return query
  })
}

async function fetchOwnedWodResultsByAthlete(athleteId, endIso = null) {
  return fetchWithFieldFallback(WOD_RESULT_FIELD_SETS, (fields, from, to) => {
    let query = supabase
      .from("wod_resultados")
      .select(fields)
      .eq("usuario_id", athleteId)
      .order("fecha", { ascending: true })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to)

    if (endIso) query = query.lte("fecha", endIso)
    return query
  })
}

async function fetchWodResultsByIds(resultIds = [], endIso = null) {
  const rows = []

  for (const ids of chunkValues(resultIds)) {
    const chunkRows = await fetchWithFieldFallback(WOD_RESULT_FIELD_SETS, (fields, from, to) => {
      let query = supabase
        .from("wod_resultados")
        .select(fields)
        .in("id", ids)
        .order("fecha", { ascending: true })
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to)

      if (endIso) query = query.lte("fecha", endIso)
      return query
    })
    rows.push(...chunkRows)
  }

  return rows
}

async function fetchWodParticipantLinksByResultIds(resultIds = []) {
  const rows = []

  for (const ids of chunkValues(resultIds)) {
    const chunkRows = await fetchPagedRows((from, to) => (
      supabase
        .from("wod_resultado_participantes")
        .select("id,wod_resultado_id,usuario_id,created_at")
        .in("wod_resultado_id", ids)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to)
    ))
    rows.push(...chunkRows)
  }

  return rows
}

async function fetchWodParticipantLinksByAthlete(athleteId) {
  return fetchPagedRows((from, to) => (
    supabase
      .from("wod_resultado_participantes")
      .select("id,wod_resultado_id,usuario_id,created_at")
      .eq("usuario_id", athleteId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to)
  ))
}

function mergeAthleteWodParticipation(athleteId, ownedResults = [], linkedResults = []) {
  const map = new Map()

  ;[...ownedResults, ...linkedResults].forEach((row) => {
    if (!row?.id) return
    map.set(String(row.id), {
      ...row,
      source_usuario_id: row.usuario_id,
      usuario_id: athleteId,
    })
  })

  return [...map.values()].sort(sortResultsChronologically)
}

async function fetchAttendance(startIso, endIso) {
  return fetchPagedRows((from, to) => (
    supabase
      .from("asistencia")
      .select("id,usuario_id,fecha")
      .gte("fecha", startIso)
      .lte("fecha", endIso)
      .order("fecha", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to)
  ))
}

async function fetchAttendanceByAthlete(athleteId, startIso, endIso) {
  return fetchPagedRows((from, to) => (
    supabase
      .from("asistencia")
      .select("id,usuario_id,fecha")
      .eq("usuario_id", athleteId)
      .gte("fecha", startIso)
      .lte("fecha", endIso)
      .order("fecha", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to)
  ))
}

async function fetchLatestAttendanceByAthlete(athleteId) {
  const { data, error } = await supabase
    .from("asistencia")
    .select("id,usuario_id,fecha")
    .eq("usuario_id", athleteId)
    .order("fecha", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)

  if (error) throw error
  return data?.[0] || null
}

function isVisiblePublishedWod(wod, now = new Date()) {
  if (wod?.activo !== true) return false
  if (wod?.publicado !== true) return false
  if (wod?.fecha_publicacion && new Date(wod.fecha_publicacion) > now) return false
  return true
}

function isRowInRange(row, range) {
  const raw = row?.fecha || row?.created_at
  if (!raw) return false
  const date = parseLocalDate(raw)
  return Boolean(date && date >= range.start && date <= range.end)
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
  const attendance = attendanceAll.filter((row) => isRowInRange(row, range))

  const visibleWodHistory = wodHistory.filter((wod) => isVisiblePublishedWod(wod, now))
  const visibleWodIds = new Set(visibleWodHistory.map((wod) => String(wod.id || "")).filter(Boolean))
  const visibleWodResultsHistory = wodResultsHistory.filter((row) => visibleWodIds.has(String(row?.wod_id || "")))
  const participantLinks = await optionalQuery(
    "wod_resultado_participantes",
    () => fetchWodParticipantLinksByResultIds(visibleWodResultsHistory.map((row) => row.id)),
    diagnostics,
  )
  const wodParticipationHistory = expandWodResultsWithParticipants(visibleWodResultsHistory, participantLinks)
  const visibleWods = visibleWodHistory.filter((wod) => isRowInRange(wod, range))
  const wodResults = visibleWodResultsHistory.filter((row) => isRowInRange(row, range))
  const wodParticipationResults = wodParticipationHistory.filter((row) => isRowInRange(row, range))

  const activitySeries = buildActivitySeries({
    range,
    locale,
    wodResults: wodParticipationResults,
    prRecords,
    attendance,
  })

  const weekResults = visibleWodResultsHistory.filter((row) => {
    const date = parseLocalDate(row?.fecha || row?.created_at)
    return Boolean(date && date >= week.start && date <= week.end)
  })

  const wodWeekSeries = buildWodWeekSeries(weekResults, locale, now)
  const prMovementSeries = buildPrMovementSeries(prRecords, exercises, 5, locale)
  const highlightedAthletes = buildHighlightedAthletes({
    users: athletes,
    wodResults: wodParticipationResults,
    prRecords,
    attendance,
    limit: 5,
    locale,
  })

  const inactiveAthletes = buildInactiveAthletes({
    athletes,
    activeIds: membershipData.activeIds,
    recentWodResults: wodParticipationHistory,
    recentPrRecords: prAll,
    recentAttendance: attendanceAll,
    now,
    thresholdDays: 14,
  })

  const athleteStats = buildAthleteStatistics({
    athletes,
    memberships,
    nutritionProfiles,
    wodResults: wodParticipationResults,
    prRecords,
    attendance,
    recentWodResults: wodParticipationHistory,
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
    participationResults: wodParticipationResults,
    users: athletes,
    activeAthleteCount: membershipData.activeIds.size,
    activeAthleteIds: membershipData.activeIds,
    locale,
  })

  const wodParticipationRate = calculateWodParticipationRate({
    activeAthleteCount: membershipData.activeIds.size,
    activeAthleteIds: membershipData.activeIds,
    publishedWodCount: visibleWods.length,
    wodResults: wodParticipationResults,
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

  const [memberships, exercises, prRecords, ownedWodHistory, participantLinks, attendance, latestAttendance] = await Promise.all([
    optionalQuery("mensualidades_atleta", () => fetchMembershipsByAthlete(athleteId), diagnostics),
    optionalQuery("ejercicios", fetchExercises, diagnostics),
    optionalQuery("rm_atleta", () => fetchPrRecordsByAthlete(athleteId), diagnostics),
    optionalQuery("wod_resultados_propios_atleta", () => fetchOwnedWodResultsByAthlete(athleteId, range.endIso), diagnostics),
    optionalQuery("wod_participantes_atleta", () => fetchWodParticipantLinksByAthlete(athleteId), diagnostics),
    optionalQuery("asistencia_atleta", () => fetchAttendanceByAthlete(athleteId, range.startIso, range.endIso), diagnostics),
    optionalQuery("asistencia_ultima_atleta", () => fetchLatestAttendanceByAthlete(athleteId), diagnostics, null),
  ])

  const linkedResultIds = participantLinks.map((row) => row?.wod_resultado_id).filter(Boolean)
  const linkedWodHistory = await optionalQuery(
    "wod_resultados_equipo_atleta",
    () => fetchWodResultsByIds(linkedResultIds, range.endIso),
    diagnostics,
  )

  const athleteWodHistory = mergeAthleteWodParticipation(athleteId, ownedWodHistory, linkedWodHistory)
  const athleteWods = await optionalQuery(
    "wods_atleta",
    () => fetchWodsByIds(athleteWodHistory.map((row) => row?.wod_id)),
    diagnostics,
  )

  const visibleWodIds = new Set(
    athleteWods
      .filter((wod) => isVisiblePublishedWod(wod, now))
      .map((wod) => String(wod.id || ""))
      .filter(Boolean)
  )

  const visibleWodHistory = athleteWodHistory.filter((row) => visibleWodIds.has(String(row?.wod_id || "")))
  const wodResults = visibleWodHistory.filter((row) => isRowInRange(row, range))
  const latestWod = visibleWodHistory.length ? visibleWodHistory.at(-1) : null

  return buildAthleteDetail({
    athlete,
    memberships,
    exercises,
    prRecords,
    wodResults,
    totalWodCount: visibleWodHistory.length,
    latestWod,
    attendance,
    latestAttendance,
    range,
    locale,
    now,
    diagnostics,
  })
}
