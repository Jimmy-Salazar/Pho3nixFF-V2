// ============================================================
// PHO3NIX V2 · PDA Athlete utilities
// Production-safe utilities. No global development unlock.
// ============================================================

import {
  getPdaSeasonYear,
  getPdaTodayIso,
  isPdaResultDay,
  isPdaSeasonVisible as resolvePdaSeasonVisible,
} from "./pdaVisibility.js"

/*
 * Compatibility exports for code written during PDA development.
 * Production is permanently locked; preview is handled only through the
 * explicit DEV-only VITE_PDA_FORCE_VISIBLE switch in pdaVisibility.js.
 */
export const PDA_DEVELOPMENT_UNLOCK = false

export function isPdaDevelopmentUnlockEnabled() {
  return false
}

export function getPdaYear(date = new Date()) {
  return getPdaSeasonYear(date)
}

export function isPdaSeasonVisible(date = new Date()) {
  return resolvePdaSeasonVisible(date)
}

export function isPdaEditionAvailable(edition) {
  if (!edition?.id) return false
  return edition.publicada === true
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
    timeZone: "America/Guayaquil",
  })
    .format(date)
    .replace(".", "")
}

export function formatPdaResult(result, wod, copy) {
  if (!result) return copy.noResult

  if (
    ["dnf", "dns", "dq", "anulado"].includes(
      String(result.estado_resultado || "").toLowerCase()
    ) ||
    !result.completado
  ) {
    return String(result.estado_resultado || "DNF").toUpperCase()
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
  const today = getPdaTodayIso(now)
  const wodDate = String(wod?.fecha || "").slice(0, 10)

  if (result?.id) return "completed"
  if (!wodDate) return "draft"
  if (wodDate === today) return "today"
  if (wodDate > today) return "upcoming"
  return "past"
}

export function canRegisterPdaResult(wod, result, now = new Date()) {
  if (!wod?.id) return false

  if (
    ["dq", "anulado"].includes(
      String(result?.estado_resultado || "").toLowerCase()
    )
  ) {
    return false
  }

  return isPdaResultDay(wod.fecha, now)
}

export function getInitials(name) {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!words.length) return "PH"
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("")
}

export function getWodPublicationLabel(wod, copy) {
  if (wod?.publicado === true && wod?.activo === true) return copy.published
  if (wod?.publicado === true) return copy.programmed
  return copy.draft
}
