export const OPERATIONAL_TIME_ZONE = "America/Guayaquil"

export const GOAL_IDS = [
  "perder_grasa",
  "recomposicion",
  "ganar_masa_muscular",
  "mejorar_rendimiento",
]

const INACTIVE_MEMBERSHIP_STATES = new Set([
  "inactivo",
  "inactiva",
  "vencido",
  "vencida",
  "cancelado",
  "cancelada",
  "anulado",
  "anulada",
])

function datePartsFromIso(value) {
  const match = String(value || "").slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  }
}

function isoFromUtcDate(date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-")
}

function dateOnlyUtc(value) {
  const parts = datePartsFromIso(value)
  if (!parts) return null
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day))
  return Number.isNaN(date.getTime()) ? null : date
}

export function todayISO(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: OPERATIONAL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  )

  return `${values.year}-${values.month}-${values.day}`
}

export function dateDaysAgo(days = 30, date = new Date()) {
  const today = dateOnlyUtc(todayISO(date))
  if (!today) return todayISO(date)
  today.setUTCDate(today.getUTCDate() - Math.max(0, Number(days) || 0))
  return isoFromUtcDate(today)
}

export function rollingWindowStartISO(days = 30, date = new Date()) {
  const safeDays = Math.max(1, Number(days) || 30)
  return dateDaysAgo(safeDays - 1, date)
}

export function addDaysISO(value, days = 30) {
  const date = dateOnlyUtc(value)
  if (!date) return null
  date.setUTCDate(date.getUTCDate() + Number(days || 0))
  return isoFromUtcDate(date)
}

export function calculateAge(value, now = new Date()) {
  const birth = datePartsFromIso(value)
  const current = datePartsFromIso(todayISO(now))
  if (!birth || !current) return null

  let age = current.year - birth.year
  if (
    current.month < birth.month
    || (current.month === birth.month && current.day < birth.day)
  ) {
    age -= 1
  }

  return age >= 0 ? age : null
}

export function calculateBmi(weightKg, heightCm) {
  const weight = Number(weightKg)
  const heightM = Number(heightCm) / 100
  if (!weight || !heightM) return null
  return weight / (heightM * heightM)
}

export function calculateHealthyRange(heightCm) {
  const heightM = Number(heightCm) / 100
  if (!heightM) return { min: null, max: null }
  return {
    min: 18.5 * heightM * heightM,
    max: 24.9 * heightM * heightM,
  }
}

export function calculateRangeDifference(weightKg, range) {
  const weight = Number(weightKg)
  if (!weight || !range?.min || !range?.max) return null
  if (weight > range.max) return weight - range.max
  if (weight < range.min) return weight - range.min
  return 0
}

export function buildBodyReference(profile, age = null) {
  const bmi = calculateBmi(profile?.peso_kg, profile?.estatura_cm)
  const hasKnownAge = age !== null && age !== undefined && age !== ""
  const numericAge = hasKnownAge ? Number(age) : Number.NaN
  const isAdultReference = Number.isFinite(numericAge) && numericAge >= 20
  const range = isAdultReference
    ? calculateHealthyRange(profile?.estatura_cm)
    : { min: null, max: null }

  return {
    bmi,
    minWeight: range.min,
    maxWeight: range.max,
    rangeDifference: isAdultReference
      ? calculateRangeDifference(profile?.peso_kg, range)
      : null,
    isAdultReference,
    age: Number.isFinite(numericAge) ? numericAge : null,
  }
}

export function calculateDaysRemaining(nextAnalysis, now = new Date()) {
  if (!nextAnalysis) return 0
  const today = dateOnlyUtc(todayISO(now))
  const target = dateOnlyUtc(nextAnalysis)
  if (!today || !target) return 0
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86400000))
}

export function getMostFrequentModality(rows = []) {
  const counts = new Map()
  rows.forEach((item) => {
    const key = String(item?.modalidad || "").trim()
    if (!key) return
    counts.set(key, (counts.get(key) || 0) + 1)
  })
  return [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1]
    return a[0].localeCompare(b[0])
  })[0]?.[0] || null
}

export function calculatePho3nixScore({
  wods30Days = 0,
  calories30Days = 0,
  trainingDays30Days = 0,
  prs30Days = 0,
}) {
  let score = 0

  if (trainingDays30Days >= 16) score += 40
  else if (trainingDays30Days >= 12) score += 34
  else if (trainingDays30Days >= 8) score += 26
  else if (trainingDays30Days >= 4) score += 16
  else score += trainingDays30Days * 3

  if (wods30Days >= 18) score += 30
  else if (wods30Days >= 14) score += 25
  else if (wods30Days >= 10) score += 20
  else if (wods30Days >= 6) score += 12
  else score += wods30Days

  if (calories30Days >= 6000) score += 15
  else if (calories30Days >= 4500) score += 12
  else if (calories30Days >= 3000) score += 9
  else if (calories30Days >= 1500) score += 5

  if (prs30Days >= 3) score += 15
  else if (prs30Days === 2) score += 12
  else if (prs30Days === 1) score += 8

  return Math.max(0, Math.min(100, Math.round(score)))
}

export function validateNutritionProfile(payload) {
  const weight = Number(payload?.peso_kg)
  const height = Number(payload?.estatura_cm)
  const goal = String(payload?.meta || "")
  const waist = payload?.cintura_cm === "" || payload?.cintura_cm === null || payload?.cintura_cm === undefined
    ? null
    : Number(payload.cintura_cm)
  const sleepHours = payload?.horas_sueno === "" || payload?.horas_sueno === null || payload?.horas_sueno === undefined
    ? null
    : Number(payload.horas_sueno)
  const energyLevel = payload?.nivel_energia === "" || payload?.nivel_energia === null || payload?.nivel_energia === undefined
    ? null
    : Number(payload.nivel_energia)

  if (!weight || weight <= 0) throw new Error("INVALID_WEIGHT")
  if (!height || height <= 0) throw new Error("INVALID_HEIGHT")
  if (!GOAL_IDS.includes(goal)) throw new Error("INVALID_GOAL")
  if (waist !== null && (!Number.isFinite(waist) || waist <= 0)) throw new Error("INVALID_WAIST")
  if (sleepHours !== null && (!Number.isFinite(sleepHours) || sleepHours < 0 || sleepHours > 24)) throw new Error("INVALID_SLEEP")
  if (energyLevel !== null && (!Number.isInteger(energyLevel) || energyLevel < 1 || energyLevel > 5)) throw new Error("INVALID_ENERGY")

  return {
    peso_kg: weight,
    estatura_cm: height,
    meta: goal,
    cintura_cm: waist,
    horas_sueno: sleepHours,
    nivel_energia: energyLevel,
    lesiones: String(payload?.lesiones || "").trim().slice(0, 1000) || null,
    observaciones: String(payload?.observaciones || "").trim().slice(0, 1000) || null,
  }
}

export function getInitials(name) {
  const parts = String(name || "PH").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "PH"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function numberText(value, decimals = 1, locale = "es") {
  if (value === null || value === undefined || value === "") return "--"
  const number = Number(value)
  if (!Number.isFinite(number)) return "--"
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "es-EC", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(number)
}

export function dayUnit(count, copy) {
  return Number(count) === 1 ? copy.daySingular : copy.dayPlural
}

export function formatSex(value, copy) {
  const normalized = String(value || "").trim().toLowerCase()
  if (!normalized) return copy.notRegistered
  if (["m", "male", "masculino", "hombre"].includes(normalized)) return copy.male
  if (["f", "female", "femenino", "mujer"].includes(normalized)) return copy.female
  return String(value)
}

export function formatModality(value, copy) {
  const raw = String(value || "").trim()
  if (!raw) return copy.noData
  const normalized = raw.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim()
  const map = {
    "for time": copy.modalityForTime,
    "por tiempo": copy.modalityForTime,
    "amrap": "AMRAP",
    "emom": "EMOM",
    "tabata": "Tabata",
    "chipper": "Chipper",
    "strength": copy.modalityStrength,
    "fuerza": copy.modalityStrength,
  }
  return map[normalized] || raw
}

export function formatDate(value, locale = "es") {
  if (!value) return locale === "en" ? "No date" : "Sin fecha"
  const date = dateOnlyUtc(value)
  if (!date) return String(value)

  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
      timeZone: "UTC",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date).replace(".", "")
  } catch {
    return String(value)
  }
}

export function formatShortDate(value, locale = "es") {
  if (!value) return locale === "en" ? "Date" : "Fecha"
  const date = dateOnlyUtc(value)
  if (!date) return String(value)

  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
      timeZone: "UTC",
      day: "2-digit",
      month: "short",
    }).format(date).replace(".", "")
  } catch {
    return String(value)
  }
}

export function formatMonth(value, locale = "es", short = false) {
  if (!value) return locale === "en" ? "Month" : "Mes"
  const date = dateOnlyUtc(value)
  if (!date) return String(value)

  try {
    const label = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
      timeZone: "UTC",
      month: short ? "short" : "long",
      year: short ? undefined : "numeric",
    }).format(date).replace(".", "")
    return label.charAt(0).toUpperCase() + label.slice(1)
  } catch {
    return String(value)
  }
}

export function getBmiStatus(bmi, copy, allowAdultClassification = true) {
  const value = Number(bmi)
  if (!value || Number.isNaN(value)) {
    return { label: copy.notRegistered, tone: "muted" }
  }

  if (!allowAdultClassification) {
    return { label: copy.bmiAgeSpecific, tone: "muted" }
  }

  if (value < 18.5) return { label: copy.bmiLow, tone: "info" }
  if (value < 25) return { label: copy.bmiNormal, tone: "success" }
  if (value < 30) return { label: copy.bmiOverweight, tone: "warning" }
  if (value < 35) return { label: copy.bmiObesity1, tone: "danger" }
  if (value < 40) return { label: copy.bmiObesity2, tone: "danger" }
  return { label: copy.bmiObesity3, tone: "danger" }
}

export function getRangeDifferenceStatus(value, copy, locale = "es") {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return { value: "--", label: copy.notRegistered, tone: "muted" }
  }
  const number = Number(value)
  if (number === 0) return { value: copy.withinRange, label: copy.withinRange, tone: "success" }
  if (number > 0) {
    return {
      value: `+${numberText(number, 1, locale)} kg`,
      label: copy.aboveUpperLimit,
      tone: "warning",
    }
  }
  return {
    value: `${numberText(Math.abs(number), 1, locale)} kg`,
    label: copy.belowLowerLimit,
    tone: "info",
  }
}

function getMembershipPhase(membership, date = new Date()) {
  if (!membership) return "missing"

  const today = todayISO(date)
  const start = String(membership.fecha_inicio || "").slice(0, 10)
  const end = String(membership.fecha_fin || "").slice(0, 10)
  const state = String(membership.estado || "").toLowerCase().trim()

  if (INACTIVE_MEMBERSHIP_STATES.has(state)) return "expired"
  if (start && start > today) return "upcoming"
  if (end && end < today) return "expired"
  return "active"
}

export function selectRelevantMembership(memberships = [], date = new Date()) {
  const rows = [...memberships].filter(Boolean)
  if (!rows.length) return null

  const current = rows
    .filter((item) => getMembershipPhase(item, date) === "active")
    .sort((a, b) => {
      const endCompare = String(b.fecha_fin || "9999-12-31").localeCompare(String(a.fecha_fin || "9999-12-31"))
      if (endCompare !== 0) return endCompare
      return String(b.created_at || "").localeCompare(String(a.created_at || ""))
    })
  if (current.length) return current[0]

  const upcoming = rows
    .filter((item) => getMembershipPhase(item, date) === "upcoming")
    .sort((a, b) => {
      const startCompare = String(a.fecha_inicio || "9999-12-31").localeCompare(String(b.fecha_inicio || "9999-12-31"))
      if (startCompare !== 0) return startCompare
      return String(b.created_at || "").localeCompare(String(a.created_at || ""))
    })
  if (upcoming.length) return upcoming[0]

  return rows
    .sort((a, b) => {
      const endCompare = String(b.fecha_fin || "").localeCompare(String(a.fecha_fin || ""))
      if (endCompare !== 0) return endCompare
      return String(b.created_at || "").localeCompare(String(a.created_at || ""))
    })[0] || null
}

export function getMembershipStatus(membership, copy, locale = "es") {
  if (!membership) {
    return {
      status: "expired",
      title: copy.membershipMissing,
      subtitle: copy.renew,
    }
  }

  const phase = getMembershipPhase(membership)
  if (phase === "upcoming") {
    return {
      status: "upcoming",
      title: copy.membershipUpcoming,
      subtitle: membership.fecha_inicio
        ? copy.startsOn.replace("{date}", formatDate(membership.fecha_inicio, locale))
        : copy.membershipUpcoming,
    }
  }

  const endDate = dateOnlyUtc(membership.fecha_fin)
  const today = dateOnlyUtc(todayISO())
  const daysLeft = endDate && today
    ? Math.floor((endDate.getTime() - today.getTime()) / 86400000)
    : null

  if (phase !== "active") {
    return {
      status: "expired",
      title: copy.membershipExpired,
      subtitle: daysLeft !== null && daysLeft < 0
        ? `${copy.expiredAgo} ${Math.abs(daysLeft)} ${dayUnit(Math.abs(daysLeft), copy)}`
        : copy.renew,
    }
  }

  if (daysLeft !== null && daysLeft <= 7) {
    return {
      status: "warning",
      title: copy.membershipDueSoon,
      subtitle: daysLeft === 0
        ? copy.expiresToday
        : `${copy.expiresIn} ${daysLeft} ${dayUnit(daysLeft, copy)}`,
    }
  }

  return {
    status: "active",
    title: copy.membershipActive,
    subtitle: daysLeft !== null
      ? `${copy.expiresIn} ${daysLeft} ${dayUnit(daysLeft, copy)}`
      : copy.membershipActive,
  }
}

export function getGoalOptions(copy) {
  return [
    { id: "perder_grasa", icon: "🔥", title: copy.goalLoseFat, text: copy.goalLoseFatText },
    { id: "recomposicion", icon: "⚖️", title: copy.goalRecomposition, text: copy.goalRecompositionText },
    { id: "ganar_masa_muscular", icon: "💪", title: copy.goalGainMuscle, text: copy.goalGainMuscleText },
    { id: "mejorar_rendimiento", icon: "⚡", title: copy.goalPerformance, text: copy.goalPerformanceText },
  ]
}

export function normalizeEvolutionRows(history = [], { showAdultReference = true } = {}) {
  return [...history]
    .filter((item) => item?.fecha_medicion || item?.fecha_analisis)
    .slice(0, 8)
    .reverse()
    .map((item) => {
      const date = item.fecha_medicion || item.fecha_analisis
      const heightM = Number(item?.estatura_cm || 0) / 100
      const weight = Number(item?.peso_kg || 0)
      const bmi = Number(item?.imc || 0) || (weight && heightM ? weight / (heightM * heightM) : null)
      const weightLimit = showAdultReference
        ? (Number(item?.peso_referencia_max || 0) || (heightM ? 24.9 * heightM * heightM : null))
        : null

      return {
        ...item,
        fecha_analisis: date,
        bmi,
        weightLimit,
      }
    })
}

export function buildEvolutionChart(rows = [], { showAdultReference = true, locale = "es" } = {}) {
  const left = 42
  const right = 690
  const top = 32
  const bottom = 225
  const width = right - left
  const height = bottom - top
  const count = Math.max(rows.length - 1, 1)

  const weights = rows.map((item) => Number(item.peso_kg || 0)).filter((value) => value > 0)
  const limits = showAdultReference
    ? rows.map((item) => Number(item.weightLimit || 0)).filter((value) => value > 0)
    : []
  const bmis = rows.map((item) => Number(item.bmi || 0)).filter((value) => value > 0)

  const weightValues = [...weights, ...limits]
  const rawWeightMin = weightValues.length ? Math.min(...weightValues) : 50
  const rawWeightMax = weightValues.length ? Math.max(...weightValues) : 100
  const weightMin = Math.floor((rawWeightMin - 3) / 5) * 5
  const weightMaxCandidate = Math.ceil((rawWeightMax + 3) / 5) * 5
  const weightMax = weightMaxCandidate <= weightMin ? weightMin + 10 : weightMaxCandidate

  const bmiValues = showAdultReference ? [...bmis, 24.9] : bmis
  const rawBmiMin = bmiValues.length ? Math.min(...bmiValues) : 15
  const rawBmiMax = bmiValues.length ? Math.max(...bmiValues) : 35
  const bmiMin = Math.max(0, Math.floor((rawBmiMin - 2) / 5) * 5)
  const bmiMaxCandidate = Math.ceil((rawBmiMax + 2) / 5) * 5
  const bmiMax = bmiMaxCandidate <= bmiMin ? bmiMin + 10 : bmiMaxCandidate

  const yWeight = (value) => bottom - ((Number(value) - weightMin) / (weightMax - weightMin)) * height
  const yBmi = (value) => bottom - ((Number(value) - bmiMin) / (bmiMax - bmiMin)) * height
  const x = (index) => rows.length <= 1
    ? left + (width / 2)
    : left + (width / count) * index

  const ticks = (min, max) => [0, 1, 2, 3, 4].map(
    (index) => Number((max - ((max - min) / 4) * index).toFixed(0))
  )

  return {
    left,
    right,
    top,
    bottom,
    weightTicks: ticks(weightMin, weightMax),
    bmiTicks: ticks(bmiMin, bmiMax),
    yWeight,
    yBmi,
    weightPoints: rows.map((item, index) => ({
      key: item.id || `${item.fecha_analisis}-weight`,
      x: x(index),
      y: yWeight(Number(item.peso_kg || 0)),
      label: numberText(item.peso_kg, 1, locale),
    })),
    bmiPoints: rows.map((item, index) => ({
      key: item.id || `${item.fecha_analisis}-bmi`,
      x: x(index),
      y: yBmi(Number(item.bmi || 0)),
      label: numberText(item.bmi, 1, locale),
    })),
    weightLimitPoints: showAdultReference
      ? rows
        .filter((item) => Number(item.weightLimit || 0) > 0)
        .map((item) => ({
          key: item.id || `${item.fecha_analisis}-weight-limit`,
          x: x(rows.indexOf(item)),
          y: yWeight(Number(item.weightLimit)),
        }))
      : [],
    bmiLimitPoints: showAdultReference
      ? rows.map((item, index) => ({
        key: item.id || `${item.fecha_analisis}-bmi-limit`,
        x: x(index),
        y: yBmi(24.9),
      }))
      : [],
  }
}
