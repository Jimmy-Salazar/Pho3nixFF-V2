export const GOAL_IDS = [
  "perder_grasa",
  "recomposicion",
  "ganar_masa_muscular",
  "mejorar_rendimiento",
]

export function todayISO(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export function dateDaysAgo(days = 30) {
  const date = new Date()
  date.setDate(date.getDate() - Number(days || 0))
  return todayISO(date)
}

export function addDaysISO(value, days = 30) {
  if (!value) return null
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  date.setDate(date.getDate() + Number(days || 0))
  return todayISO(date)
}

export function calculateAge(value) {
  if (!value) return null
  const birth = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(birth.getTime())) return null

  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const month = now.getMonth() - birth.getMonth()

  if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) age -= 1
  return age
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

export function buildBodyReference(profile) {
  const bmi = calculateBmi(profile?.peso_kg, profile?.estatura_cm)
  const range = calculateHealthyRange(profile?.estatura_cm)
  return {
    bmi,
    minWeight: range.min,
    maxWeight: range.max,
    rangeDifference: calculateRangeDifference(profile?.peso_kg, range),
  }
}

export function calculateDaysRemaining(nextAnalysis) {
  if (!nextAnalysis) return 0
  const today = new Date(`${todayISO()}T00:00:00`)
  const target = new Date(`${String(nextAnalysis).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(target.getTime())) return 0
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86400000))
}

export function getMostFrequentModality(rows = []) {
  const counts = new Map()
  rows.forEach((item) => {
    const key = String(item?.modalidad || "").trim()
    if (!key) return
    counts.set(key, (counts.get(key) || 0) + 1)
  })
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null
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

  if (!weight || weight <= 0) throw new Error("INVALID_WEIGHT")
  if (!height || height <= 0) throw new Error("INVALID_HEIGHT")
  if (!GOAL_IDS.includes(goal)) throw new Error("INVALID_GOAL")

  return {
    peso_kg: weight,
    estatura_cm: height,
    meta: goal,
  }
}

export function getInitials(name) {
  const parts = String(name || "PH").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "PH"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function numberText(value, decimals = 1) {
  if (value === null || value === undefined || value === "") return "--"
  const number = Number(value)
  if (!Number.isFinite(number)) return "--"
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(number)
}

export function formatDate(value, locale = "es") {
  if (!value) return locale === "en" ? "No date" : "Sin fecha"
  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(`${String(value).slice(0, 10)}T00:00:00`)).replace(".", "")
  } catch {
    return String(value)
  }
}

export function formatMonth(value, locale = "es", short = false) {
  if (!value) return locale === "en" ? "Month" : "Mes"
  try {
    const label = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
      month: short ? "short" : "long",
      year: short ? undefined : "numeric",
    }).format(new Date(`${String(value).slice(0, 10)}T00:00:00`)).replace(".", "")
    return label.charAt(0).toUpperCase() + label.slice(1)
  } catch {
    return String(value)
  }
}

export function getBmiStatus(bmi, copy) {
  const value = Number(bmi)
  if (!value || Number.isNaN(value)) return { label: copy.notRegistered, tone: "muted" }
  if (value < 18.5) return { label: copy.bmiLow, tone: "info" }
  if (value < 25) return { label: copy.bmiNormal, tone: "success" }
  if (value < 30) return { label: copy.bmiOverweight, tone: "warning" }
  if (value < 35) return { label: copy.bmiObesity1, tone: "danger" }
  if (value < 40) return { label: copy.bmiObesity2, tone: "danger" }
  return { label: copy.bmiObesity3, tone: "danger" }
}

export function getRangeDifferenceStatus(value, copy) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return { value: "--", label: copy.notRegistered, tone: "muted" }
  }
  const number = Number(value)
  if (number === 0) return { value: copy.withinRange, label: copy.withinRange, tone: "success" }
  if (number > 0) return {
    value: `+${numberText(number)} kg`,
    label: copy.aboveUpperLimit,
    tone: "warning",
  }
  return {
    value: `${numberText(Math.abs(number))} kg`,
    label: copy.belowLowerLimit,
    tone: "info",
  }
}

export function getMembershipStatus(membership, copy) {
  if (!membership) {
    return {
      status: "expired",
      title: copy.membershipMissing,
      subtitle: copy.renew,
    }
  }

  const endDate = membership.fecha_fin
    ? new Date(`${String(membership.fecha_fin).slice(0, 10)}T00:00:00`)
    : null
  const state = String(membership.estado || "").toLowerCase()
  const today = new Date(`${todayISO()}T00:00:00`)
  const daysLeft = endDate && !Number.isNaN(endDate.getTime())
    ? Math.floor((endDate.getTime() - today.getTime()) / 86400000)
    : null
  const active = state === "activo" && (daysLeft === null || daysLeft >= 0)

  if (!active) {
    return {
      status: "expired",
      title: copy.membershipExpired,
      subtitle: daysLeft !== null && daysLeft < 0
        ? `${copy.expiredAgo} ${Math.abs(daysLeft)} ${copy.days}`
        : copy.renew,
    }
  }

  if (daysLeft !== null && daysLeft <= 7) {
    return {
      status: "warning",
      title: copy.membershipDueSoon,
      subtitle: daysLeft === 0
        ? copy.expiresToday
        : `${copy.expiresIn} ${daysLeft} ${copy.days}`,
    }
  }

  return {
    status: "active",
    title: copy.membershipActive,
    subtitle: daysLeft !== null
      ? `${copy.expiresIn} ${daysLeft} ${copy.days}`
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

export function normalizeEvolutionRows(history = []) {
  return [...history]
    .filter((item) => item?.fecha_analisis)
    .slice(0, 5)
    .reverse()
    .map((item) => {
      const heightM = Number(item?.estatura_cm || 0) / 100
      const weight = Number(item?.peso_kg || 0)
      const bmi = Number(item?.imc || 0) || (weight && heightM ? weight / (heightM * heightM) : null)
      const weightLimit = Number(item?.peso_referencia_max || 0) || (heightM ? 24.9 * heightM * heightM : null)
      return { ...item, bmi, weightLimit }
    })
}

export function buildEvolutionChart(rows = []) {
  const left = 42
  const right = 690
  const top = 32
  const bottom = 225
  const width = right - left
  const height = bottom - top
  const count = Math.max(rows.length - 1, 1)

  const weights = rows.map((item) => Number(item.peso_kg || 0)).filter((value) => value > 0)
  const limits = rows.map((item) => Number(item.weightLimit || 0)).filter((value) => value > 0)
  const bmis = rows.map((item) => Number(item.bmi || 0)).filter((value) => value > 0)

  const weightValues = [...weights, ...limits]
  const rawWeightMin = weightValues.length ? Math.min(...weightValues) : 50
  const rawWeightMax = weightValues.length ? Math.max(...weightValues) : 100
  const weightMin = Math.floor((rawWeightMin - 3) / 5) * 5
  const weightMaxCandidate = Math.ceil((rawWeightMax + 3) / 5) * 5
  const weightMax = weightMaxCandidate <= weightMin ? weightMin + 10 : weightMaxCandidate

  const bmiValues = [...bmis, 24.9]
  const rawBmiMin = bmiValues.length ? Math.min(...bmiValues) : 18.5
  const rawBmiMax = bmiValues.length ? Math.max(...bmiValues) : 30
  const bmiMin = Math.max(0, Math.floor((rawBmiMin - 2) / 5) * 5)
  const bmiMaxCandidate = Math.ceil((rawBmiMax + 2) / 5) * 5
  const bmiMax = bmiMaxCandidate <= bmiMin ? bmiMin + 10 : bmiMaxCandidate

  const yWeight = (value) => bottom - ((Number(value) - weightMin) / (weightMax - weightMin)) * height
  const yBmi = (value) => bottom - ((Number(value) - bmiMin) / (bmiMax - bmiMin)) * height
  const x = (index) => left + (width / count) * index

  const ticks = (min, max) => [0, 1, 2, 3, 4].map((index) => Number((max - ((max - min) / 4) * index).toFixed(0)))

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
      label: numberText(item.peso_kg),
    })),
    bmiPoints: rows.map((item, index) => ({
      key: item.id || `${item.fecha_analisis}-bmi`,
      x: x(index),
      y: yBmi(Number(item.bmi || 0)),
      label: numberText(item.bmi),
    })),
    weightLimitPoints: rows.map((item, index) => ({
      key: item.id || `${item.fecha_analisis}-weight-limit`,
      x: x(index),
      y: yWeight(Number(item.weightLimit || 0)),
    })).filter((point) => Number.isFinite(point.y)),
    bmiLimitPoints: rows.map((item, index) => ({
      key: item.id || `${item.fecha_analisis}-bmi-limit`,
      x: x(index),
      y: yBmi(24.9),
    })),
  }
}
