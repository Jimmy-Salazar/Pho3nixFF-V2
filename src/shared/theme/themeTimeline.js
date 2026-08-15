import {
  resolveScheduleEntry,
} from "./themeScheduleResolver.js"

/*
 * Pure timeline helper.
 *
 * No React, DOM, browser storage or Supabase.
 * Safe for future Web / Android / iOS reuse.
 */

export function findNextThemeTransition({
  startDate = new Date(),
  timeZone = "America/Guayaquil",
  calendarEntries = [],
  availableThemeKeys = [],
  defaultThemeKey = "phoenix",
  toDateTimeKey,
  searchHours = 24 * 370,
} = {}) {
  if (
    typeof toDateTimeKey !==
    "function"
  ) {
    return null
  }

  const allowed =
    new Set(
      Array.from(
        availableThemeKeys || []
      )
        .map(normalizeThemeKey)
        .filter(Boolean)
    )

  allowed.add(
    normalizeThemeKey(
      defaultThemeKey
    )
  )

  const initialKey =
    resolveThemeKey({
      dateTimeKey:
        toDateTimeKey(
          startDate,
          timeZone
        ),
      calendarEntries,
      allowedThemeKeys:
        allowed,
      defaultThemeKey,
    })

  for (
    let hour = 1;
    hour <= searchHours;
    hour += 1
  ) {
    const date =
      new Date(
        startDate.getTime() +
        hour * 60 * 60 * 1000
      )

    const dateTimeKey =
      toDateTimeKey(
        date,
        timeZone
      )

    const key =
      resolveThemeKey({
        dateTimeKey,
        calendarEntries,
        allowedThemeKeys:
          allowed,
        defaultThemeKey,
      })

    if (key !== initialKey) {
      return {
        dateTimeKey,
        fromThemeKey:
          initialKey,
        toThemeKey:
          key,
        hoursFromStart:
          hour,
      }
    }
  }

  return null
}

function resolveThemeKey({
  dateTimeKey,
  calendarEntries,
  allowedThemeKeys,
  defaultThemeKey,
}) {
  const entry =
    resolveScheduleEntry({
      dateTimeKey,
      calendarEntries,
      allowedThemeKeys,
    })

  return (
    normalizeThemeKey(
      entry?.themeKey
    ) ||
    normalizeThemeKey(
      defaultThemeKey
    )
  )
}

function normalizeThemeKey(value) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase()
}
