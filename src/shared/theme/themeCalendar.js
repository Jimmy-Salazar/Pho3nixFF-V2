import { resolveScheduleEntry } from "./themeScheduleResolver.js"

/*
 * PHO3NIX V2 local fallback calendar.
 *
 * Supabase is the shared runtime source for Web + future App.
 * This local copy is intentionally retained as an OFFLINE fallback.
 */
export const LOCAL_THEME_CALENDAR = [
  {
    themeKey: "new_year",
    priority: 100,
    rule: { type: "annual_date", month: 1, day: 1 },
  },
  {
    themeKey: "valentines_day",
    priority: 120,
    rule: {
      type: "annual_datetime_range",
      startMonth: 2,
      startDay: 13,
      startHour: 23,
      startMinute: 0,
      endMonth: 2,
      endDay: 14,
      endHour: 23,
      endMinute: 59,
    },
  },
  {
    themeKey: "carnival",
    priority: 95,
    rule: {
      type: "easter_offset_range",
      startOffsetDays: -50,
      endOffsetDays: -47,
    },
  },
  {
    themeKey: "international_womens_day",
    priority: 100,
    rule: { type: "annual_date", month: 3, day: 8 },
  },
  {
    themeKey: "good_friday",
    priority: 100,
    rule: { type: "easter_offset", offsetDays: -2 },
  },
  {
    themeKey: "labor_day",
    priority: 100,
    rule: { type: "annual_date", month: 5, day: 1 },
  },
  {
    themeKey: "mothers_day",
    priority: 100,
    rule: {
      type: "nth_weekday_of_month",
      month: 5,
      weekday: 0,
      occurrence: 2,
    },
  },
  {
    themeKey: "battle_of_pichincha",
    priority: 100,
    rule: { type: "annual_date", month: 5, day: 24 },
  },
  {
    themeKey: "childrens_day",
    priority: 100,
    rule: { type: "annual_date", month: 6, day: 1 },
  },
  {
    themeKey: "fathers_day",
    priority: 100,
    rule: {
      type: "nth_weekday_of_month",
      month: 6,
      weekday: 0,
      occurrence: 3,
    },
  },
  {
    themeKey: "guayaquil_foundation",
    priority: 100,
    rule: { type: "annual_date", month: 7, day: 25 },
  },
  {
    themeKey: "first_cry_of_independence",
    priority: 100,
    rule: { type: "annual_date", month: 8, day: 10 },
  },
  {
    themeKey: "flag_day",
    priority: 100,
    rule: { type: "annual_date", month: 9, day: 26 },
  },
  {
    themeKey: "guayaquil_independence",
    priority: 100,
    rule: { type: "annual_date", month: 10, day: 9 },
  },
  {
    themeKey: "halloween",
    priority: 100,
    rule: { type: "annual_date", month: 10, day: 31 },
  },
  {
    themeKey: "all_souls_day",
    priority: 100,
    rule: { type: "annual_date", month: 11, day: 2 },
  },
  {
    themeKey: "cuenca_independence",
    priority: 100,
    rule: { type: "annual_date", month: 11, day: 3 },
  },
  {
    themeKey: "quito_foundation",
    priority: 100,
    rule: { type: "annual_date", month: 12, day: 6 },
  },
  {
    themeKey: "christmas",
    priority: 100,
    rule: {
      type: "annual_range",
      startMonth: 12,
      startDay: 21,
      endMonth: 12,
      endDay: 28,
    },
  },
  {
    themeKey: "year_end",
    priority: 100,
    rule: {
      type: "annual_range",
      startMonth: 12,
      startDay: 29,
      endMonth: 12,
      endDay: 31,
    },
  },
]

export function resolveLocalScheduledTheme({
  dateTimeKey,
  dateKey,
  availableThemes,
}) {
  if (!availableThemes) return null

  const entry = resolveScheduleEntry({
    dateTimeKey: dateTimeKey || dateKey || "",
    calendarEntries: LOCAL_THEME_CALENDAR,
    allowedThemeKeys: Object.keys(availableThemes),
  })

  if (!entry?.themeKey) return null

  const theme = availableThemes[entry.themeKey]
  if (!theme) return null

  return {
    ...theme,
    source: "local-calendar",
  }
}

export function resolveLocalScheduledThemeKey({
  dateTimeKey,
  dateKey,
  availableThemeKeys,
  defaultThemeKey = "phoenix",
} = {}) {
  const entry = resolveScheduleEntry({
    dateTimeKey: dateTimeKey || dateKey || "",
    calendarEntries: LOCAL_THEME_CALENDAR,
    allowedThemeKeys: availableThemeKeys,
  })

  return entry?.themeKey || defaultThemeKey
}
