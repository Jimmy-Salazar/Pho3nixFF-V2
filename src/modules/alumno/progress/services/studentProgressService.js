import { supabase } from "../../../../config/supabase.js"

import {
  addDaysISO,
  buildBodyReference,
  calculateAge,
  calculateDaysRemaining,
  calculatePho3nixScore,
  getMostFrequentModality,
  rollingWindowStartISO,
  selectRelevantMembership,
  todayISO,
  validateNutritionProfile,
} from "../utils/studentProgressUtils.js"

const TABLES = {
  users: "usuarios",
  memberships: "mensualidades",
  nutritionProfile: "nutricion_perfil",
  nutritionMeasurements: "nutricion_mediciones",
  nutritionAnalysis: "nutricion_analisis",
  attendance: "asistencia",
  wodResults: "wod_resultados",
  wodParticipants: "wod_resultado_participantes",
  prs: "rm",
  exercises: "ejercicios",
}

const WOD_RESULT_SELECT = "id,wod_id,usuario_id,resultado,calorias_estimadas,fecha,modalidad,tiempo_segundos,tiempo_texto,repeticiones,created_at"
const ATHLETE_SELECT = "id,nombre,email,foto_url,sexo,fecha_nacimiento"
const NUTRITION_PROFILE_SELECT = "usuario_id,peso_kg,estatura_cm,cintura_cm,horas_sueno,nivel_energia,lesiones,observaciones,meta,updated_at"
const ANALYSIS_HISTORY_SELECT = "id,fecha_analisis,peso_kg,estatura_cm,imc,meta,score_pho3nix,score_formula_version,modalidad_frecuente,created_at"
const LATEST_ANALYSIS_SELECT = "id,usuario_id,fecha_analisis,proximo_analisis,meta,resumen,diagnostico,nutricion,entrenamiento,pre_wod,post_wod,hidratacion,descanso,alerta,respuesta_json,created_at"

function throwIfError(error) {
  if (error) throw new Error(error.message || "Supabase error")
}

async function fetchAthlete(userId, authProfile) {
  const { data, error } = await supabase
    .from(TABLES.users)
    .select(ATHLETE_SELECT)
    .eq("id", userId)
    .maybeSingle()

  throwIfError(error)

  const athlete = data || authProfile || { id: userId }
  return {
    ...athlete,
    id: athlete.id || userId,
    edad: calculateAge(athlete.fecha_nacimiento),
  }
}

async function fetchNutritionProfile(userId) {
  const { data, error } = await supabase
    .from(TABLES.nutritionProfile)
    .select(NUTRITION_PROFILE_SELECT)
    .eq("usuario_id", userId)
    .maybeSingle()

  throwIfError(error)
  return data || null
}

export async function fetchStudentMeasurementHistory(userId) {
  const { data, error } = await supabase
    .from(TABLES.nutritionMeasurements)
    .select("id,usuario_id,fecha_medicion,peso_kg,estatura_cm,cintura_cm,horas_sueno,nivel_energia,lesiones,observaciones,meta,created_at,updated_at")
    .eq("usuario_id", userId)
    .order("fecha_medicion", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(24)

  throwIfError(error)
  return data || []
}

async function fetchMembership(userId) {
  const { data, error } = await supabase
    .from(TABLES.memberships)
    .select("id,usuario_id,fecha_inicio,fecha_fin,estado,created_at")
    .eq("usuario_id", userId)
    .order("fecha_inicio", { ascending: false })
    .order("fecha_fin", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20)

  throwIfError(error)
  return selectRelevantMembership(data || [])
}

function uniqueWodParticipationRows(rows = []) {
  const resultIds = new Set()
  const wodIds = new Set()
  const unique = []

  for (const row of rows) {
    const resultId = String(row?.id || "")
    const wodId = String(row?.wod_id || "")
    if (!resultId || !wodId || resultIds.has(resultId) || wodIds.has(wodId)) continue

    resultIds.add(resultId)
    wodIds.add(wodId)
    unique.push(row)
  }

  return unique
}


export async function fetchWodSummary30Days(userId) {
  const fromDate = rollingWindowStartISO(30)
  const toDate = todayISO()

  const [directResponse, linkedResponse] = await Promise.all([
    supabase
      .from(TABLES.wodResults)
      .select(WOD_RESULT_SELECT)
      .eq("usuario_id", userId)
      .gte("fecha", fromDate)
      .lte("fecha", toDate)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false }),
    supabase.rpc("athlete_progress_group_wod_rows", {
      p_from_date: fromDate,
      p_to_date: toDate,
    }),
  ])

  throwIfError(directResponse.error)
  throwIfError(linkedResponse.error)

  const linkedRows = (linkedResponse.data || [])
    .map((item) => item?.row_data)
    .filter(Boolean)

  const rows = uniqueWodParticipationRows([
    ...(directResponse.data || []),
    ...linkedRows,
  ].sort((a, b) => {
    const dateCompare = String(b.fecha || "").localeCompare(String(a.fecha || ""))
    if (dateCompare !== 0) return dateCompare
    const createdCompare = String(b.created_at || "").localeCompare(String(a.created_at || ""))
    if (createdCompare !== 0) return createdCompare
    return String(b.id || "").localeCompare(String(a.id || ""))
  }))

  const calories30Days = rows.reduce(
    (sum, item) => sum + Number(item.calorias_estimadas || 0),
    0
  )
  const wodTrainingDates = [...new Set(rows.map((item) => item.fecha).filter(Boolean))]

  return {
    fromDate,
    toDate,
    rows,
    wodTrainingDates,
    wods30Days: rows.length,
    calories30Days,
    trainingDays30Days: wodTrainingDates.length,
    averageCalories: rows.length
      ? Number((calories30Days / rows.length).toFixed(2))
      : 0,
    frequentModality: getMostFrequentModality(rows),
  }
}

async function fetchAttendanceSummary30Days(userId) {
  const fromDate = rollingWindowStartISO(30)
  const toDate = todayISO()

  const { data, error } = await supabase
    .from(TABLES.attendance)
    .select("id,usuario_id,fecha,presente,created_at")
    .eq("usuario_id", userId)
    .eq("presente", true)
    .gte("fecha", fromDate)
    .lte("fecha", toDate)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })

  throwIfError(error)

  const rows = data || []
  const dates = [...new Set(rows.map((item) => item.fecha).filter(Boolean))]

  return {
    fromDate,
    toDate,
    rows,
    dates,
    attendanceDays30Days: dates.length,
  }
}

function mergeTrainingDays(wodSummary, attendanceSummary) {
  const dates = new Set([
    ...(wodSummary?.wodTrainingDates || []),
    ...(attendanceSummary?.dates || []),
  ])

  return {
    ...wodSummary,
    attendanceDays30Days: attendanceSummary?.attendanceDays30Days || 0,
    trainingDays30Days: dates.size,
    trainingDates: [...dates].sort().reverse(),
  }
}

export async function fetchPrSummary30Days(userId) {
  const fromDate = rollingWindowStartISO(30)
  const toDate = todayISO()

  const { data: rows, error } = await supabase
    .from(TABLES.prs)
    .select("id,usuario,ejercicio_id,peso_libras,fecha,created_at")
    .eq("usuario", userId)
    .gte("fecha", fromDate)
    .lte("fecha", toDate)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })

  throwIfError(error)

  const baseRows = rows || []
  const exerciseIds = [...new Set(baseRows.map((item) => item.ejercicio_id).filter(Boolean))]
  let exerciseMap = new Map()

  if (exerciseIds.length) {
    const { data: exercises, error: exerciseError } = await supabase
      .from(TABLES.exercises)
      .select("id,nombre")
      .in("id", exerciseIds)

    throwIfError(exerciseError)
    exerciseMap = new Map(
      (exercises || []).map((item) => [String(item.id), item.nombre])
    )
  }

  const hydratedRows = baseRows.map((item) => ({
    ...item,
    ejercicio_nombre: exerciseMap.get(String(item.ejercicio_id)) || "Exercise",
  }))

  return {
    fromDate,
    toDate,
    rows: hydratedRows,
    prs30Days: hydratedRows.length,
  }
}


async function fetchAnalysisHistory(userId) {
  const { data, error } = await supabase
    .from(TABLES.nutritionAnalysis)
    .select(ANALYSIS_HISTORY_SELECT)
    .eq("usuario_id", userId)
    .order("fecha_analisis", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(12)

  throwIfError(error)
  return data || []
}

async function fetchLatestAnalysis(userId) {
  const { data, error } = await supabase
    .from(TABLES.nutritionAnalysis)
    .select(LATEST_ANALYSIS_SELECT)
    .eq("usuario_id", userId)
    .order("fecha_analisis", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle()

  throwIfError(error)
  return data || null
}

export async function fetchStudentProgressBundle({ userId, authProfile }) {
  if (!userId) throw new Error("NO_AUTH_USER")

  const [
    athlete,
    nutritionProfile,
    measurementHistory,
    membership,
    baseWodSummary,
    attendanceSummary,
    prSummary,
    history,
    latestAnalysis,
  ] = await Promise.all([
    fetchAthlete(userId, authProfile),
    fetchNutritionProfile(userId),
    fetchStudentMeasurementHistory(userId),
    fetchMembership(userId),
    fetchWodSummary30Days(userId),
    fetchAttendanceSummary30Days(userId),
    fetchPrSummary30Days(userId),
    fetchAnalysisHistory(userId),
    fetchLatestAnalysis(userId),
  ])

  const wodSummary = mergeTrainingDays(baseWodSummary, attendanceSummary)
  const nextAnalysis = latestAnalysis?.proximo_analisis
    || (latestAnalysis?.fecha_analisis
      ? addDaysISO(latestAnalysis.fecha_analisis, 30)
      : null)
  const daysToAnalyze = nextAnalysis ? calculateDaysRemaining(nextAnalysis) : 0

  const hasActivityData = (
    wodSummary.wods30Days > 0
    || wodSummary.calories30Days > 0
    || wodSummary.trainingDays30Days > 0
    || prSummary.prs30Days > 0
  )
  const liveScore = hasActivityData
    ? calculatePho3nixScore({
      wods30Days: wodSummary.wods30Days,
      calories30Days: wodSummary.calories30Days,
      trainingDays30Days: wodSummary.trainingDays30Days,
      prs30Days: prSummary.prs30Days,
    })
    : null

  return {
    athlete,
    nutritionProfile,
    measurementHistory,
    membership,
    wodSummary,
    prSummary,
    history,
    latestAnalysis,
    nextAnalysis,
    daysToAnalyze,
    canAnalyze: !latestAnalysis || daysToAnalyze === 0,
    reference: buildBodyReference(nutritionProfile, athlete?.edad),
    liveScore,
    hasActivityData,
  }
}

export async function saveStudentNutritionProfile(userId, payload) {
  if (!userId) throw new Error("NO_AUTH_USER")
  const clean = validateNutritionProfile(payload)

  const { data, error } = await supabase
    .from(TABLES.nutritionProfile)
    .upsert({
      usuario_id: userId,
      peso_kg: clean.peso_kg,
      estatura_cm: clean.estatura_cm,
      meta: clean.meta,
      cintura_cm: clean.cintura_cm,
      horas_sueno: clean.horas_sueno,
      nivel_energia: clean.nivel_energia,
      lesiones: clean.lesiones,
      observaciones: clean.observaciones,
    }, { onConflict: "usuario_id" })
    .select(NUTRITION_PROFILE_SELECT)
    .single()

  throwIfError(error)
  return data
}

async function readFunctionError(error) {
  let message = error?.message || "AI function error"
  try {
    if (error?.context) {
      const body = await error.context.clone().json()
      message = body?.error || body?.message || body?.detalle?.error?.message || message
    }
  } catch {
    // Keep the original message.
  }
  return message
}

const ANALYSIS_TEXT_FIELDS = [
  "resumen",
  "diagnostico",
  "nutricion",
  "entrenamiento",
  "pre_wod",
  "post_wod",
  "hidratacion",
  "descanso",
  "alerta",
]

function normalizeLocale(locale) {
  return locale === "en" ? "en" : "es"
}

function extractAnalysisText(analysis) {
  if (!analysis) return null

  return Object.fromEntries(
    ANALYSIS_TEXT_FIELDS.map((field) => [field, String(analysis?.[field] || "")])
  )
}

function getStoredSourceLocale(analysis) {
  const responseJson = analysis?.respuesta_json || {}
  const explicitLocale = responseJson?.source_locale

  if (explicitLocale === "es" || explicitLocale === "en") {
    return explicitLocale
  }

  const payloadLanguage = String(
    responseJson?.payload_ia?.reglas?.idioma || ""
  ).toLowerCase()

  if (payloadLanguage.includes("english") || payloadLanguage.includes("inglés")) {
    return "en"
  }

  if (payloadLanguage.includes("spanish") || payloadLanguage.includes("español")) {
    return "es"
  }

  // Los análisis históricos de V1 se generaban en español.
  return "es"
}

function isCompleteTranslation(value) {
  return Boolean(
    value
      && typeof value === "object"
      && ANALYSIS_TEXT_FIELDS.every((field) => {
        const text = value[field]
        return typeof text === "string"
          && text.trim().length > 0
          && text.length <= 3000
      })
  )
}

export function getStoredLocalizedNutritionAnalysis(analysis, locale) {
  if (!analysis) return null

  const targetLocale = normalizeLocale(locale)
  const sourceLocale = getStoredSourceLocale(analysis)
  const cached = analysis?.respuesta_json?.translations?.[targetLocale]

  if (isCompleteTranslation(cached)) {
    return {
      ...analysis,
      ...cached,
      localized_locale: targetLocale,
    }
  }

  if (sourceLocale === targetLocale) {
    return {
      ...analysis,
      ...extractAnalysisText(analysis),
      localized_locale: targetLocale,
    }
  }

  return null
}

export async function localizeStudentNutritionAnalysis({ analysis, locale }) {
  if (!analysis) return null

  const targetLocale = normalizeLocale(locale)
  const stored = getStoredLocalizedNutritionAnalysis(analysis, targetLocale)

  if (stored) return stored
  if (!analysis?.id) return analysis

  const { data, error } = await supabase.functions.invoke(
    "traducir-analisis-nutricion",
    {
      body: {
        analysis_id: analysis.id,
        target_locale: targetLocale,
      },
    }
  )

  if (error) {
    throw new Error(await readFunctionError(error))
  }

  const translation = data?.translation

  if (!isCompleteTranslation(translation)) {
    throw new Error("INVALID_TRANSLATION_RESPONSE")
  }

  const sourceLocale = data?.source_locale || getStoredSourceLocale(analysis)
  const responseJson = analysis?.respuesta_json || {}

  return {
    ...analysis,
    ...translation,
    respuesta_json: {
      ...responseJson,
      source_locale: sourceLocale,
      translations: {
        ...(responseJson?.translations || {}),
        [targetLocale]: translation,
      },
    },
    localized_locale: targetLocale,
  }
}

export async function createStudentNutritionAnalysis({ locale = "es" } = {}) {
  const targetLocale = normalizeLocale(locale)

  const { data, error } = await supabase.functions.invoke(
    "analizar-nutricion-ia",
    {
      body: {
        locale: targetLocale,
      },
    }
  )

  if (error) {
    throw new Error(await readFunctionError(error))
  }

  const analysis = data?.analysis || data?.analisis
  if (!analysis?.id) {
    throw new Error("INVALID_AI_RESPONSE")
  }

  return analysis
}
