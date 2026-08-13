export function estimateWodCalories({
  nombre = "",
  descripcion = "",
  modoRanking = "sin_ranking",
  modalidad = "single",
  locale = "es",
}) {
  const text = `${nombre} ${descripcion}`.toLowerCase()
  const english = locale === "en"
  const isMurph = text.includes("murph")

  if (isMurph) {
    return {
      caloriasMin: 900,
      caloriasMax: 1400,
      intensidad: english ? "Extreme" : "Extrema",
      intensidadPuntos: 5,
      duracion: "70 - 100 min",
      cargaMetabolica: 94,
      cardio: 85,
      fuerza: 70,
      gimnasia: 78,
      intensidadScore: 95,
      nota: english
        ? "Local estimate based on a Hero WOD, running, high volume and gymnastics."
        : "Estimación local basada en Hero WOD, carrera, alto volumen y trabajo gimnástico.",
      tip: english
        ? "Plan hydration, mobility and pacing."
        : "Asegura hidratación, movilidad y estrategia de ritmo.",
      source: "local",
    }
  }

  let score = 30
  let cardio = 25
  let fuerza = 25
  let gimnasia = 18

  const add = (terms, scoreValue, cardioValue, strengthValue, gymnasticsValue = 0) => {
    if (terms.some((term) => text.includes(term))) {
      score += scoreValue
      cardio += cardioValue
      fuerza += strengthValue
      gimnasia += gymnasticsValue
    }
  }

  add(["run", "mile", "carrera", "correr"], 18, 28, 2)
  add(["row", "remo"], 14, 24, 5)
  add(["bike", "assault", "echo"], 15, 28, 4)
  add(["burpee"], 20, 22, 8, 8)
  add(["thruster"], 18, 14, 18)
  add(["wall ball", "wallball"], 14, 12, 14)
  add(["box jump"], 13, 16, 8, 7)
  add(["pull-up", "pull up", "pullup", "toes to bar", "t2b", "muscle up"], 14, 5, 18, 26)
  add(["push-up", "push up", "pushup", "handstand", "hspu"], 11, 4, 14, 22)
  add(["squat", "sentadilla"], 8, 6, 12)
  add(["deadlift", "clean", "snatch", "jerk"], 13, 8, 22)
  add(["double under", "du", "comba"], 12, 20, 3, 5)

  if (text.includes("amrap")) score += 12
  if (text.includes("emom")) score += 8
  if (text.includes("for time") || modoRanking === "menor_es_mejor") score += 14
  if (modalidad === "duo") score -= 6
  if (modalidad === "trio") score -= 10

  const duration = estimateDuration(text, score)
  const intensidadScore = clamp(score, 20, 96)
  const intensidad = getIntensityLabel(intensidadScore, locale)
  const basePerMin = intensidadScore >= 80 ? 13 : intensidadScore >= 60 ? 10 : intensidadScore >= 40 ? 8 : 6

  const caloriasMin = Math.round((duration.min * basePerMin * 0.8) / 10) * 10
  const caloriasMax = Math.max(
    Math.round((duration.max * basePerMin * 1.25) / 10) * 10,
    caloriasMin + 80
  )

  return {
    caloriasMin,
    caloriasMax,
    intensidad,
    intensidadPuntos: getIntensityPoints(intensidadScore),
    duracion: `${duration.min} - ${duration.max} min`,
    cargaMetabolica: clamp(Math.round((intensidadScore + cardio + fuerza) / 3), 18, 96),
    cardio: clamp(cardio, 15, 95),
    fuerza: clamp(fuerza, 15, 95),
    gimnasia: clamp(gimnasia, 10, 95),
    intensidadScore,
    nota: english
      ? "Local estimate based on exercise type, volume, duration and intensity."
      : "Estimación local basada en tipo de ejercicios, volumen, duración e intensidad.",
    tip: getTip(intensidadScore, locale),
    source: "local",
  }
}

function estimateDuration(text, score) {
  const explicitMin = text.match(/(\d+)\s*(min|mins|minute|minutes|'|’)/)
  if (explicitMin) {
    const value = Number(explicitMin[1])
    return { min: Math.max(8, value - 3), max: value + 8 }
  }

  if (text.includes("amrap")) return { min: 18, max: 28 }
  if (text.includes("emom")) return { min: 12, max: 24 }
  if (score > 85) return { min: 45, max: 75 }
  if (score > 70) return { min: 25, max: 45 }
  if (score > 55) return { min: 18, max: 32 }
  return { min: 12, max: 24 }
}

function getIntensityLabel(score, locale) {
  const english = locale === "en"
  if (score >= 85) return english ? "Extreme" : "Extrema"
  if (score >= 68) return english ? "High" : "Alta"
  if (score >= 48) return english ? "Medium" : "Media"
  return english ? "Moderate" : "Moderada"
}

function getIntensityPoints(score) {
  if (score >= 85) return 5
  if (score >= 68) return 4
  if (score >= 48) return 3
  if (score >= 30) return 2
  return 1
}

function getTip(score, locale) {
  const english = locale === "en"
  if (score >= 85) return english ? "Scale volume and define a pacing strategy." : "Escala el volumen y define una estrategia de ritmo."
  if (score >= 68) return english ? "Start controlled and avoid early redlining." : "Comienza controlado y evita agotarte al inicio."
  if (score >= 48) return english ? "Keep a steady pace and clean transitions." : "Mantén un ritmo constante y transiciones limpias."
  return english ? "Prioritize technique and consistent movement." : "Prioriza la técnica y el movimiento constante."
}

function clamp(value, min, max) {
  const number = Math.round(Number(value))
  if (!Number.isFinite(number)) return min
  return Math.max(min, Math.min(max, number))
}
