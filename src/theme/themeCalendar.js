import { normalizeThemeMomentKey } from "../shared/theme/themeScheduleResolver.js"

export {
  LOCAL_THEME_CALENDAR,
  resolveLocalScheduledTheme,
  resolveLocalScheduledThemeKey,
} from "../shared/theme/themeCalendar.js"

const THEME_DATE_PREVIEW_KEY = "phoenix:v2:theme-date-preview"

/* Returns YYYY-MM-DDTHH:mm in the requested IANA time zone. */
export function getDateTimeKeyInTimeZone(
  date = new Date(),
  timeZone = "America/Guayaquil"
) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date)

    const values = {}

    for (const part of parts) {
      if (part.type !== "literal") {
        values[part.type] = part.value
      }
    }

    return (
      `${values.year}-${values.month}-${values.day}` +
      `T${values.hour}:${values.minute}`
    )
  } catch {
    return date.toISOString().slice(0, 16)
  }
}

/* DEV-only date/time simulation. Production always uses real time. */
export function getEffectiveThemeDateKey(realDateTimeKey) {
  if (!import.meta.env.DEV) {
    return normalizeThemeMomentKey(realDateTimeKey)
  }

  const urlPreview = readDevelopmentThemeDateKeyFromUrl()
  if (urlPreview) return normalizeThemeMomentKey(urlPreview)

  const storedPreview = readDevelopmentThemeDateKey()
  if (storedPreview) return normalizeThemeMomentKey(storedPreview)

  return normalizeThemeMomentKey(realDateTimeKey)
}

export function readDevelopmentThemeDateKeyFromUrl() {
  if (!import.meta.env.DEV) return ""
  if (typeof window === "undefined") return ""

  try {
    const params = new URLSearchParams(window.location.search)
    const value = String(params.get("themeDate") || "").trim()
    return isValidPreviewMoment(value) ? value : ""
  } catch {
    return ""
  }
}

export function readDevelopmentThemeDateKey() {
  if (!import.meta.env.DEV) return ""
  if (typeof window === "undefined") return ""

  try {
    const value = String(
      window.localStorage.getItem(THEME_DATE_PREVIEW_KEY) || ""
    ).trim()
    return isValidPreviewMoment(value) ? value : ""
  } catch {
    return ""
  }
}

export function setDevelopmentThemeDateKey(value) {
  if (!import.meta.env.DEV) return false
  if (typeof window === "undefined") return false

  const moment = String(value || "").trim()
  if (!isValidPreviewMoment(moment)) return false

  try {
    window.localStorage.setItem(THEME_DATE_PREVIEW_KEY, moment)
    return true
  } catch {
    return false
  }
}

export function clearDevelopmentThemeDateKey() {
  if (!import.meta.env.DEV) return false
  if (typeof window === "undefined") return false

  try {
    window.localStorage.removeItem(THEME_DATE_PREVIEW_KEY)
    return true
  } catch {
    return false
  }
}

function isValidPreviewMoment(value) {
  return Boolean(normalizeThemeMomentKey(value))
}

