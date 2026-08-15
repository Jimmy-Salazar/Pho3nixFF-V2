export const DEFAULT_APP_TIME_ZONE = "America/Guayaquil"

export function getAppTimeZone() {
  const configuredTimeZone = String(import.meta.env?.VITE_APP_TIME_ZONE || "").trim()

  if (configuredTimeZone.toLowerCase() === "device") {
    return getUserTimeZone()
  }

  if (configuredTimeZone && isValidTimeZone(configuredTimeZone)) {
    return configuredTimeZone
  }

  return DEFAULT_APP_TIME_ZONE
}

export function getUserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_APP_TIME_ZONE
  } catch {
    return DEFAULT_APP_TIME_ZONE
  }
}

export function getDateKeyInTimeZone(date = new Date(), timeZone = getAppTimeZone()) {
  const safeDate = date instanceof Date ? date : new Date(date)
  const safeTimeZone = isValidTimeZone(timeZone) ? timeZone : DEFAULT_APP_TIME_ZONE

  if (Number.isNaN(safeDate.getTime())) {
    throw new Error("Invalid date supplied to timezone engine.")
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: safeTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(safeDate)

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  )

  return `${values.year}-${values.month}-${values.day}`
}

export function isValidTimeZone(timeZone) {
  if (!timeZone) return false

  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date())
    return true
  } catch {
    return false
  }
}
