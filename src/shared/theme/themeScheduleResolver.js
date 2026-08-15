import { calculateEasterSundayUTC } from "./easterCalculator.js"

/*
 * PHO3NIX shared schedule resolver.
 *
 * IMPORTANT: this file has no React, DOM, localStorage or CSS dependency.
 * The same rule engine can be reused by the future React Native app.
 */

export function resolveScheduleEntry({
  dateTimeKey,
  calendarEntries = [],
  allowedThemeKeys = null,
} = {}) {
  const momentKey = normalizeThemeMomentKey(dateTimeKey)
  if (!momentKey) return null

  const allowed = normalizeAllowedKeys(allowedThemeKeys)

  const matches = calendarEntries
    .filter((entry) => entry?.enabled !== false)
    .filter((entry) => {
      const key = normalizeThemeKey(entry?.themeKey)
      if (!key) return false
      if (allowed && !allowed.has(key)) return false
      return isThemeRuleActive(entry?.rule, momentKey)
    })
    .sort((a, b) =>
      Number(b?.priority || 0) - Number(a?.priority || 0)
    )

  return matches[0] || null
}

export function isThemeRuleActive(rule, momentKey) {
  if (!rule) return false

  const normalized = normalizeThemeMomentKey(momentKey)
  if (!normalized) return false

  const dateKey = normalized.slice(0, 10)
  const timeKey = normalized.slice(11, 16)

  if (rule.type === "annual_date") {
    return dateKey.slice(5) === formatMonthDay(rule.month, rule.day)
  }

  if (rule.type === "annual_datetime_range") {
    const current = annualMomentValue(dateKey, timeKey)
    const start = annualMomentValueFromParts(
      rule.startMonth,
      rule.startDay,
      rule.startHour,
      rule.startMinute
    )
    const end = annualMomentValueFromParts(
      rule.endMonth,
      rule.endDay,
      rule.endHour,
      rule.endMinute
    )

    if (start <= end) {
      return current >= start && current <= end
    }

    return current >= start || current <= end
  }

  if (rule.type === "annual_range") {
    const [, month, day] = dateKey.split("-").map(Number)
    const current = month * 100 + day
    const start = Number(rule.startMonth) * 100 + Number(rule.startDay)
    const end = Number(rule.endMonth) * 100 + Number(rule.endDay)

    if (start <= end) {
      return current >= start && current <= end
    }

    return current >= start || current <= end
  }

  if (rule.type === "specific_date_list") {
    return Array.isArray(rule.dates)
      ? rule.dates.includes(dateKey)
      : false
  }

  if (rule.type === "easter_offset") {
    const [year] = dateKey.split("-").map(Number)
    if (!year) return false

    const target = calculateEasterSundayUTC(year)
    target.setUTCDate(
      target.getUTCDate() + Number(rule.offsetDays || 0)
    )

    return formatDateKeyUTC(target) === dateKey
  }

  if (rule.type === "easter_offset_range") {
    const [year] = dateKey.split("-").map(Number)
    if (!year) return false

    const current = new Date(`${dateKey}T00:00:00Z`)
    if (Number.isNaN(current.getTime())) return false

    const easter = calculateEasterSundayUTC(year)
    const start = new Date(easter)
    const end = new Date(easter)

    start.setUTCDate(
      start.getUTCDate() + Number(rule.startOffsetDays || 0)
    )
    end.setUTCDate(
      end.getUTCDate() + Number(rule.endOffsetDays || 0)
    )

    return current >= start && current <= end
  }

  if (rule.type === "nth_weekday_of_month") {
    const [year, month, day] = dateKey.split("-").map(Number)

    if (!year || month !== Number(rule.month) || !day) {
      return false
    }

    const weekday = Number(rule.weekday || 0)
    const occurrence = Number(rule.occurrence || 1)
    const first = new Date(Date.UTC(year, month - 1, 1))
    const delta = (weekday - first.getUTCDay() + 7) % 7
    const targetDay = 1 + delta + (occurrence - 1) * 7

    return day === targetDay
  }

  return false
}

export function normalizeThemeMomentKey(value) {
  const raw = String(value || "").trim()

  if (isValidDateKey(raw)) {
    return `${raw}T12:00`
  }

  if (isValidDateTimeKey(raw)) {
    return raw
  }

  return ""
}

function normalizeAllowedKeys(value) {
  if (!value) return null

  const values = value instanceof Set
    ? Array.from(value)
    : Array.isArray(value)
      ? value
      : Object.keys(value)

  return new Set(values.map(normalizeThemeKey).filter(Boolean))
}

function normalizeThemeKey(value) {
  return String(value || "").trim().toLowerCase()
}

function annualMomentValue(dateKey, timeKey) {
  const [, month, day] = dateKey.split("-").map(Number)
  const [hour, minute] = timeKey.split(":").map(Number)
  return annualMomentValueFromParts(month, day, hour, minute)
}

function annualMomentValueFromParts(month, day, hour = 0, minute = 0) {
  return (
    Number(month) * 1000000 +
    Number(day) * 10000 +
    Number(hour) * 100 +
    Number(minute)
  )
}

function formatMonthDay(month, day) {
  return (
    `${String(month).padStart(2, "0")}-` +
    `${String(day).padStart(2, "0")}`
  )
}

function formatDateKeyUTC(date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-")
}

function isValidDateTimeKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return false
  }

  const [datePart, timePart] = value.split("T")
  if (!isValidDateKey(datePart)) return false

  const [hour, minute] = timePart.split(":").map(Number)
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
}

function isValidDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}
