import { supabase } from "../../../../config/supabase.js"
import { estimateWodCalories } from "../utils/estimateCalories.js"

export async function estimateWodWithAi({
  nombre,
  descripcion,
  modalidad,
  modoRanking,
  locale = "es",
}) {
  try {
    const { data, error } = await supabase.functions.invoke("estimate-wod-calories", {
      body: {
        nombre,
        descripcion,
        modalidad,
        modo_ranking: modoRanking,
        locale,
      },
    })

    if (error) throw error
    if (!data?.ok) throw new Error(data?.error || "AI estimate unavailable")

    return normalizeAiEstimate(data.estimate, locale)
  } catch (error) {
    console.warn("WOD AI unavailable; using local estimate:", error)

    const local = estimateWodCalories({
      nombre,
      descripcion,
      modalidad,
      modoRanking,
      locale,
    })

    return {
      ...local,
      fallback: true,
      source: "local",
    }
  }
}

function normalizeAiEstimate(input, locale) {
  const intensityScore = clamp(input?.intensidad_score, 0, 100)
  const english = locale === "en"

  return {
    caloriasMin: clamp(input?.calorias_min, 80, 2500),
    caloriasMax: clamp(input?.calorias_max, 120, 3000),
    intensidad: input?.intensidad_estimada || (english ? "Medium" : "Media"),
    duracion: input?.duracion_estimada || "15 - 30 min",
    cargaMetabolica: clamp(input?.carga_metabolica, 0, 100),
    cardio: clamp(input?.cardio, 0, 100),
    fuerza: clamp(input?.fuerza, 0, 100),
    gimnasia: clamp(input?.gimnasia ?? input?.gymnastics, 0, 100),
    intensidadScore: intensityScore,
    intensidadPuntos: getIntensityPoints(intensityScore),
    nota:
      input?.calorias_nota ||
      (english
        ? "AI estimate based on movement, duration, volume and intensity."
        : "Estimación IA basada en movimientos, duración, volumen e intensidad."),
    tip:
      input?.tip ||
      (english
        ? "Use this value as an approximate reference."
        : "Usa esta cifra como referencia aproximada."),
    fallback: false,
    source: "gemini",
  }
}

function getIntensityPoints(score) {
  if (score >= 85) return 5
  if (score >= 68) return 4
  if (score >= 48) return 3
  if (score >= 30) return 2
  return 1
}

function clamp(value, min, max) {
  const number = Math.round(Number(value))
  if (!Number.isFinite(number)) return min
  return Math.max(min, Math.min(max, number))
}
