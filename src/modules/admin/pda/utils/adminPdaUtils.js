export function formatDateISO(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(value.getTime())) return ""
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function parseTimeToSeconds(value) {
  const text = String(value || "").trim()
  if (!text) return null

  if (/^\d+$/.test(text)) return Number(text)

  const parts = text.split(":").map(Number)
  if (parts.some((part) => !Number.isFinite(part) || part < 0)) return null

  if (parts.length === 2) {
    const [minutes, seconds] = parts
    if (seconds >= 60) return null
    return minutes * 60 + seconds
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts
    if (minutes >= 60 || seconds >= 60) return null
    return hours * 3600 + minutes * 60 + seconds
  }

  return null
}

export function formatSeconds(value) {
  const secondsValue = Number(value)
  if (!Number.isFinite(secondsValue) || secondsValue <= 0) return "—"
  const hours = Math.floor(secondsValue / 3600)
  const minutes = Math.floor((secondsValue % 3600) / 60)
  const seconds = Math.floor(secondsValue % 60)

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

export function getEditionStatusLabel(edition, copy) {
  if (!edition) return "—"
  if (edition.estado === "cerrada") return copy.closed
  if (edition.estado === "activa") return copy.active
  return copy.draft
}

export function getResultTypeLabel(wod, copy) {
  if (wod?.tipo_resultado === "tiempo") return copy.time
  if (wod?.tipo_resultado === "carga") return copy.load
  return copy.repetitions
}

export function getRankingModeLabel(wod, copy) {
  if (wod?.tipo_resultado === "tiempo") return copy.lessTimeWins
  if (wod?.tipo_resultado === "carga") return copy.moreLoadWins
  return copy.moreRepsWins
}

export function getModalityLabel(value, copy) {
  if (value === "duo") return copy.duo
  if (value === "trio") return copy.trio
  return copy.single
}


export function inferPdaWodType({ description = "", resultType = "", estimate = {} } = {}) {
  const text = normalizePdaText(description)

  const weightliftingTerms = [
    "snatch", "clean", "jerk", "clean and jerk", "clean & jerk",
    "arranque", "envion", "envión", "halterofilia", "olympic lift",
  ]
  const gymnasticsTerms = [
    "pull-up", "pull up", "muscle-up", "muscle up", "toes-to-bar",
    "toes to bar", "handstand", "hspu", "ring dip", "rope climb",
    "pistol", "dominada", "fondos en anillas", "subida de cuerda",
  ]

  if (weightliftingTerms.some((term) => text.includes(normalizePdaText(term)))) {
    return "weightlifting"
  }

  if (gymnasticsTerms.some((term) => text.includes(normalizePdaText(term)))) {
    return "gymnastics"
  }

  if (resultType === "carga") return "strength"

  const cardio = Number(estimate?.cardio || 0)
  const strength = Number(estimate?.fuerza || 0)

  if (cardio >= 68 && strength <= 52) return "cardio"
  if (strength >= 68 && cardio <= 52) return "strength"
  if (cardio >= 55 && strength >= 55) return "mixed"

  return "metcon"
}

export function getPdaWodTypeLabel(value, copy) {
  const normalized = String(value || "").trim().toLowerCase()
  if (!normalized) return "—"
  if (normalized === "cardio") return copy.cardio
  if (normalized === "strength" || normalized === "fuerza") return copy.strength
  if (normalized === "weightlifting" || normalized === "halterofilia") return copy.weightlifting
  if (normalized === "gymnastics" || normalized === "gimnasia") return copy.gymnastics
  if (normalized === "mixed" || normalized === "mixto") return copy.mixed
  if (normalized === "metcon") return copy.metcon
  return value
}

function normalizePdaText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

export function buildPdaSummary({ wods = [], athletes = [], results = [] }) {
  return {
    totalWods: wods.length,
    publishedWods: wods.filter((row) => row.publicado).length,
    activeAthletes: athletes.length,
    completedResults: results.filter(
      (row) => row.estado_resultado === "valido" && row.completado === true
    ).length,
  }
}

export function getResultMark(result, wod) {
  if (!result) return "—"
  if (result.estado_resultado === "dns") return "DNS"
  if (result.estado_resultado === "dq") return "DQ"
  if (result.estado_resultado === "anulado") return "ANULADO"

  if (wod?.tipo_resultado === "tiempo") {
    if (result.completado) return result.tiempo_texto || formatSeconds(result.tiempo_segundos)
    return `TC · ${Number(result.repeticiones || 0)} reps`
  }

  if (wod?.tipo_resultado === "carga") {
    return `${Number(result.carga_libras || 0).toLocaleString("es-EC")} lb`
  }

  return `${Number(result.repeticiones || 0).toLocaleString("es-EC")} reps`
}

export function sortWods(rows = []) {
  return [...rows].sort((a, b) => Number(a.numero || 0) - Number(b.numero || 0))
}


export function getDefaultEditionDates(year = new Date().getFullYear()) {
  return {
    fecha_inicio: `${year}-12-01`,
    fecha_fin: `${year}-12-31`,
  }
}

export function mapPdaError(error, copy) {
  const message = String(error?.message || "")

  if (message.includes("PDA_REQUIRES_10_TO_15_WODS")) return copy.requiresWods
  if (message.includes("PDA_WOD_DATE_OUTSIDE_EDITION")) return copy.dateOutsideEdition
  if (message.includes("PDA_WOD_DATE_REQUIRED")) return copy.wodDateRequired
  if (message.includes("PDA_TIME_REQUIRED")) return copy.timeRequired
  if (message.includes("PDA_REPS_REQUIRED")) return copy.repsRequired
  if (message.includes("PDA_LOAD_REQUIRED")) return copy.loadRequired
  if (message.includes("duplicate key") && message.includes("pda_ediciones")) {
    return copy.operationError
  }

  return error?.message || copy.operationError
}
