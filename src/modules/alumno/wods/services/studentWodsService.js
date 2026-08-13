import { supabase } from "../../../../config/supabase.js"

import {
  buildWeeklyCalories,
  addDaysISO,
  estimateWodCalories,
  formatDateISO,
  getCurrentWeekRange,
  getRegisterAvailability,
  getVisibleWodDateISO,
  getWodCaloriesValue,
  hasRegisteredResultValue,
  isWodVisible,
} from "../utils/studentWodsUtils.js"

const TABLES = {
  users: "usuarios",
  memberships: "mensualidades",
  wods: "wod",
  results: "wod_resultados",
}

const WOD_SELECT_FIELDS =
  "id,nombre,descripcion,modo_ranking,modalidad,fecha,activo,publicado,fecha_publicacion,calorias_min,calorias_max,calorias_nota,intensidad_estimada,duracion_estimada"

export const EMPTY_STUDENT_WODS = {
  profile: null,
  membership: null,
  todayWod: null,
  previousWods: [],
  currentWeekWods: [],
  archivedWods: [],
  dayHistory: [],
  recentResults: [],
  weeklyCalories: {
    total: 0,
    target: 6000,
    percent: 0,
    days: [],
  },
  estimatedCalories: {
    value: 0,
    min: 0,
    max: 0,
    source: "Local",
  },
}

export async function loadStudentWodsData({ authUser, authProfile }) {
  if (!authUser?.id) {
    throw new Error("No active session.")
  }

  const now = new Date()
  const visibleWodIso = getVisibleWodDateISO(now)
  const weekRange = getCurrentWeekRange(now)

  const [
    profile,
    membership,
    todayWod,
    previousWods,
    currentWeekWods,
    archivedWods,
  ] = await Promise.all([
    fetchProfile(authUser, authProfile),
    fetchMembership(authUser.id),
    fetchVisibleWod(visibleWodIso, now),
    fetchPreviousWods(visibleWodIso),
    fetchCurrentWeekWods(authUser.id, weekRange, now),
    fetchArchivedWods(authUser.id, weekRange),
  ])

  const [dayHistory, recentResults, weekResults] = await Promise.all([
    todayWod?.id ? safeQuery(() => fetchDayHistory(todayWod.id), []) : [],
    safeQuery(() => fetchRecentResults(authUser.id), []),
    safeQuery(() => fetchWeekResults(authUser.id, weekRange), []),
  ])

  const estimatedCalories = {
    ...estimateWodCalories(todayWod),
    value: getWodCaloriesValue(todayWod, estimateWodCalories(todayWod)?.value || 0),
  }

  return {
    profile,
    membership,
    todayWod,
    previousWods,
    currentWeekWods,
    archivedWods,
    dayHistory,
    recentResults,
    weeklyCalories: buildWeeklyCalories(weekResults, weekRange),
    estimatedCalories,
  }
}

async function fetchProfile(authUser, authProfile) {
  const { data, error } = await supabase
    .from(TABLES.users)
    .select("id,nombre,email,role,fecha_nacimiento,foto_url")
    .eq("id", authUser.id)
    .maybeSingle()

  if (error) throw error

  return data || authProfile || {
    id: authUser.id,
    nombre: authUser.email || "Atleta PHO3NIX",
    email: authUser.email,
    role: "alumno",
    foto_url: null,
  }
}

async function fetchMembership(userId) {
  const { data, error } = await supabase
    .from(TABLES.memberships)
    .select("id,usuario_id,fecha_inicio,fecha_fin,estado,created_at")
    .eq("usuario_id", userId)
    .order("fecha_fin", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)

  if (error) throw error
  return data?.[0] || null
}

async function fetchVisibleWod(visibleWodIso, now) {
  const { data, error } = await supabase
    .from(TABLES.wods)
    .select(WOD_SELECT_FIELDS)
    .eq("fecha", visibleWodIso)
    .eq("activo", true)
    .limit(5)

  if (error) throw error

  return (data || []).find((item) => {
    const itemDate = String(item.fecha || "").slice(0, 10)
    return itemDate === visibleWodIso && isWodVisible(item, now)
  }) || null
}

async function fetchPreviousWods(visibleWodIso) {
  const { data, error } = await supabase
    .from(TABLES.wods)
    .select(WOD_SELECT_FIELDS)
    .eq("activo", true)
    .lt("fecha", visibleWodIso)
    .order("fecha", { ascending: false })
    .limit(8)

  if (error) throw error
  return data || []
}

async function fetchCurrentWeekWods(userId, weekRange, now) {
  const saturdayIso = addDaysISO(weekRange.startIso, 5)

  const { data, error } = await supabase
    .from(TABLES.wods)
    .select(WOD_SELECT_FIELDS)
    .gte("fecha", weekRange.startIso)
    .lte("fecha", saturdayIso)
    .eq("activo", true)
    .order("fecha", { ascending: true })

  if (error) throw error

  const visibleWods = (data || []).filter((item) => isWodVisible(item, now))
  return attachUserResultsToWods(visibleWods, userId)
}

async function fetchArchivedWods(userId, weekRange) {
  const { data, error } = await supabase
    .from(TABLES.wods)
    .select(WOD_SELECT_FIELDS)
    .gte("fecha", "2026-06-01")
    .lt("fecha", weekRange.startIso)
    .eq("activo", true)
    .order("fecha", { ascending: false })
    .limit(120)

  if (error) throw error
  return attachUserResultsToWods(data || [], userId)
}

async function attachUserResultsToWods(wods = [], userId) {
  const safeWods = Array.isArray(wods) ? wods : []
  const wodIds = safeWods.map((item) => item.id).filter(Boolean)

  if (!userId || wodIds.length === 0) {
    return safeWods.map((wod) => buildWodListRow(wod, null))
  }

  const { data, error } = await supabase
    .from(TABLES.results)
    .select("id,wod_id,usuario_id,fecha,modalidad,tiempo_segundos,tiempo_texto,repeticiones,notas,observacion,resultado,calorias_estimadas,created_at")
    .eq("usuario_id", userId)
    .in("wod_id", wodIds)
    .order("created_at", { ascending: false })

  if (error) {
    console.warn("No se pudieron cargar resultados del atleta para WODs:", error)
    return safeWods.map((wod) => buildWodListRow(wod, null))
  }

  const resultMap = new Map()

  ;(data || []).forEach((result) => {
    if (!resultMap.has(result.wod_id)) {
      resultMap.set(result.wod_id, result)
    }
  })

  return safeWods.map((wod) => buildWodListRow(wod, resultMap.get(wod.id) || null))
}

function buildWodListRow(wod, result) {
  const maxCalories = getWodCaloriesValue(wod, result?.calorias_estimadas)

  return {
    id: `${wod?.id || "wod"}-${result?.id || "sin-resultado"}`,
    wod_id: wod?.id,
    wod,
    wod_nombre: wod?.nombre,
    wod_fecha: wod?.fecha,
    fecha: wod?.fecha,
    registered: !!result && hasRegisteredResultValue(result),
    result_id: result?.id || null,
    modalidad: result?.modalidad || null,
    tiempo_segundos: result?.tiempo_segundos || null,
    tiempo_texto: result?.tiempo_texto || null,
    repeticiones: result?.repeticiones || 0,
    notas: result?.notas || null,
    observacion: result?.observacion || null,
    resultado: result?.resultado ?? null,
    calorias_estimadas: maxCalories,
    created_at: result?.created_at || wod?.fecha,
  }
}

async function fetchDayHistory(wodId) {
  const { data, error } = await supabase
    .from(TABLES.results)
    .select(`
      *,
      usuarios (
        id,
        nombre,
        foto_url,
        sexo
      )
    `)
    .eq("wod_id", wodId)
    .order("tiempo_segundos", { ascending: true, nullsFirst: false })
    .order("repeticiones", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: true })

  if (error) throw error

  return (data || []).map((row) => ({
    ...row,
    nombre: row.usuarios?.nombre || row.nombre || "Atleta PHO3NIX",
    foto_url: row.usuarios?.foto_url || row.foto_url || null,
    sexo: row.usuarios?.sexo || row.sexo || null,
  }))
}

async function fetchRecentResults(userId) {
  const { data, error } = await supabase
    .from(TABLES.results)
    .select(`
      *,
      wod:wod_id (
        id,
        nombre,
        descripcion,
        fecha,
        modo_ranking,
        modalidad,
        calorias_max
      )
    `)
    .eq("usuario_id", userId)
    .order("created_at", { ascending: false })
    .limit(8)

  if (error) throw error

  return (data || [])
    .filter(hasRegisteredResultValue)
    .map((row) => ({
      ...row,
      wod_nombre: row.wod?.nombre,
      wod_fecha: row.wod?.fecha,
      fecha: row.fecha || row.wod?.fecha || row.created_at,
      calorias_estimadas: getWodCaloriesValue(row.wod, row.calorias_estimadas),
    }))
}

async function fetchWeekResults(userId, weekRange) {
  const { data, error } = await supabase
    .from(TABLES.results)
    .select(`
      *,
      wod:wod_id (
        id,
        nombre,
        descripcion,
        fecha,
        modo_ranking,
        modalidad,
        calorias_max
      )
    `)
    .eq("usuario_id", userId)
    .gte("fecha", weekRange.startIso)
    .lte("fecha", weekRange.endIso)
    .order("fecha", { ascending: true })

  if (error) throw error
  return data || []
}

async function fetchExistingResult({ wodId, userId }) {
  const { data, error } = await supabase
    .from(TABLES.results)
    .select("id,wod_id,usuario_id")
    .eq("wod_id", wodId)
    .eq("usuario_id", userId)
    .maybeSingle()

  if (error) throw error
  return data || null
}

export async function saveStudentWodResult({ wod, result, estimatedCalories }) {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError

  const authUser = authData?.user
  if (!authUser?.id) throw new Error("No active session.")
  if (!wod?.id) throw new Error("No se pudo identificar el WOD seleccionado para registrar resultado.")

  const availability = getRegisterAvailability(wod, new Date())
  if (!availability.canRegister) {
    throw new Error("Este WOD todavía no está disponible para registrar resultado.")
  }

  const existing = await fetchExistingResult({ wodId: wod.id, userId: authUser.id })
  if (existing?.id) {
    throw new Error("Ya registraste resultado para este WOD. Usa editar resultado.")
  }

  const payload = {
    wod_id: wod.id,
    usuario_id: authUser.id,
    fecha: wod.fecha || formatDateISO(new Date()),
    modalidad: result.modalidad || "RX",
    tiempo_segundos: result.tiempo_segundos || null,
    tiempo_texto: result.tiempo_texto || null,
    repeticiones: Number(result.repeticiones || 0),
    notas: result.notas || null,
    calorias_estimadas: getWodCaloriesValue(wod, estimatedCalories?.value || 0),
  }

  const { data, error } = await supabase
    .from(TABLES.results)
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateStudentWodResult({ resultId, wod, result, estimatedCalories }) {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError

  const authUser = authData?.user
  if (!authUser?.id) throw new Error("No active session.")
  if (!resultId) throw new Error("No result id.")

  const payload = {
    modalidad: result.modalidad || "RX",
    tiempo_segundos: result.tiempo_segundos || null,
    tiempo_texto: result.tiempo_texto || null,
    repeticiones: Number(result.repeticiones || 0),
    notas: result.notas || null,
    calorias_estimadas: getWodCaloriesValue(wod, estimatedCalories?.value || 0),
  }

  if (wod?.fecha) payload.fecha = wod.fecha

  const { data, error } = await supabase
    .from(TABLES.results)
    .update(payload)
    .eq("id", resultId)
    .eq("usuario_id", authUser.id)
    .select()
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error("Solo puedes editar tus propios resultados.")

  return data
}

async function safeQuery(queryFn, fallback) {
  try {
    return await queryFn()
  } catch (error) {
    console.warn("Optional WOD query skipped:", error)
    return fallback
  }
}


export async function fetchWodRanking(wodId) {
  if (!wodId) return []

  const { data, error } = await supabase
    .from(TABLES.results)
    .select(`
      *,
      usuarios (
        id,
        nombre,
        foto_url,
        sexo
      )
    `)
    .eq("wod_id", wodId)
    .order("created_at", { ascending: true })

  if (error) throw error

  return (data || [])
    .filter(hasRegisteredResultValue)
    .map((row) => ({
      ...row,
      nombre: row.usuarios?.nombre || row.nombre || "Atleta PHO3NIX",
      foto_url: row.usuarios?.foto_url || row.foto_url || null,
      sexo: row.usuarios?.sexo || row.sexo || null,
    }))
}
