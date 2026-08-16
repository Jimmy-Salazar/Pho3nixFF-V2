export const WOD_TIME_ZONE = "America/Guayaquil"

export function getWodDateTimeParts(date = new Date()) {
  const current = date instanceof Date ? date : new Date(date)
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: WOD_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  })
  const values = Object.fromEntries(
    formatter.formatToParts(current).map((part) => [part.type, part.value])
  )

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
    iso: `${values.year}-${values.month}-${values.day}`,
  }
}

export function getWodTodayISO(date = new Date()) {
  return getWodDateTimeParts(date).iso
}

export function formatDateISO(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function parseISODate(value) {
  if (!value) return null
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

export function addDaysISO(value, amount) {
  const date = parseISODate(value)
  if (!date) return String(value || "").slice(0, 10)
  date.setDate(date.getDate() + Number(amount || 0))
  return formatDateISO(date)
}

export function getCurrentWeekRange(date = new Date()) {
  const current = parseISODate(getWodTodayISO(date))
  const day = current.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day

  const monday = new Date(current)
  monday.setDate(current.getDate() + diffToMonday)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return {
    start: monday,
    end: sunday,
    startIso: formatDateISO(monday),
    endIso: formatDateISO(sunday),
  }
}

export function getVisibleWodDateISO(now = new Date()) {
  const current = getWodDateTimeParts(now)
  const nextWodIsVisible =
    current.hour > 19 || (current.hour === 19 && current.minute >= 30)

  return nextWodIsVisible ? addDaysISO(current.iso, 1) : current.iso
}

export function isWodVisible(wod, now = new Date()) {
  if (!wod?.fecha || wod.publicado !== true) return false

  if (wod.fecha_publicacion && new Date(wod.fecha_publicacion) > now) {
    return false
  }

  const current = getWodDateTimeParts(now)
  const visibleDateIso = addDaysISO(String(wod.fecha).slice(0, 10), -1)

  if (current.iso > visibleDateIso) return true
  if (current.iso < visibleDateIso) return false

  return current.hour > 19 || (current.hour === 19 && current.minute >= 30)
}

/**
 * Regla PHO3NIX para registrar o modificar resultados:
 * - El WOD se puede ver desde las 19:30 del día anterior.
 * - El registro abre a las 04:00 del día del WOD.
 * - Durante el mismo mes calendario se puede registrar o modificar.
 * - Al iniciar el mes siguiente, el WOD queda histórico y solo lectura.
 * - Toda la ventana se calcula en America/Guayaquil.
 */
export function getRegisterWindow(wodDateValue) {
  const dateIso = String(wodDateValue || "").slice(0, 10)
  const [year, month, day] = dateIso.split("-").map(Number)
  if (!year || !month || !day) return null

  const nextMonthYear = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextMonthIso = `${nextMonthYear}-${String(nextMonth).padStart(2, "0")}-01`

  // America/Guayaquil uses UTC-05:00 year-round.
  const startAt = new Date(`${dateIso}T04:00:00-05:00`)
  const nextMonthStart = new Date(`${nextMonthIso}T00:00:00-05:00`)
  const endAt = new Date(nextMonthStart.getTime() - 1)

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) return null

  return { startAt, endAt }
}

export function getRegisterAvailability(wod, now = new Date()) {
  if (!wod?.fecha) {
    return { canRegister: false, status: "no_wod", startAt: null, endAt: null }
  }

  const window = getRegisterWindow(wod.fecha)
  if (!window) {
    return { canRegister: false, status: "invalid_date", startAt: null, endAt: null }
  }

  if (now < window.startAt) {
    return {
      canRegister: false,
      status: "before_start",
      startAt: window.startAt,
      endAt: window.endAt,
    }
  }

  if (now > window.endAt) {
    return {
      canRegister: false,
      status: "closed_month",
      startAt: window.startAt,
      endAt: window.endAt,
    }
  }

  return {
    canRegister: true,
    status: "open",
    startAt: window.startAt,
    endAt: window.endAt,
  }
}

export function canRegisterWod(wod, now = new Date()) {
  return getRegisterAvailability(wod, now)
}

export function getRegisterButtonLabel({ copy, wod, loading, hasRegistered, availability }) {
  if (loading) return copy.loading
  if (!wod?.id) return copy.noWod
  if (hasRegistered) return copy.resultSaved
  if (availability?.status === "before_start") {
    return copy.availableAtFour || copy.availableTomorrow || copy.unavailable
  }
  if (!availability?.canRegister) return copy.unavailable
  return copy.registerResult
}

export function formatDateLong(value, locale = "es") {
  if (!value) return locale === "en" ? "No date" : "Sin fecha"

  try {
    const date = parseISODate(value)
    return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
      weekday: "short",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date)
  } catch {
    return String(value)
  }
}

export function formatDateShort(value, locale = "es") {
  if (!value) return locale === "en" ? "No date" : "Sin fecha"

  try {
    const date = String(value).includes("T") ? new Date(value) : parseISODate(value)
    return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
      day: "2-digit",
      month: "short",
    }).format(date).replace(".", "")
  } catch {
    return String(value)
  }
}

export function formatMonthYear(value, locale = "es") {
  const date = parseISODate(value)
  if (!date) return locale === "en" ? "No date" : "Sin fecha"

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
    month: "long",
    year: "numeric",
  }).format(date)
}

export function formatModoRanking(modo, copy) {
  const value = String(modo || "").trim().toLowerCase()

  if (value === "menor_es_mejor") return copy.forTime
  if (value === "mayor_es_mejor") return copy.maxReps
  if (value === "sin_ranking") return copy.noRanking

  return value ? value.replaceAll("_", " ") : copy.forTime
}

export function formatModalidad(modalidad) {
  const value = String(modalidad || "").trim().toLowerCase()

  if (value === "single") return "CrossFit"
  if (value === "duo") return "Duo"
  if (value === "trio") return "Trio"

  return modalidad || "CrossFit"
}

export function shouldUseTimeResult(wod) {
  const modo = String(wod?.modo_ranking || "").toLowerCase()
  const nombre = String(wod?.nombre || "").toLowerCase()
  const desc = String(wod?.descripcion || "").toLowerCase()

  if (modo === "menor_es_mejor") return true
  if (nombre.includes("for time") || desc.includes("for time") || desc.includes("por tiempo")) return true

  return false
}

export function parseTimeToSeconds(value) {
  const text = String(value || "").trim()
  if (!text || !text.includes(":")) return null

  const parts = text.split(":")
  if (parts.some((part) => !/^\d+$/.test(part))) return null

  const numbers = parts.map(Number)

  if (numbers.length === 2) {
    const [minutes, seconds] = numbers
    if (parts[1].length !== 2 || seconds < 0 || seconds > 59) return null
    return minutes * 60 + seconds
  }

  if (numbers.length === 3) {
    const [hours, minutes, seconds] = numbers
    if (
      parts[1].length !== 2 ||
      parts[2].length !== 2 ||
      minutes < 0 ||
      minutes > 59 ||
      seconds < 0 ||
      seconds > 59
    ) {
      return null
    }
    return hours * 3600 + minutes * 60 + seconds
  }

  return null
}

export function formatSeconds(seconds) {
  const value = Number(seconds || 0)
  if (!value) return "--:--"

  const minutes = Math.floor(value / 60)
  const rest = value % 60

  return `${minutes}:${String(rest).padStart(2, "0")}`
}

export function secondsToTime(seconds) {
  const value = Number(seconds || 0)
  if (!value) return ""
  const minutes = Math.floor(value / 60)
  const rest = value % 60
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`
}

export function formatResultValue(item) {
  if (!item) return "--"

  if (item.tiempo_texto) return item.tiempo_texto
  if (item.tiempo_total) return item.tiempo_total
  if (item.tiempo_segundos) return formatSeconds(item.tiempo_segundos)
  if (item.resultado_tiempo) return item.resultado_tiempo

  const reps = item.repeticiones ?? item.reps ?? item.resultado_reps ?? item.resultado
  if (reps !== null && reps !== undefined && String(reps).trim() !== "") {
    return `${reps} reps`
  }

  return "--"
}

export function hasRegisteredResultValue(item) {
  return (
    Boolean(item?.tiempo_texto) ||
    Boolean(item?.tiempo_total) ||
    Number(item?.tiempo_segundos || 0) > 0 ||
    Number(item?.repeticiones || 0) > 0 ||
    String(item?.resultado || "").trim().length > 0
  )
}

export function estimateWodCalories(wod) {
  const max = getWodCaloriesValue(wod)

  if (max > 0) {
    return {
      value: max,
      min: Number(wod?.calorias_min || 0),
      max,
      source: "Supabase",
    }
  }

  const text = `${wod?.descripcion || ""} ${wod?.nombre || ""}`.toLowerCase()
  let value = 450

  if (text.includes("amrap")) value = 520
  if (text.includes("emom")) value = 480
  if (text.includes("run") || text.includes("correr")) value = 620
  if (text.includes("bike") || text.includes("row")) value = 600
  if (text.includes("heavy") || text.includes("squat") || text.includes("deadlift")) value = 430

  return { value, min: Math.max(value - 120, 0), max: value, source: "Local" }
}

export function getWodCaloriesValue(wod, fallback = 0) {
  const candidates = [
    wod?.calorias_max,
    wod?.calorias,
    wod?.calorias_wod,
    wod?.calorias_estimadas,
    fallback,
  ]

  const value = candidates.find((candidate) => Number(candidate || 0) > 0)
  return Number(value || 0)
}

export function buildWeeklyCalories(results = [], weekRange) {
  const days = buildWeekDays(weekRange)
  const counted = new Set()

  results.forEach((row) => {
    const date = row.fecha || row.wod_fecha || row.wod?.fecha || row.created_at
    const index = getWeekDayIndex(date, weekRange)
    if (index < 0 || index > 6) return

    const key = row.wod_id || row.id
    if (key && counted.has(key)) return
    if (key) counted.add(key)

    const calories = getWodCaloriesValue(row.wod, row.calorias_estimadas)
    days[index].calories += Number(calories || 0)
  })

  const total = days.reduce((sum, item) => sum + Number(item.calories || 0), 0)
  const target = 6000
  const percent = target > 0 ? Math.min(Math.round((total / target) * 100), 100) : 0

  return { total, target, percent, days }
}

export function buildWeekDays(weekRange) {
  const labels = ["L", "M", "X", "J", "V", "S", "D"]

  return labels.map((label, index) => {
    const date = new Date(weekRange.start)
    date.setDate(weekRange.start.getDate() + index)

    return { label, dateIso: formatDateISO(date), calories: 0 }
  })
}

export function getWeekDayIndex(value, weekRange) {
  const date = String(value || "").slice(0, 10)
  return buildWeekDays(weekRange).findIndex((item) => item.dateIso === date)
}

export function getInitials(name) {
  const parts = String(name || "PH").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "PH"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function getFirstName(name) {
  return String(name || "Atleta").trim().split(/\s+/)[0] || "Atleta"
}

export function formatKcal(value) {
  return new Intl.NumberFormat("es-EC", { maximumFractionDigits: 0 }).format(Number(value || 0))
}

export function getTodayUserResult(dayHistory = [], userId) {
  if (!userId) return null

  return (dayHistory || []).find((item) => {
    return item.usuario_id === userId || item.usuario === userId || item.user_id === userId
  }) || null
}

export function groupWodsByYearAndMonth(rows = [], locale = "es") {
  const groups = new Map()

  rows.forEach((item) => {
    const date = item.fecha || item.wod_fecha || item.wod?.fecha
    const key = String(date || "").slice(0, 7) || "sin-fecha"

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        title: formatMonthYear(`${key}-01`, locale),
        rows: [],
      })
    }

    groups.get(key).rows.push(item)
  })

  return Array.from(groups.values())
}
