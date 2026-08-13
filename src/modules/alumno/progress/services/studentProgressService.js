import { supabase } from "../../../../config/supabase.js"

import {
  addDaysISO,
  buildBodyReference,
  calculateAge,
  calculateDaysRemaining,
  calculatePho3nixScore,
  dateDaysAgo,
  getMostFrequentModality,
  todayISO,
  validateNutritionProfile,
} from "../utils/studentProgressUtils.js"

const TABLES = {
  users: "usuarios",
  memberships: "mensualidades",
  nutritionProfile: "nutricion_perfil",
  nutritionAnalysis: "nutricion_analisis",
  wodResults: "wod_resultados",
  prs: "rm",
  exercises: "ejercicios",
}

function throwIfError(error) {
  if (error) throw new Error(error.message || "Supabase error")
}

async function fetchAthlete(userId, authProfile) {
  const { data, error } = await supabase
    .from(TABLES.users)
    .select("*")
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
    .select("*")
    .eq("usuario_id", userId)
    .maybeSingle()

  throwIfError(error)
  return data || null
}

async function fetchMembership(userId) {
  const { data, error } = await supabase
    .from(TABLES.memberships)
    .select("id,usuario_id,fecha_inicio,fecha_fin,estado,created_at")
    .eq("usuario_id", userId)
    .order("fecha_fin", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)

  throwIfError(error)
  return data?.[0] || null
}

export async function fetchWodSummary30Days(userId) {
  const fromDate = dateDaysAgo(30)
  const { data, error } = await supabase
    .from(TABLES.wodResults)
    .select("id,wod_id,usuario_id,resultado,calorias_estimadas,fecha,modalidad,tiempo_segundos,tiempo_texto,repeticiones,notas,created_at")
    .eq("usuario_id", userId)
    .gte("fecha", fromDate)
    .order("fecha", { ascending: false })

  throwIfError(error)

  const rows = data || []
  const calories30Days = rows.reduce((sum, item) => sum + Number(item.calorias_estimadas || 0), 0)
  const trainingDays30Days = new Set(rows.map((item) => item.fecha).filter(Boolean)).size

  return {
    fromDate,
    rows,
    wods30Days: rows.length,
    calories30Days,
    trainingDays30Days,
    averageCalories: rows.length ? Number((calories30Days / rows.length).toFixed(2)) : 0,
    frequentModality: getMostFrequentModality(rows),
  }
}

export async function fetchPrSummary30Days(userId) {
  const fromDate = dateDaysAgo(30)

  const { data: rows, error } = await supabase
    .from(TABLES.prs)
    .select("id,usuario,ejercicio_id,peso_libras,fecha,created_at")
    .eq("usuario", userId)
    .gte("fecha", fromDate)
    .order("fecha", { ascending: false })

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
    exerciseMap = new Map((exercises || []).map((item) => [String(item.id), item.nombre]))
  }

  const hydratedRows = baseRows.map((item) => ({
    ...item,
    ejercicio_nombre: exerciseMap.get(String(item.ejercicio_id)) || "Exercise",
  }))

  return {
    fromDate,
    rows: hydratedRows,
    prs30Days: hydratedRows.length,
  }
}

async function fetchAnalysisHistory(userId) {
  const { data, error } = await supabase
    .from(TABLES.nutritionAnalysis)
    .select("*")
    .eq("usuario_id", userId)
    .order("fecha_analisis", { ascending: false })
    .limit(12)

  throwIfError(error)
  return data || []
}

export async function fetchStudentProgressBundle({ userId, authProfile }) {
  if (!userId) throw new Error("NO_AUTH_USER")

  const [athlete, nutritionProfile, membership, wodSummary, prSummary, history] = await Promise.all([
    fetchAthlete(userId, authProfile),
    fetchNutritionProfile(userId),
    fetchMembership(userId),
    fetchWodSummary30Days(userId),
    fetchPrSummary30Days(userId),
    fetchAnalysisHistory(userId),
  ])

  const latestAnalysis = history[0] || null
  const nextAnalysis = latestAnalysis?.proximo_analisis
    || (latestAnalysis?.fecha_analisis ? addDaysISO(latestAnalysis.fecha_analisis, 30) : null)
  const daysToAnalyze = nextAnalysis ? calculateDaysRemaining(nextAnalysis) : 0

  return {
    athlete,
    nutritionProfile,
    membership,
    wodSummary,
    prSummary,
    history,
    latestAnalysis,
    nextAnalysis,
    daysToAnalyze,
    canAnalyze: !latestAnalysis || daysToAnalyze === 0,
    reference: buildBodyReference(nutritionProfile),
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
    }, { onConflict: "usuario_id" })
    .select()
    .single()

  throwIfError(error)
  return data
}

function cleanWodRows(rows = []) {
  return rows.slice(0, 30).map((item) => ({
    id: item.id,
    wod_id: item.wod_id,
    resultado: item.resultado,
    calorias_estimadas: item.calorias_estimadas,
    fecha: item.fecha,
    modalidad: item.modalidad,
    tiempo_segundos: item.tiempo_segundos,
    tiempo_texto: item.tiempo_texto,
    repeticiones: item.repeticiones,
    notas: item.notas,
  }))
}

function cleanPrRows(rows = []) {
  return rows.slice(0, 20).map((item) => ({
    id: item.id,
    ejercicio_id: item.ejercicio_id,
    ejercicio_nombre: item.ejercicio_nombre,
    peso_libras: item.peso_libras,
    fecha: item.fecha,
  }))
}

function cleanHistory(rows = []) {
  return rows.slice(0, 3).map((item) => ({
    fecha_analisis: item.fecha_analisis,
    peso_kg: item.peso_kg,
    estatura_cm: item.estatura_cm,
    imc: item.imc,
    meta: item.meta,
    wods_30_dias: item.wods_30_dias,
    calorias_30_dias: item.calorias_30_dias,
    dias_entrenados_30_dias: item.dias_entrenados_30_dias,
    prs_30_dias: item.prs_30_dias,
    score_pho3nix: item.score_pho3nix,
    resumen: item.resumen,
    diagnostico: item.diagnostico,
  }))
}

function normalizeAiAnalysis(response, locale) {
  const analysis = response?.analisis || response
  if (!analysis || typeof analysis !== "object") throw new Error("INVALID_AI_RESPONSE")

  return {
    resumen: analysis.resumen || "",
    diagnostico: analysis.diagnostico || "",
    nutricion: analysis.nutricion || "",
    entrenamiento: analysis.entrenamiento || "",
    pre_wod: analysis.pre_wod || "",
    post_wod: analysis.post_wod || "",
    hidratacion: analysis.hidratacion || "",
    descanso: analysis.descanso || "",
    alerta: analysis.alerta || (
      locale === "en"
        ? "This analysis is for guidance and does not replace medical or professional nutrition advice."
        : "Este análisis es orientativo y no reemplaza consulta médica o nutricional profesional."
    ),
  }
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
      && ANALYSIS_TEXT_FIELDS.every((field) => typeof value[field] === "string")
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

  return {
    ...analysis,
    ...translation,
    respuesta_json: data?.respuesta_json || analysis.respuesta_json,
    localized_locale: targetLocale,
  }
}

export async function createStudentNutritionAnalysis({ athlete, profile, locale = "es" }) {
  if (!athlete?.id) throw new Error("NO_AUTH_USER")
  const cleanProfile = validateNutritionProfile(profile)

  const [wodSummary, prSummary, history] = await Promise.all([
    fetchWodSummary30Days(athlete.id),
    fetchPrSummary30Days(athlete.id),
    fetchAnalysisHistory(athlete.id),
  ])

  const latest = history[0] || null
  if (latest) {
    const next = latest.proximo_analisis || addDaysISO(latest.fecha_analisis, 30)
    const remaining = calculateDaysRemaining(next)
    if (remaining > 0) throw new Error(`ANALYSIS_LOCKED:${remaining}`)
  }

  const reference = buildBodyReference(cleanProfile)
  const summary = {
    wods30Days: wodSummary.wods30Days,
    calories30Days: wodSummary.calories30Days,
    trainingDays30Days: wodSummary.trainingDays30Days,
    prs30Days: prSummary.prs30Days,
  }
  const score = calculatePho3nixScore(summary)

  const goalLabels = {
    es: {
      perder_grasa: "Perder grasa",
      recomposicion: "Mantener / recomposición corporal",
      ganar_masa_muscular: "Ganar masa muscular",
      mejorar_rendimiento: "Mejorar rendimiento deportivo",
    },
    en: {
      perder_grasa: "Lose fat",
      recomposicion: "Body recomposition",
      ganar_masa_muscular: "Gain muscle",
      mejorar_rendimiento: "Improve athletic performance",
    },
  }

  const payload = {
    usuario: {
      id: athlete.id,
      nombre: athlete.nombre,
      edad: athlete.edad,
      sexo: athlete.sexo || null,
    },
    perfil_nutricional: {
      peso_kg: cleanProfile.peso_kg,
      estatura_cm: cleanProfile.estatura_cm,
      meta: cleanProfile.meta,
      meta_label: goalLabels[locale]?.[cleanProfile.meta] || goalLabels.es[cleanProfile.meta],
    },
    referencia_corporal: {
      imc: reference.bmi ? Number(reference.bmi.toFixed(2)) : null,
      peso_referencia_min: reference.minWeight ? Number(reference.minWeight.toFixed(2)) : null,
      peso_referencia_max: reference.maxWeight ? Number(reference.maxWeight.toFixed(2)) : null,
      diferencia_rango: reference.rangeDifference !== null
        ? Number(reference.rangeDifference.toFixed(2))
        : null,
      nota: locale === "en"
        ? "The healthy range is a BMI-based reference. For strength and CrossFit athletes, assess it together with performance, muscle mass, attendance and evolution."
        : "El rango saludable es una referencia basada en IMC. En atletas de fuerza o CrossFit debe analizarse junto con rendimiento, masa muscular, asistencia y evolución.",
    },
    rendimiento_30_dias: {
      wods_30_dias: wodSummary.wods30Days,
      calorias_30_dias: wodSummary.calories30Days,
      dias_entrenados_30_dias: wodSummary.trainingDays30Days,
      prs_30_dias: prSummary.prs30Days,
      promedio_calorias: wodSummary.averageCalories,
      mejor_modalidad: wodSummary.frequentModality,
      resultados_wods: cleanWodRows(wodSummary.rows),
      prs: cleanPrRows(prSummary.rows),
    },
    historial_analisis: cleanHistory(history),
    reglas: {
      analisis_cada_dias: 30,
      enfoque: "sports nutrition and CrossFit-style functional training",
      idioma: locale === "en" ? "English" : "Spanish",
      tono: locale === "en"
        ? "clear, motivating, professional and practical"
        : "claro, motivador, profesional y práctico",
      seguridad: [
        "Do not diagnose diseases.",
        "Do not replace medical or professional nutrition advice.",
        "Do not recommend medication, fat burners, steroids, hormones or prohibited substances.",
        "Do not recommend extreme diets.",
        "Recommend professional evaluation when risk signs are present.",
      ],
      formato_respuesta: {
        resumen: "string",
        diagnostico: "string",
        nutricion: "string",
        entrenamiento: "string",
        pre_wod: "string",
        post_wod: "string",
        hidratacion: "string",
        descanso: "string",
        alerta: "string",
      },
    },
  }

  const { data: response, error: functionError } = await supabase.functions.invoke(
    "analizar-nutricion-ia",
    { body: payload }
  )

  if (functionError) throw new Error(await readFunctionError(functionError))

  const analysis = normalizeAiAnalysis(response, locale)
  const analysisDate = todayISO()

  const insertPayload = {
    usuario_id: athlete.id,
    fecha_analisis: analysisDate,
    proximo_analisis: addDaysISO(analysisDate, 30),
    edad: athlete.edad,
    sexo: athlete.sexo || null,
    peso_kg: cleanProfile.peso_kg,
    estatura_cm: cleanProfile.estatura_cm,
    imc: reference.bmi ? Number(reference.bmi.toFixed(2)) : null,
    peso_referencia_min: reference.minWeight ? Number(reference.minWeight.toFixed(2)) : null,
    peso_referencia_max: reference.maxWeight ? Number(reference.maxWeight.toFixed(2)) : null,
    diferencia_rango: reference.rangeDifference !== null
      ? Number(reference.rangeDifference.toFixed(2))
      : null,
    meta: cleanProfile.meta,
    wods_30_dias: wodSummary.wods30Days,
    calorias_30_dias: wodSummary.calories30Days,
    dias_entrenados_30_dias: wodSummary.trainingDays30Days,
    prs_30_dias: prSummary.prs30Days,
    promedio_calorias: wodSummary.averageCalories,
    mejor_modalidad: wodSummary.frequentModality,
    score_pho3nix: score,
    resumen: analysis.resumen,
    diagnostico: analysis.diagnostico,
    nutricion: analysis.nutricion,
    entrenamiento: analysis.entrenamiento,
    pre_wod: analysis.pre_wod,
    post_wod: analysis.post_wod,
    hidratacion: analysis.hidratacion,
    descanso: analysis.descanso,
    alerta: analysis.alerta,
    respuesta_json: {
      source_locale: locale === "en" ? "en" : "es",
      translations: {
        [locale === "en" ? "en" : "es"]: analysis,
      },
      payload_ia: payload,
      respuesta_ia: analysis,
    },
  }

  const { data, error } = await supabase
    .from(TABLES.nutritionAnalysis)
    .insert(insertPayload)
    .select()
    .single()

  throwIfError(error)
  return data
}
