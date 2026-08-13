// ============================================================
// PHO3NIX V2 · PDA Athlete utilities
// ============================================================

// TEMPORARY DEVELOPMENT SWITCH.
// While true, the athlete PDA can be developed outside December and
// without requiring pda_ediciones.estado = "activa".
// IMPORTANT: set to false when the PDA module is finished and remove
// the *_dev_* policies using PHO3NIX_PDA_DEV_LOCK_RESTORE.sql.
export const PDA_DEVELOPMENT_UNLOCK = true

export function isPdaDevelopmentUnlockEnabled() {
  return PDA_DEVELOPMENT_UNLOCK
}

export function getPdaYear(date = new Date()) {
  return date.getFullYear()
}

export function isPdaSeasonVisible(date = new Date()) {
  if (PDA_DEVELOPMENT_UNLOCK) return true

  const month = date.getMonth()
  const day = date.getDate()

  // Final production rule: November 15 through December 31.
  if (month === 10) return day >= 15
  return month === 11
}

export function isPdaEditionAvailable(edition) {
  if (!edition?.id) return false
  if (PDA_DEVELOPMENT_UNLOCK) return true
  return edition.publicada === true && String(edition.estado || "").toLowerCase() === "activa"
}

export function formatPdaDate(value, locale = "es") {
  if (!value) return locale === "en" ? "No date" : "Sin fecha"

  const raw = String(value)
  const date = raw.includes("T")
    ? new Date(raw)
    : new Date(`${raw.slice(0, 10)}T12:00:00`)

  if (Number.isNaN(date.getTime())) return raw

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  })
    .format(date)
    .replace(".", "")
}

export function formatPdaResult(result, wod, copy) {
  if (!result) return copy.noResult

  if (result.estado_resultado === "dnf" || !result.completado) {
    return "DNF"
  }

  if (wod?.tipo_resultado === "tiempo") {
    if (result.tiempo_texto) return result.tiempo_texto
    return formatSeconds(result.tiempo_segundos)
  }

  if (wod?.tipo_resultado === "repeticiones") {
    return `${Number(result.repeticiones || 0)} ${copy.repsShort}`
  }

  return copy.noResult
}

export function formatSeconds(seconds) {
  const value = Number(seconds || 0)
  if (!value) return "--:--"

  const hours = Math.floor(value / 3600)
  const minutes = Math.floor((value % 3600) / 60)
  const rest = value % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`
  }

  return `${minutes}:${String(rest).padStart(2, "0")}`
}

export function parseTimeToSeconds(value) {
  const text = String(value || "").trim()
  if (!text) return null

  const parts = text.split(":").map(Number)
  if (parts.some((part) => Number.isNaN(part) || part < 0)) return null

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

export function getPdaWodStatus(wod, result, now = new Date()) {
  const today = formatLocalIso(now)
  const wodDate = String(wod?.fecha || "").slice(0, 10)

  if (result?.id) return "completed"
  if (!wodDate) return "draft"
  if (wodDate === today) return "today"
  if (wodDate > today) return "upcoming"
  return "past"
}

export function canRegisterPdaResult(wod, result, now = new Date()) {
  if (!wod?.id) return false
  if (result?.estado_resultado === "dq" || result?.estado_resultado === "anulado") return false

  // Development unlock lets us exercise the same result form now,
  // even though the official PDA dates are in December.
  if (PDA_DEVELOPMENT_UNLOCK) return true

  if (!wod?.fecha) return false
  return String(wod.fecha).slice(0, 10) === formatLocalIso(now)
}

export function getInitials(name) {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!words.length) return "PH"
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("")
}

export function getWodPublicationLabel(wod, copy) {
  if (wod?.publicado === true && wod?.activo === true) return copy.published
  if (wod?.publicado === true) return copy.programmed
  return copy.draft
}

function formatLocalIso(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
