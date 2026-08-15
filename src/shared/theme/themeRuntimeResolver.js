import { resolveScheduleEntry } from "./themeScheduleResolver.js"

export function resolveRuntimeThemeSelection({
  dateTimeKey,
  runtimeConfig,
  calendarEntries = [],
  availableThemeKeys = [],
  defaultThemeKey = "phoenix",
} = {}) {
  const allowed = new Set(
    Array.from(availableThemeKeys || [])
      .map(normalizeThemeKey)
      .filter(Boolean)
  )

  allowed.add(normalizeThemeKey(defaultThemeKey))

  const mode = String(runtimeConfig?.mode || "auto")
    .trim()
    .toLowerCase()

  const manualThemeKey = normalizeThemeKey(
    runtimeConfig?.manualThemeKey
  )

  if (
    mode === "manual" &&
    manualThemeKey &&
    allowed.has(manualThemeKey)
  ) {
    return {
      themeKey: manualThemeKey,
      source: "remote-manual",
      mode: "manual",
    }
  }

  const entry = resolveScheduleEntry({
    dateTimeKey,
    calendarEntries,
    allowedThemeKeys: allowed,
  })

  if (entry?.themeKey) {
    return {
      themeKey: normalizeThemeKey(entry.themeKey),
      source: "remote-calendar",
      mode: "auto",
      calendarEntry: entry,
    }
  }

  return {
    themeKey: normalizeThemeKey(defaultThemeKey),
    source: "remote-calendar-default",
    mode: "auto",
  }
}

function normalizeThemeKey(value) {
  return String(value || "").trim().toLowerCase()
}
