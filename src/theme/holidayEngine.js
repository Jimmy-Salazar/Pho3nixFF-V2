import { getAppTimeZone, getDateKeyInTimeZone } from "./timezone.js"

const DAY_MS = 86_400_000

const FIXED_HOLIDAYS = [
  { key: "new_year", name: "Año Nuevo", month: 1, day: 1, type: "fixed" },
  { key: "valentines_day", name: "San Valentín", month: 2, day: 14, type: "fixed" },
  { key: "womens_day", name: "Día Internacional de la Mujer", month: 3, day: 8, type: "fixed" },
  { key: "labor_day", name: "Día del Trabajo", month: 5, day: 1, type: "fixed" },
  { key: "battle_of_pichincha", name: "Batalla del Pichincha", month: 5, day: 24, type: "fixed" },
  { key: "childrens_day", name: "Día del Niño", month: 6, day: 1, type: "fixed" },
  { key: "guayaquil_foundation", name: "Fundación de Guayaquil", month: 7, day: 25, type: "fixed" },
  { key: "first_cry_of_independence", name: "Primer Grito de Independencia", month: 8, day: 10, type: "fixed" },
  { key: "flag_day", name: "Día de la Bandera", month: 9, day: 26, type: "fixed" },
  { key: "guayaquil_independence", name: "Independencia de Guayaquil", month: 10, day: 9, type: "fixed" },
  { key: "halloween", name: "Halloween", month: 10, day: 31, type: "fixed" },
  { key: "all_souls_day", name: "Día de los Difuntos", month: 11, day: 2, type: "fixed" },
  { key: "cuenca_independence", name: "Independencia de Cuenca", month: 11, day: 3, type: "fixed" },
  { key: "quito_foundation", name: "Fundación de Quito", month: 12, day: 6, type: "fixed" },
]

const FIXED_RANGES = [
  {
    key: "christmas",
    name: "Navidad",
    startMonth: 12,
    startDay: 21,
    endMonth: 12,
    endDay: 28,
    type: "range",
  },
  {
    key: "year_end",
    name: "Fin de Año",
    startMonth: 12,
    startDay: 29,
    endMonth: 12,
    endDay: 31,
    type: "range",
  },
]

/**
 * Returns the PHO3NIX special date active for the supplied instant.
 * Business rules use the operational Box timezone, not the visitor's timezone.
 */
export function getActiveHoliday({
  date = new Date(),
  timeZone = getAppTimeZone(),
} = {}) {
  const dateKey = getDateKeyInTimeZone(date, timeZone)
  return getHolidayByDateKey(dateKey)
}

/**
 * Resolves a holiday from an already-normalized YYYY-MM-DD date key.
 */
export function getHolidayByDateKey(dateKey) {
  const { year } = parseDateKey(dateKey)
  const calendar = getHolidayCalendar(year)

  return (
    calendar.find(
      (holiday) => dateKey >= holiday.startDate && dateKey <= holiday.endDate
    ) || null
  )
}

/**
 * Builds the complete approved PHO3NIX holiday calendar for one year.
 * Variable dates are calculated automatically every year.
 */
export function getHolidayCalendar(year) {
  assertYear(year)

  const holidays = [
    ...FIXED_HOLIDAYS.map((holiday) =>
      createHoliday({
        key: holiday.key,
        name: holiday.name,
        type: holiday.type,
        startDate: makeDateKey(year, holiday.month, holiday.day),
      })
    ),
    createCarnivalHoliday(year),
    createGoodFridayHoliday(year),
    createMothersDayHoliday(year),
    createFathersDayHoliday(year),
    ...FIXED_RANGES.map((holiday) =>
      createHoliday({
        key: holiday.key,
        name: holiday.name,
        type: holiday.type,
        startDate: makeDateKey(year, holiday.startMonth, holiday.startDay),
        endDate: makeDateKey(year, holiday.endMonth, holiday.endDay),
      })
    ),
  ]

  return holidays.sort((a, b) => a.startDate.localeCompare(b.startDate))
}

export function isSpecialDate(options = {}) {
  return Boolean(getActiveHoliday(options))
}

/**
 * Useful for diagnostics/admin screens without changing the business timezone.
 */
export function getHolidayEngineStatus({
  date = new Date(),
  timeZone = getAppTimeZone(),
} = {}) {
  const dateKey = getDateKeyInTimeZone(date, timeZone)

  return {
    timeZone,
    dateKey,
    holiday: getHolidayByDateKey(dateKey),
  }
}

function createCarnivalHoliday(year) {
  const easter = getEasterSundayUtc(year)
  const carnivalMonday = addUtcDays(easter, -48)
  const carnivalTuesday = addUtcDays(easter, -47)

  return createHoliday({
    key: "carnival",
    name: "Carnaval",
    type: "calculated_range",
    startDate: utcDateToKey(carnivalMonday),
    endDate: utcDateToKey(carnivalTuesday),
  })
}

function createGoodFridayHoliday(year) {
  const easter = getEasterSundayUtc(year)
  const goodFriday = addUtcDays(easter, -2)

  return createHoliday({
    key: "good_friday",
    name: "Viernes Santo",
    type: "calculated",
    startDate: utcDateToKey(goodFriday),
  })
}

function createMothersDayHoliday(year) {
  const dateKey = getNthWeekdayOfMonthDateKey({
    year,
    month: 5,
    weekday: 0,
    occurrence: 2,
  })

  return createHoliday({
    key: "mothers_day",
    name: "Día de la Madre",
    type: "calculated",
    startDate: dateKey,
  })
}

function createFathersDayHoliday(year) {
  const dateKey = getNthWeekdayOfMonthDateKey({
    year,
    month: 6,
    weekday: 0,
    occurrence: 3,
  })

  return createHoliday({
    key: "fathers_day",
    name: "Día del Padre",
    type: "calculated",
    startDate: dateKey,
  })
}

function createHoliday({ key, name, type, startDate, endDate = startDate }) {
  return Object.freeze({
    key,
    name,
    type,
    startDate,
    endDate,
    isRange: startDate !== endDate,
  })
}

/**
 * Meeus/Jones/Butcher Gregorian Easter algorithm.
 * Easter itself is not a PHO3NIX special date; it is only an internal anchor
 * used to calculate Carnaval and Viernes Santo.
 */
function getEasterSundayUtc(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1

  return new Date(Date.UTC(year, month - 1, day))
}

function getNthWeekdayOfMonthDateKey({ year, month, weekday, occurrence }) {
  const firstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const offset = (weekday - firstDay + 7) % 7
  const day = 1 + offset + (occurrence - 1) * 7

  return makeDateKey(year, month, day)
}

function addUtcDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS)
}

function utcDateToKey(date) {
  return makeDateKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

function makeDateKey(year, month, day) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function parseDateKey(dateKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey || ""))

  if (!match) {
    throw new Error("holidayEngine requires a YYYY-MM-DD date key.")
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const testDate = new Date(Date.UTC(year, month - 1, day))

  if (
    testDate.getUTCFullYear() !== year ||
    testDate.getUTCMonth() + 1 !== month ||
    testDate.getUTCDate() !== day
  ) {
    throw new Error("holidayEngine received an invalid calendar date.")
  }

  return { year, month, day }
}

function assertYear(year) {
  if (!Number.isInteger(year) || year < 1900 || year > 2200) {
    throw new Error("holidayEngine year must be an integer between 1900 and 2200.")
  }
}
