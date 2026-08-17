import { getAdminStatisticsCopy } from "../i18n/adminStatisticsCopy.js"

const DAY_MS = 86400000
export const STATISTICS_TIME_ZONE = "America/Guayaquil"

function fallbackLabel(locale = "es", key = "") {
  const copy = getAdminStatisticsCopy(locale)
  if (key === "athlete") return `${copy.athlete} PHO3NIX`
  if (key === "exercise") return copy.exercise
  return ""
}

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME_ZONE_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: STATISTICS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

function buildCalendarDate(year, month, day) {
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0))
  return Number.isNaN(date.getTime()) ? null : date
}

function getTimeZoneDateParts(value) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const parts = TIME_ZONE_DATE_FORMATTER.formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const year = Number(values.year)
  const month = Number(values.month)
  const day = Number(values.day)

  return [year, month, day].every(Number.isFinite) ? { year, month, day } : null
}

export const EMPTY_ATHLETE_DETAIL = {
  athlete: null,
  range: { days: 30, startIso: "", endIso: "" },
  membership: null,
  membershipStatus: { status: "missing", active: false, daysLeft: null, daysUntilStart: null },
  summary: {
    totalWods: 0,
    periodWods: 0,
    totalPrs: 0,
    periodPrs: 0,
    activeDays: 0,
    averageWeeklyWods: 0,
    lastActivity: null,
    memberDays: 0,
  },
  activitySeries: [],
  membershipHistory: [],
  alerts: [],
  prSummary: {
    total: 0,
    period: 0,
    exercises: 0,
    latest: null,
    biggestImprovement: null,
  },
  prExercises: [],
  prHistory: [],
  diagnostics: [],
}

export const EMPTY_STATISTICS_DATA = {
  profile: null,
  range: { days: 30, startIso: "", endIso: "" },
  summary: {
    activeAthletes: 0,
    expiringSoon: 0,
    wodParticipationRate: 0,
    prCount: 0,
  },
  membershipSummary: {
    active: 0,
    expiring: 0,
    expired: 0,
    upcoming: 0,
    missing: 0,
    total: 0,
  },
  activitySeries: [],
  wodWeekSeries: [],
  prMovementSeries: [],
  highlightedAthletes: [],
  athletes: [],
  athleteStats: {
    summary: {
      total: 0,
      active: 0,
      expiring: 0,
      expired: 0,
      upcoming: 0,
      missing: 0,
      newInPeriod: 0,
      activeInPeriod: 0,
      activityRate: 0,
      averageMemberDays: 0,
    },
    growthSeries: [],
    nutritionSeries: [],
    genderSeries: [],
    ageSeries: [],
    inactivity: { days7: 0, days14: 0, days30: 0 },
    rows: [],
  },
  prStats: {
    summary: {
      total: 0,
      uniqueAthletes: 0,
      uniqueExercises: 0,
      averagePerAthlete: 0,
      improvementCount: 0,
      averageImprovement: 0,
      medianImprovement: 0,
      improvementRate: 0,
      coverageRate: 0,
      firstMarks: 0,
      comparablePairs: 0,
    },
    trendSeries: [],
    topMovements: [],
    topAthletes: [],
    improvementLeaders: [],
    exerciseStats: [],
  },
  wodStats: {
    summary: {
      totalWods: 0,
      totalResults: 0,
      uniqueAthletes: 0,
      averageParticipation: 0,
    },
    wods: [],
    categorySeries: [],
    groupPerformanceSeries: [],
  },
  alerts: {
    expiringSoon: 0,
    inactiveAthletes: 0,
    prCount: 0,
  },
  diagnostics: [],
}

export function normalizeRole(value) {
  const role = String(value || "").trim().toLowerCase()
  if (["admin", "administrador"].includes(role)) return "admin"
  if (["coach", "entrenador"].includes(role)) return "coach"
  if (["alumno", "atleta", "student", "athlete"].includes(role)) return "alumno"
  return role || "unknown"
}

export function parseLocalDate(value) {
  if (!value) return null

  if (typeof value === "string") {
    const exactDate = DATE_ONLY_RE.exec(value.trim())
    if (exactDate) return buildCalendarDate(exactDate[1], exactDate[2], exactDate[3])
  }

  const parts = getTimeZoneDateParts(value)
  return parts ? buildCalendarDate(parts.year, parts.month, parts.day) : null
}

export function formatDateIso(value = new Date()) {
  const date = parseLocalDate(value)
  if (!date) return ""

  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function startOfDay(value = new Date()) {
  return parseLocalDate(value)
}

export function endOfDay(value = new Date()) {
  return parseLocalDate(value)
}

export function getStatisticsRange(days = 30, now = new Date()) {
  const safeDays = [7, 30, 90, 365].includes(Number(days)) ? Number(days) : 30
  const end = startOfDay(now)
  const start = new Date(end.getTime() - (safeDays - 1) * DAY_MS)

  return {
    days: safeDays,
    start,
    end,
    startIso: formatDateIso(start),
    endIso: formatDateIso(end),
  }
}

export function getWeekRange(now = new Date()) {
  const date = startOfDay(now)
  const day = date.getUTCDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const start = new Date(date)
  start.setUTCDate(start.getUTCDate() + mondayOffset)
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 5)

  return {
    start,
    end,
    startIso: formatDateIso(start),
    endIso: formatDateIso(end),
  }
}

export function getMembershipStatus(membership, now = new Date()) {
  if (!membership) {
    return { status: "missing", active: false, daysLeft: null, daysUntilStart: null }
  }

  const today = startOfDay(now)
  const start = parseLocalDate(membership.fecha_inicio)
  const end = parseLocalDate(membership.fecha_fin)
  const explicit = String(membership.estado || "").trim().toLowerCase()
  const inactive = [
    "inactivo", "inactiva",
    "vencido", "vencida",
    "cancelado", "cancelada",
    "anulado", "anulada",
  ].includes(explicit)

  const daysLeft = end ? Math.round((end.getTime() - today.getTime()) / DAY_MS) : null
  const daysUntilStart = start ? Math.round((start.getTime() - today.getTime()) / DAY_MS) : null

  if (inactive || (end && end < today)) {
    return { status: "expired", active: false, daysLeft, daysUntilStart }
  }

  if (start && start > today) {
    return { status: "upcoming", active: false, daysLeft, daysUntilStart }
  }

  if (end && daysLeft <= 7) {
    return { status: "expiring", active: true, daysLeft, daysUntilStart }
  }

  return { status: "active", active: true, daysLeft, daysUntilStart }
}

function createdAtTime(row) {
  const date = new Date(row?.created_at || 0)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

function membershipStartTime(row) {
  return parseLocalDate(row?.fecha_inicio || row?.created_at)?.getTime() ?? Number.NEGATIVE_INFINITY
}

function compareMembershipsLatestFirst(a, b) {
  const aEnd = parseLocalDate(a?.fecha_fin)?.getTime() ?? Number.NEGATIVE_INFINITY
  const bEnd = parseLocalDate(b?.fecha_fin)?.getTime() ?? Number.NEGATIVE_INFINITY
  if (aEnd !== bEnd) return bEnd - aEnd
  return createdAtTime(b) - createdAtTime(a)
}

function selectRelevantMembership(rows = [], now = new Date()) {
  const current = rows
    .filter((row) => ["active", "expiring"].includes(getMembershipStatus(row, now).status))
    .sort((a, b) => {
      const startDifference = membershipStartTime(b) - membershipStartTime(a)
      return startDifference || compareMembershipsLatestFirst(a, b)
    })

  if (current.length) return current[0]

  const upcoming = rows
    .filter((row) => getMembershipStatus(row, now).status === "upcoming")
    .sort((a, b) => {
      const startDifference = membershipStartTime(a) - membershipStartTime(b)
      return startDifference || createdAtTime(a) - createdAtTime(b)
    })

  if (upcoming.length) return upcoming[0]

  const expired = rows
    .filter((row) => getMembershipStatus(row, now).status === "expired")
    .sort(compareMembershipsLatestFirst)

  return expired[0] || null
}

export function latestMembershipsByUser(rows = [], now = new Date()) {
  const grouped = new Map()

  rows.forEach((row) => {
    const userId = String(row?.usuario_id || "")
    if (!userId) return
    if (!grouped.has(userId)) grouped.set(userId, [])
    grouped.get(userId).push(row)
  })

  const map = new Map()
  grouped.forEach((userRows, userId) => {
    const membership = selectRelevantMembership(userRows, now)
    if (membership) map.set(userId, membership)
  })

  return map
}

function getMemberStartDate(memberships = [], fallback = null) {
  const starts = memberships
    .map((row) => parseLocalDate(row?.fecha_inicio || row?.created_at))
    .filter(Boolean)
    .sort((a, b) => a.getTime() - b.getTime())

  return starts[0] || parseLocalDate(fallback)
}

export function buildMembershipSummary(athletes = [], memberships = [], now = new Date()) {
  const latest = latestMembershipsByUser(memberships, now)
  const summary = { active: 0, expiring: 0, expired: 0, upcoming: 0, missing: 0, total: athletes.length }
  const activeIds = new Set()
  const expiringRows = []

  athletes.forEach((athlete) => {
    const membership = latest.get(String(athlete.id)) || null
    const state = getMembershipStatus(membership, now)
    summary[state.status] += 1

    if (state.active) activeIds.add(String(athlete.id))
    if (state.status === "expiring") {
      expiringRows.push({ athlete, membership, daysLeft: state.daysLeft })
    }
  })

  expiringRows.sort((a, b) => Number(a.daysLeft ?? 999) - Number(b.daysLeft ?? 999))
  return { summary, activeIds, expiringRows, latest }
}

function dateFromRow(row) {
  return parseLocalDate(row?.fecha || row?.created_at)
}

function addActivityToBucket(bucketMap, key, userId) {
  if (!key || !userId) return
  if (!bucketMap.has(key)) bucketMap.set(key, new Set())
  bucketMap.get(key).add(String(userId))
}

function buildBuckets(range, locale) {
  const buckets = []
  const useDays = range.days <= 7
  const bucketCount = useDays ? range.days : Math.min(range.days <= 30 ? 5 : range.days <= 90 ? 6 : 12, 12)
  const totalMs = range.end.getTime() - range.start.getTime() + DAY_MS
  const bucketMs = totalMs / bucketCount
  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
    timeZone: "UTC",
    ...(useDays
      ? { weekday: "short" }
      : range.days >= 365
        ? { month: "short" }
        : { day: "numeric", month: "short" }),
  })

  for (let index = 0; index < bucketCount; index += 1) {
    const start = new Date(range.start.getTime() + index * bucketMs)
    const end = index === bucketCount - 1
      ? range.end
      : new Date(range.start.getTime() + (index + 1) * bucketMs - 1)

    buckets.push({
      key: `${index}`,
      start,
      end,
      label: formatter.format(start).replace(".", ""),
    })
  }

  return buckets
}

function findBucket(buckets, date) {
  return buckets.find((item) => date >= item.start && date <= item.end) || null
}

export function buildActivitySeries({ range, locale = "es", wodResults = [], prRecords = [], attendance = [] }) {
  const buckets = buildBuckets(range, locale)
  const activity = new Map(buckets.map((bucket) => [bucket.key, new Set()]))

  const register = (row, userField) => {
    const date = dateFromRow(row)
    const userId = row?.[userField]
    if (!date || !userId || date < range.start || date > range.end) return

    const bucket = findBucket(buckets, date)
    if (bucket) addActivityToBucket(activity, bucket.key, userId)
  }

  wodResults.forEach((row) => register(row, "usuario_id"))
  prRecords.forEach((row) => register(row, "usuario"))
  attendance.forEach((row) => register(row, "usuario_id"))

  return buckets.map((bucket) => ({ label: bucket.label, value: activity.get(bucket.key)?.size || 0 }))
}

export function buildCountSeries(rows = [], range, locale = "es") {
  const buckets = buildBuckets(range, locale)
  const counts = new Map(buckets.map((bucket) => [bucket.key, 0]))

  rows.forEach((row) => {
    const date = dateFromRow(row)
    if (!date || date < range.start || date > range.end) return
    const bucket = findBucket(buckets, date)
    if (bucket) counts.set(bucket.key, (counts.get(bucket.key) || 0) + 1)
  })

  return buckets.map((bucket) => ({ label: bucket.label, value: counts.get(bucket.key) || 0 }))
}

export function buildAthleteActivitySeries({ range, locale = "es", wodResults = [], prRecords = [], attendance = [] }) {
  const buckets = buildBuckets(range, locale)
  const rows = new Map(buckets.map((bucket) => [bucket.key, { wods: 0, prs: 0, attendance: 0 }]))

  const register = (items, field) => {
    items.forEach((item) => {
      const date = dateFromRow(item)
      if (!date || date < range.start || date > range.end) return
      const bucket = findBucket(buckets, date)
      if (!bucket) return
      const current = rows.get(bucket.key)
      current[field] += 1
    })
  }

  register(wodResults, "wods")
  register(prRecords, "prs")
  register(attendance, "attendance")

  return buckets.map((bucket) => {
    const value = rows.get(bucket.key) || { wods: 0, prs: 0, attendance: 0 }
    return { label: bucket.label, ...value, total: value.wods + value.prs + value.attendance }
  })
}

export function buildWodWeekSeries(wodResults = [], locale = "es", now = new Date()) {
  const week = getWeekRange(now)
  const names = locale === "en" ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
  const values = [0, 0, 0, 0, 0, 0]

  wodResults.forEach((row) => {
    const date = dateFromRow(row)
    if (!date || date < week.start || date > week.end) return
    const dayIndex = date.getUTCDay() === 0 ? 6 : date.getUTCDay() - 1
    if (dayIndex >= 0 && dayIndex < 6) values[dayIndex] += 1
  })

  return names.map((label, index) => ({ label, value: values[index] }))
}

export function buildPrMovementSeries(prRecords = [], exercises = [], limit = 5, locale = "es") {
  const exerciseMap = new Map(exercises.map((row) => [String(row.id), row.nombre || fallbackLabel(locale, "exercise")]))
  const counts = new Map()

  prRecords.forEach((row) => {
    const key = String(row.ejercicio_id || "")
    if (!key) return
    counts.set(key, (counts.get(key) || 0) + 1)
  })

  return Array.from(counts.entries())
    .map(([exerciseId, value]) => ({ exerciseId, label: exerciseMap.get(exerciseId) || fallbackLabel(locale, "exercise"), value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, limit)
}

export function buildHighlightedAthletes({ users = [], wodResults = [], prRecords = [], attendance = [], limit = 5, locale = "es" }) {
  const usersMap = new Map(users.map((user) => [String(user.id), user]))
  const scores = new Map()

  const add = (id, field, points) => {
    if (!id) return
    const key = String(id)
    const current = scores.get(key) || { userId: key, score: 0, wods: 0, prs: 0, attendance: 0 }
    current.score += points
    current[field] += 1
    scores.set(key, current)
  }

  wodResults.forEach((row) => add(row.usuario_id, "wods", 3))
  prRecords.forEach((row) => add(row.usuario, "prs", 2))
  attendance.forEach((row) => add(row.usuario_id, "attendance", 1))

  return Array.from(scores.values())
    .map((row) => {
      const user = usersMap.get(row.userId) || {}
      return { ...row, nombre: user.nombre || user.email || fallbackLabel(locale, "athlete"), fotoUrl: user.foto_url || "" }
    })
    .sort((a, b) => b.score - a.score || a.nombre.localeCompare(b.nombre))
    .slice(0, limit)
}

export function buildInactiveAthletes({
  athletes = [],
  activeIds = new Set(),
  recentWodResults = [],
  recentPrRecords = [],
  recentAttendance = [],
  now = new Date(),
  thresholdDays = 14,
}) {
  const latestActivity = new Map()

  const register = (items, userField) => {
    items.forEach((item) => {
      const userId = String(item?.[userField] || "")
      const date = dateFromRow(item)
      if (!userId || !date) return
      const current = latestActivity.get(userId)
      if (!current || date > current) latestActivity.set(userId, date)
    })
  }

  register(recentWodResults, "usuario_id")
  register(recentPrRecords, "usuario")
  register(recentAttendance, "usuario_id")

  const today = startOfDay(now)
  const safeThreshold = Math.max(0, Number(thresholdDays) || 0)

  return athletes.filter((athlete) => {
    const id = String(athlete.id)
    if (!activeIds.has(id)) return false

    const last = latestActivity.get(id) || null
    const daysWithoutActivity = last
      ? Math.floor((today.getTime() - startOfDay(last).getTime()) / DAY_MS)
      : 999

    return daysWithoutActivity >= safeThreshold
  })
}

export function expandWodResultsWithParticipants(results = [], participantLinks = []) {
  const linksByResult = new Map()

  participantLinks.forEach((link) => {
    const resultId = String(link?.wod_resultado_id || "")
    const userId = String(link?.usuario_id || "")
    if (!resultId || !userId) return
    if (!linksByResult.has(resultId)) linksByResult.set(resultId, new Set())
    linksByResult.get(resultId).add(userId)
  })

  const expanded = []

  results.forEach((result) => {
    const resultId = String(result?.id || "")
    const participantIds = new Set()
    const ownerId = String(result?.usuario_id || "")
    if (ownerId) participantIds.add(ownerId)

    ;(linksByResult.get(resultId) || []).forEach((userId) => participantIds.add(userId))

    participantIds.forEach((userId) => {
      expanded.push({
        ...result,
        source_result_id: result.id,
        source_usuario_id: result.usuario_id,
        usuario_id: userId,
      })
    })
  })

  return expanded
}

export function calculateWodParticipationRate({
  activeAthleteCount = 0,
  activeAthleteIds = null,
  publishedWodCount = 0,
  wodResults = [],
}) {
  if (!activeAthleteCount || !publishedWodCount) return 0

  const activeIds = activeAthleteIds instanceof Set
    ? new Set([...activeAthleteIds].map((value) => String(value)))
    : null
  const eligibleResults = activeIds
    ? wodResults.filter((row) => activeIds.has(String(row?.usuario_id || "")))
    : wodResults

  const expected = activeAthleteCount * publishedWodCount
  const uniquePairs = new Set(
    eligibleResults
      .filter((row) => row?.usuario_id && row?.wod_id)
      .map((row) => `${row.usuario_id}:${row.wod_id}`)
  )

  return Math.min(100, Math.round((uniquePairs.size / expected) * 100))
}

function getAge(dateOfBirth, now = new Date()) {
  const date = parseLocalDate(dateOfBirth)
  const today = startOfDay(now)
  if (!date || !today) return null

  let age = today.getUTCFullYear() - date.getUTCFullYear()
  const month = today.getUTCMonth() - date.getUTCMonth()
  if (month < 0 || (month === 0 && today.getUTCDate() < date.getUTCDate())) age -= 1
  return age >= 0 && age < 120 ? age : null
}

function normalizeGender(value) {
  const gender = String(value || "").trim().toLowerCase()
  if (["m", "male", "masculino", "hombre"].includes(gender)) return "male"
  if (["f", "female", "femenino", "mujer"].includes(gender)) return "female"
  return "unspecified"
}

function newestDate(...values) {
  const dates = values.flat().map((value) => dateFromRow(value)).filter(Boolean)
  if (!dates.length) return null
  return new Date(Math.max(...dates.map((date) => date.getTime())))
}

function dateKey(row) {
  const date = dateFromRow(row)
  return date ? formatDateIso(date) : ""
}


function latestMembershipAtDate(memberships = [], athleteId, cutoffDate) {
  const userId = String(athleteId || "")
  if (!userId || !cutoffDate) return null

  const eligible = memberships
    .filter((membership) => String(membership?.usuario_id || "") === userId)
    .filter((membership) => {
      const start = parseLocalDate(membership?.fecha_inicio || membership?.created_at)
      return !start || start <= cutoffDate
    })
    .sort((a, b) => {
      const aStart = parseLocalDate(a?.fecha_inicio || a?.created_at)?.getTime() || 0
      const bStart = parseLocalDate(b?.fecha_inicio || b?.created_at)?.getTime() || 0
      if (aStart !== bStart) return bStart - aStart

      const aEnd = parseLocalDate(a?.fecha_fin)?.getTime() || 0
      const bEnd = parseLocalDate(b?.fecha_fin)?.getTime() || 0
      return bEnd - aEnd
    })

  return eligible[0] || null
}

export function buildAthleteGrowthSeries({
  athletes = [],
  memberships = [],
  range,
  locale = "es",
}) {
  const buckets = buildBuckets(range, locale)
  const totalAthletes = Math.max(athletes.length, 1)

  return buckets.map((bucket) => {
    const registered = athletes.filter((athlete) => {
      const createdAt = parseLocalDate(athlete?.created_at)
      return !createdAt || createdAt <= bucket.end
    }).length

    const newAthletes = athletes.filter((athlete) => {
      const createdAt = parseLocalDate(athlete?.created_at)
      return createdAt && createdAt >= bucket.start && createdAt <= bucket.end
    }).length

    const departed = athletes.filter((athlete) => {
      const createdAt = parseLocalDate(athlete?.created_at)
      if (createdAt && createdAt > bucket.end) return false

      const membership = latestMembershipAtDate(memberships, athlete?.id, bucket.end)
      if (!membership || getMembershipStatus(membership, bucket.end).status !== "expired") return false

      const end = parseLocalDate(membership?.fecha_fin)
      return Boolean(end && end >= bucket.start && end <= bucket.end)
    }).length

    return {
      label: bucket.label,
      registered,
      departed,
      newAthletes,
      registeredPercent: Math.round((registered / totalAthletes) * 1000) / 10,
      departedPercent: Math.round((departed / totalAthletes) * 1000) / 10,
      newAthletesPercent: Math.round((newAthletes / totalAthletes) * 1000) / 10,
    }
  })
}

export function buildNutritionGoalSeries({
  athletes = [],
  nutritionProfiles = [],
}) {
  if (!Array.isArray(nutritionProfiles)) return []

  const athleteIds = new Set(athletes.map((athlete) => String(athlete?.id || "")).filter(Boolean))
  const latestByAthlete = new Map()

  nutritionProfiles.forEach((profile) => {
    const athleteId = String(profile?.usuario_id || "")
    if (!athleteIds.has(athleteId)) return

    const current = latestByAthlete.get(athleteId)
    const currentDate = parseLocalDate(current?.updated_at || current?.created_at)?.getTime() || 0
    const nextDate = parseLocalDate(profile?.updated_at || profile?.created_at)?.getTime() || 0

    if (!current || nextDate >= currentDate) {
      latestByAthlete.set(athleteId, profile)
    }
  })

  const counts = {
    perder_grasa: 0,
    recomposicion: 0,
    ganar_masa_muscular: 0,
    mejorar_rendimiento: 0,
    sin_meta: 0,
  }

  athletes.forEach((athlete) => {
    const profile = latestByAthlete.get(String(athlete?.id || ""))
    const goal = String(profile?.meta || "").trim()

    if (Object.prototype.hasOwnProperty.call(counts, goal) && goal !== "sin_meta") {
      counts[goal] += 1
    } else {
      counts.sin_meta += 1
    }
  })

  return Object.entries(counts).map(([key, value]) => ({
    key,
    value,
    percentage: athletes.length ? Math.round((value / athletes.length) * 1000) / 10 : 0,
  }))
}

export function buildAthleteStatistics({ athletes = [], memberships = [], nutritionProfiles = [], wodResults = [], prRecords = [], attendance = [], recentWodResults = wodResults, recentPrRecords = prRecords, recentAttendance = attendance, range, locale = "es", now = new Date() }) {
  const membershipData = buildMembershipSummary(athletes, memberships, now)
  const activityMap = new Map()

  athletes.forEach((athlete) => {
    activityMap.set(String(athlete.id), {
      wods: 0,
      prs: 0,
      attendance: 0,
      activeDays: new Set(),
      lastActivity: null,
    })
  })

  const register = (rows, userField, field) => {
    rows.forEach((row) => {
      const userId = String(row?.[userField] || "")
      const date = dateFromRow(row)
      if (!userId || !date || !activityMap.has(userId)) return
      const current = activityMap.get(userId)
      current[field] += 1
      current.activeDays.add(formatDateIso(date))
      if (!current.lastActivity || date > current.lastActivity) current.lastActivity = date
    })
  }

  register(wodResults, "usuario_id", "wods")
  register(prRecords, "usuario", "prs")
  register(attendance, "usuario_id", "attendance")

  const rows = athletes.map((athlete) => {
    const id = String(athlete.id)
    const activity = activityMap.get(id) || { wods: 0, prs: 0, attendance: 0, activeDays: new Set(), lastActivity: null }
    const membership = membershipData.latest.get(id) || null
    const membershipStatus = getMembershipStatus(membership, now)
    const score = activity.wods * 3 + activity.prs * 2 + activity.attendance

    return {
      id: athlete.id,
      nombre: athlete.nombre || athlete.email || fallbackLabel(locale, "athlete"),
      email: athlete.email || "",
      fotoUrl: athlete.foto_url || "",
      sexo: normalizeGender(athlete.sexo),
      fechaNacimiento: athlete.fecha_nacimiento || null,
      createdAt: athlete.created_at || null,
      membership,
      membershipStatus,
      wods: activity.wods,
      prs: activity.prs,
      attendance: activity.attendance,
      activeDays: activity.activeDays.size,
      lastActivity: activity.lastActivity ? formatDateIso(activity.lastActivity) : null,
      score,
    }
  }).sort((a, b) => b.score - a.score || a.nombre.localeCompare(b.nombre))

  const activityIds = new Set(rows.filter((row) => row.wods + row.prs + row.attendance > 0).map((row) => String(row.id)))
  const newInPeriod = athletes.filter((athlete) => {
    const date = parseLocalDate(athlete.created_at)
    return date && date >= range.start && date <= range.end
  }).length
  const membershipsByUser = new Map()
  memberships.forEach((membership) => {
    const userId = String(membership?.usuario_id || "")
    if (!userId) return
    if (!membershipsByUser.has(userId)) membershipsByUser.set(userId, [])
    membershipsByUser.get(userId).push(membership)
  })

  const memberDays = athletes
    .map((athlete) => getMemberStartDate(membershipsByUser.get(String(athlete.id)) || [], athlete.created_at))
    .filter(Boolean)
    .map((date) => Math.max(0, Math.floor((startOfDay(now).getTime() - date.getTime()) / DAY_MS)))

  const recentActivityMap = new Map()
  const registerRecent = (items, userField) => {
    items.forEach((item) => {
      const id = String(item?.[userField] || "")
      const date = dateFromRow(item)
      if (!id || !date) return
      const current = recentActivityMap.get(id)
      if (!current || date > current) recentActivityMap.set(id, date)
    })
  }
  registerRecent(recentWodResults, "usuario_id")
  registerRecent(recentPrRecords, "usuario")
  registerRecent(recentAttendance, "usuario_id")

  const inactivity = { days7: 0, days14: 0, days30: 0 }
  rows.forEach((row) => {
    if (!row.membershipStatus.active) return
    const last = recentActivityMap.get(String(row.id)) || null
    const days = last ? Math.floor((startOfDay(now) - startOfDay(last)) / DAY_MS) : 999
    if (days >= 7) inactivity.days7 += 1
    if (days >= 14) inactivity.days14 += 1
    if (days >= 30) inactivity.days30 += 1
  })

  const genders = { male: 0, female: 0, unspecified: 0 }
  athletes.forEach((athlete) => { genders[normalizeGender(athlete.sexo)] += 1 })

  const ages = { under18: 0, age18_24: 0, age25_34: 0, age35_44: 0, age45_54: 0, age55Plus: 0, unspecified: 0 }
  athletes.forEach((athlete) => {
    const age = getAge(athlete.fecha_nacimiento, now)
    if (age === null) ages.unspecified += 1
    else if (age < 18) ages.under18 += 1
    else if (age <= 24) ages.age18_24 += 1
    else if (age <= 34) ages.age25_34 += 1
    else if (age <= 44) ages.age35_44 += 1
    else if (age <= 54) ages.age45_54 += 1
    else ages.age55Plus += 1
  })

  return {
    summary: {
      total: athletes.length,
      active: membershipData.summary.active,
      expiring: membershipData.summary.expiring,
      expired: membershipData.summary.expired,
      upcoming: membershipData.summary.upcoming,
      missing: membershipData.summary.missing,
      newInPeriod,
      activeInPeriod: activityIds.size,
      activityRate: athletes.length ? Math.round((activityIds.size / athletes.length) * 100) : 0,
      averageMemberDays: memberDays.length ? Math.round(memberDays.reduce((sum, value) => sum + value, 0) / memberDays.length) : 0,
    },
    growthSeries: buildAthleteGrowthSeries({
      athletes,
      memberships,
      range,
      locale,
    }),
    nutritionSeries: buildNutritionGoalSeries({
      athletes,
      nutritionProfiles,
    }),
    genderSeries: [
      { key: "male", value: genders.male },
      { key: "female", value: genders.female },
      { key: "unspecified", value: genders.unspecified },
    ],
    ageSeries: Object.entries(ages).map(([key, value]) => ({ key, value })),
    inactivity,
    rows,
  }
}

function median(values = []) {
  const sorted = values
    .map((value) => Number(value))
    .filter(Number.isFinite)
    .sort((a, b) => a - b)

  if (!sorted.length) return 0
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2) return sorted[middle]
  return (sorted[middle - 1] + sorted[middle]) / 2
}

function roundOne(value) {
  return Math.round(Number(value || 0) * 10) / 10
}

function isDateInsideRange(value, range) {
  const date = parseLocalDate(value)
  return Boolean(date && range && date >= range.start && date <= range.end)
}

function buildPrComparisonEvents(prRecords = []) {
  const groups = new Map()

  prRecords.forEach((row) => {
    const userId = String(row?.usuario || "")
    const exerciseId = String(row?.ejercicio_id || "")
    if (!userId || !exerciseId) return

    const key = `${userId}:${exerciseId}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
  })

  const events = []
  groups.forEach((rows) => {
    const sorted = [...rows].sort((a, b) => {
      const dateDifference = (dateFromRow(a)?.getTime() || 0) - (dateFromRow(b)?.getTime() || 0)
      if (dateDifference) return dateDifference
      return String(a?.created_at || "").localeCompare(String(b?.created_at || ""))
    })

    for (let index = 1; index < sorted.length; index += 1) {
      const previous = Number(sorted[index - 1]?.peso_libras || 0)
      const current = Number(sorted[index]?.peso_libras || 0)
      if (!previous || !current) continue

      const difference = current - previous
      events.push({
        userId: String(sorted[index].usuario),
        exerciseId: String(sorted[index].ejercicio_id),
        previous,
        current,
        difference: roundOne(difference),
        percent: roundOne((difference / previous) * 100),
        improved: difference > 0,
        date: sorted[index].fecha || sorted[index].created_at,
        currentRowId: sorted[index].id,
      })
    }
  })

  return events
}

function buildImprovementEvents(prRecords = []) {
  return buildPrComparisonEvents(prRecords).filter((row) => row.improved)
}

function buildPrFirstMarkEvents(historyRecords = [], range) {
  const groups = new Map()

  historyRecords.forEach((row) => {
    const userId = String(row?.usuario || "")
    const exerciseId = String(row?.ejercicio_id || "")
    if (!userId || !exerciseId) return
    const key = `${userId}:${exerciseId}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
  })

  const firstMarks = []
  groups.forEach((rows) => {
    const first = [...rows].sort((a, b) => (dateFromRow(a)?.getTime() || 0) - (dateFromRow(b)?.getTime() || 0))[0]
    if (first && isDateInsideRange(first.fecha || first.created_at, range)) firstMarks.push(first)
  })

  return firstMarks
}

function buildPrTrendSeries({ periodRecords = [], comparisons = [], firstMarks = [], range, locale = "es" }) {
  const buckets = buildBuckets(range, locale)
  const rows = new Map(buckets.map((bucket) => [bucket.key, {
    records: 0,
    athletes: new Set(),
    improvements: 0,
    firstMarks: 0,
  }]))

  periodRecords.forEach((row) => {
    const date = dateFromRow(row)
    const bucket = date ? findBucket(buckets, date) : null
    if (!bucket) return
    const current = rows.get(bucket.key)
    current.records += 1
    if (row.usuario) current.athletes.add(String(row.usuario))
  })

  comparisons.filter((row) => row.improved).forEach((row) => {
    const date = parseLocalDate(row.date)
    const bucket = date ? findBucket(buckets, date) : null
    if (bucket) rows.get(bucket.key).improvements += 1
  })

  firstMarks.forEach((row) => {
    const date = dateFromRow(row)
    const bucket = date ? findBucket(buckets, date) : null
    if (bucket) rows.get(bucket.key).firstMarks += 1
  })

  return buckets.map((bucket) => {
    const current = rows.get(bucket.key)
    return {
      label: bucket.label,
      records: current.records,
      athletes: current.athletes.size,
      improvements: current.improvements,
      firstMarks: current.firstMarks,
      value: current.records,
    }
  })
}

function buildPrCollectiveSeries(rows = [], range, locale = "es") {
  const buckets = buildBuckets(range, locale)
  const groups = new Map()

  rows.forEach((row) => {
    const userId = String(row?.usuario || "")
    if (!userId) return
    if (!groups.has(userId)) groups.set(userId, [])
    groups.get(userId).push(row)
  })

  const prepared = Array.from(groups.entries()).map(([userId, userRows]) => {
    const history = [...userRows].sort((a, b) => (dateFromRow(a)?.getTime() || 0) - (dateFromRow(b)?.getTime() || 0))
    const beforeRange = history.filter((row) => {
      const date = dateFromRow(row)
      return date && date < range.start
    })
    const withinRange = history.filter((row) => isDateInsideRange(row.fecha || row.created_at, range))
    const baselineRow = beforeRange.at(-1) || withinRange[0] || null
    const baseline = Number(baselineRow?.peso_libras || 0)
    return { userId, history, baseline }
  }).filter((row) => row.baseline > 0)

  return buckets.map((bucket) => {
    const indexes = []

    prepared.forEach((athlete) => {
      const latest = athlete.history.filter((row) => {
        const date = dateFromRow(row)
        return date && date <= bucket.end
      }).at(-1)
      const current = Number(latest?.peso_libras || 0)
      if (!current) return
      indexes.push((current / athlete.baseline) * 100)
    })

    return {
      label: bucket.label,
      value: indexes.length ? roundOne(median(indexes)) : 0,
      athletes: indexes.length,
    }
  })
}

function buildPrExerciseStatistics({ periodRecords = [], historyRecords = [], exercises = [], athletes = [], comparisons = [], range, locale = "es" }) {
  const exerciseMap = new Map(exercises.map((item) => [String(item.id), item.nombre || fallbackLabel(locale, "exercise")]))
  const athleteMap = new Map(athletes.map((item) => [String(item.id), item]))
  const periodGroups = new Map()
  const historyGroups = new Map()

  periodRecords.forEach((row) => {
    const exerciseId = String(row?.ejercicio_id || "")
    if (!exerciseId) return
    if (!periodGroups.has(exerciseId)) periodGroups.set(exerciseId, [])
    periodGroups.get(exerciseId).push(row)
  })

  historyRecords.forEach((row) => {
    const exerciseId = String(row?.ejercicio_id || "")
    if (!exerciseId) return
    if (!historyGroups.has(exerciseId)) historyGroups.set(exerciseId, [])
    historyGroups.get(exerciseId).push(row)
  })

  return Array.from(periodGroups.entries()).map(([exerciseId, rows]) => {
    const allRows = historyGroups.get(exerciseId) || rows
    const exerciseComparisons = comparisons.filter((row) => row.exerciseId === exerciseId && isDateInsideRange(row.date, range))
    const comparableAthletes = new Set(exerciseComparisons.map((row) => row.userId))
    const improvedEvents = exerciseComparisons.filter((row) => row.improved)
    const improvedAthletes = new Set(improvedEvents.map((row) => row.userId))
    const uniqueAthletes = new Set(rows.map((row) => String(row.usuario || "")).filter(Boolean))
    const rankingGroups = new Map()

    allRows.forEach((row) => {
      const userId = String(row?.usuario || "")
      if (!userId) return
      if (!rankingGroups.has(userId)) rankingGroups.set(userId, [])
      rankingGroups.get(userId).push(row)
    })

    const rankingRows = Array.from(rankingGroups.entries()).map(([userId, athleteRows]) => {
      const history = [...athleteRows]
        .sort((a, b) => (dateFromRow(a)?.getTime() || 0) - (dateFromRow(b)?.getTime() || 0))
        .map((row) => ({
          id: row.id,
          date: row.fecha || row.created_at,
          weight: Number(row.peso_libras || 0),
        }))
      const latest = history.at(-1) || null
      const previous = history.length > 1 ? history.at(-2) : null
      const best = history.reduce((current, row) => !current || row.weight > current.weight ? row : current, null)
      const athlete = athleteMap.get(userId) || {}
      const difference = latest && previous ? roundOne(latest.weight - previous.weight) : 0
      const percent = latest && previous && previous.weight ? roundOne((difference / previous.weight) * 100) : 0

      return {
        userId,
        nombre: athlete.nombre || athlete.email || fallbackLabel(locale, "athlete"),
        fotoUrl: athlete.foto_url || athlete.fotoUrl || "",
        sexo: normalizeGender(athlete.sexo),
        bestWeight: best?.weight || 0,
        currentWeight: latest?.weight || 0,
        previousWeight: previous?.weight || 0,
        difference,
        percent,
        records: history.length,
        date: best?.date || latest?.date || null,
      }
    }).sort((a, b) => b.bestWeight - a.bestWeight || a.nombre.localeCompare(b.nombre))

    let lastBestWeight = null
    let lastRankingPosition = 0
    const ranking = rankingRows.map((row, index) => {
      const position = index > 0 && Number(row.bestWeight) === Number(lastBestWeight)
        ? lastRankingPosition
        : index + 1

      lastBestWeight = row.bestWeight
      lastRankingPosition = position
      return { ...row, position }
    })

    const positivePercents = improvedEvents.map((row) => row.percent)
    const positiveDifferences = improvedEvents.map((row) => row.difference)
    const latestDate = [...rows].sort((a, b) => (dateFromRow(b)?.getTime() || 0) - (dateFromRow(a)?.getTime() || 0))[0]
    const earliestDate = [...rows].sort((a, b) => (dateFromRow(a)?.getTime() || 0) - (dateFromRow(b)?.getTime() || 0))[0]

    return {
      exerciseId,
      exercise: exerciseMap.get(exerciseId) || fallbackLabel(locale, "exercise"),
      periodRecords: rows.length,
      totalRecords: allRows.length,
      uniqueAthletes: uniqueAthletes.size,
      comparableAthletes: comparableAthletes.size,
      improvedAthletes: improvedAthletes.size,
      improvementRate: comparableAthletes.size ? roundOne((improvedAthletes.size / comparableAthletes.size) * 100) : 0,
      averageImprovement: positivePercents.length ? roundOne(positivePercents.reduce((sum, value) => sum + value, 0) / positivePercents.length) : 0,
      medianImprovement: positivePercents.length ? roundOne(median(positivePercents)) : 0,
      averageIncrease: positiveDifferences.length ? roundOne(positiveDifferences.reduce((sum, value) => sum + value, 0) / positiveDifferences.length) : 0,
      firstDate: earliestDate?.fecha || earliestDate?.created_at || null,
      latestDate: latestDate?.fecha || latestDate?.created_at || null,
      collectiveSeries: buildPrCollectiveSeries(allRows, range, locale),
      ranking,
      recentMarks: [...rows]
        .sort((a, b) => (dateFromRow(b)?.getTime() || 0) - (dateFromRow(a)?.getTime() || 0))
        .slice(0, 30)
        .map((row) => {
          const athlete = athleteMap.get(String(row.usuario || "")) || {}
          return {
            id: row.id,
            userId: String(row.usuario || ""),
            nombre: athlete.nombre || athlete.email || fallbackLabel(locale, "athlete"),
            fotoUrl: athlete.foto_url || athlete.fotoUrl || "",
            weight: Number(row.peso_libras || 0),
            date: row.fecha || row.created_at,
          }
        }),
    }
  }).sort((a, b) => b.periodRecords - a.periodRecords || b.improvementRate - a.improvementRate || a.exercise.localeCompare(b.exercise))
}

export function buildPrStatistics({ prRecords = [], historyRecords = prRecords, exercises = [], athletes = [], range, locale = "es" }) {
  const exerciseMap = new Map(exercises.map((item) => [String(item.id), item.nombre || fallbackLabel(locale, "exercise")]))
  const athleteMap = new Map(athletes.map((item) => [String(item.id), item]))
  const uniqueAthletes = new Set(prRecords.map((row) => String(row.usuario || "")).filter(Boolean))
  const uniqueExercises = new Set(prRecords.map((row) => String(row.ejercicio_id || "")).filter(Boolean))
  const allComparisons = buildPrComparisonEvents(historyRecords)
  const comparisons = allComparisons.filter((row) => isDateInsideRange(row.date, range))
  const improvements = comparisons.filter((row) => row.improved)
  const firstMarks = buildPrFirstMarkEvents(historyRecords, range)
  const comparablePairs = new Set(comparisons.map((row) => `${row.userId}:${row.exerciseId}`))
  const improvedPairs = new Set(improvements.map((row) => `${row.userId}:${row.exerciseId}`))
  const athleteRows = new Map()

  prRecords.forEach((row) => {
    const id = String(row.usuario || "")
    if (!id) return
    const current = athleteRows.get(id) || { userId: id, count: 0, exercises: new Set(), latest: null }
    current.count += 1
    current.exercises.add(String(row.ejercicio_id || ""))
    const date = dateFromRow(row)
    if (date && (!current.latest || date > current.latest)) current.latest = date
    athleteRows.set(id, current)
  })

  const topAthletes = Array.from(athleteRows.values()).map((row) => {
    const athlete = athleteMap.get(row.userId) || {}
    const athleteImprovements = improvements.filter((event) => event.userId === row.userId)
    return {
      userId: row.userId,
      nombre: athlete.nombre || athlete.email || fallbackLabel(locale, "athlete"),
      fotoUrl: athlete.foto_url || "",
      count: row.count,
      exercises: row.exercises.size,
      improvements: new Set(athleteImprovements.map((event) => event.exerciseId)).size,
      averageImprovement: athleteImprovements.length
        ? roundOne(athleteImprovements.reduce((sum, event) => sum + event.percent, 0) / athleteImprovements.length)
        : 0,
      latest: row.latest ? formatDateIso(row.latest) : null,
    }
  }).sort((a, b) => b.count - a.count || b.improvements - a.improvements || a.nombre.localeCompare(b.nombre)).slice(0, 10)

  const improvementLeaders = [...improvements]
    .sort((a, b) => b.percent - a.percent || b.difference - a.difference)
    .slice(0, 12)
    .map((row) => {
      const athlete = athleteMap.get(row.userId) || {}
      return {
        ...row,
        nombre: athlete.nombre || athlete.email || fallbackLabel(locale, "athlete"),
        fotoUrl: athlete.foto_url || "",
        exercise: exerciseMap.get(row.exerciseId) || fallbackLabel(locale, "exercise"),
      }
    })

  const positivePercents = improvements.map((row) => row.percent)
  const exerciseStats = buildPrExerciseStatistics({
    periodRecords: prRecords,
    historyRecords,
    exercises,
    athletes,
    comparisons: allComparisons,
    range,
    locale,
  })

  return {
    summary: {
      total: prRecords.length,
      uniqueAthletes: uniqueAthletes.size,
      uniqueExercises: uniqueExercises.size,
      averagePerAthlete: uniqueAthletes.size ? roundOne(prRecords.length / uniqueAthletes.size) : 0,
      improvementCount: improvements.length,
      averageImprovement: positivePercents.length ? roundOne(positivePercents.reduce((sum, row) => sum + row, 0) / positivePercents.length) : 0,
      medianImprovement: positivePercents.length ? roundOne(median(positivePercents)) : 0,
      improvementRate: comparablePairs.size ? roundOne((improvedPairs.size / comparablePairs.size) * 100) : 0,
      coverageRate: athletes.length ? roundOne((uniqueAthletes.size / athletes.length) * 100) : 0,
      firstMarks: firstMarks.length,
      comparablePairs: comparablePairs.size,
    },
    trendSeries: buildPrTrendSeries({ periodRecords: prRecords, comparisons, firstMarks, range, locale }),
    topMovements: buildPrMovementSeries(prRecords, exercises, 8, locale),
    topAthletes,
    improvementLeaders,
    exerciseStats,
  }
}

function buildAthletePrExercises(prRecords = [], exercises = [], locale = "es") {
  const exerciseMap = new Map(exercises.map((item) => [String(item.id), item.nombre || fallbackLabel(locale, "exercise")]))
  const groups = new Map()

  prRecords.forEach((row) => {
    const key = String(row.ejercicio_id || "")
    if (!key) return
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
  })

  return Array.from(groups.entries()).map(([exerciseId, rows]) => {
    const history = [...rows]
      .sort((a, b) => (dateFromRow(a)?.getTime() || 0) - (dateFromRow(b)?.getTime() || 0))
      .map((row) => ({
        id: row.id,
        date: row.fecha || row.created_at,
        weight: Number(row.peso_libras || 0),
      }))
    const latest = history.at(-1) || null
    const previous = history.length > 1 ? history.at(-2) : null
    const best = history.reduce((current, row) => !current || row.weight > current.weight ? row : current, null)
    const improvement = previous && latest && latest.weight > previous.weight
      ? {
          difference: Math.round((latest.weight - previous.weight) * 10) / 10,
          percent: Math.round(((latest.weight - previous.weight) / previous.weight) * 1000) / 10,
        }
      : null

    return {
      exerciseId,
      exercise: exerciseMap.get(exerciseId) || fallbackLabel(locale, "exercise"),
      records: history.length,
      latest,
      previous,
      best,
      improvement,
      history,
    }
  }).sort((a, b) => (b.latest?.date || "").localeCompare(a.latest?.date || "") || a.exercise.localeCompare(b.exercise))
}

export function buildAthleteDetail({ athlete, memberships = [], exercises = [], prRecords = [], wodResults = [], totalWodCount = 0, latestWod = null, attendance = [], latestAttendance = null, range, locale = "es", now = new Date(), diagnostics = [] }) {
  if (!athlete) return { ...EMPTY_ATHLETE_DETAIL, range: { days: range.days, startIso: range.startIso, endIso: range.endIso }, diagnostics }

  const membershipHistory = [...memberships].sort(compareMembershipsLatestFirst)
  const membership = selectRelevantMembership(membershipHistory, now)
  const membershipStatus = getMembershipStatus(membership, now)
  const prPeriod = prRecords.filter((row) => {
    const date = dateFromRow(row)
    return date && date >= range.start && date <= range.end
  })
  const prExercises = buildAthletePrExercises(prRecords, exercises, locale)
  const prHistory = [...prRecords].sort((a, b) => (dateFromRow(b)?.getTime() || 0) - (dateFromRow(a)?.getTime() || 0)).map((row) => ({
    id: row.id,
    exerciseId: String(row.ejercicio_id || ""),
    exercise: exercises.find((item) => String(item.id) === String(row.ejercicio_id))?.nombre || fallbackLabel(locale, "exercise"),
    weight: Number(row.peso_libras || 0),
    date: row.fecha || row.created_at,
  }))
  const latestPr = prHistory[0] || null
  const activeDates = new Set([
    ...wodResults.map(dateKey),
    ...prPeriod.map(dateKey),
    ...attendance.map(dateKey),
  ].filter(Boolean))
  const lastActivityDate = newestDate(latestWod, prRecords.at(-1), latestAttendance)
  const memberStart = getMemberStartDate(membershipHistory, athlete.created_at)
  const memberDays = memberStart ? Math.max(0, Math.floor((startOfDay(now).getTime() - memberStart.getTime()) / DAY_MS)) : 0
  const weeks = Math.max(range.days / 7, 1)
  const improvementEvents = buildImprovementEvents(prRecords)
  const biggestImprovement = [...improvementEvents].sort((a, b) => b.percent - a.percent)[0] || null

  const alerts = []
  if (membershipStatus.status === "expiring") alerts.push({ code: "membershipExpiring", value: membershipStatus.daysLeft })
  if (membershipStatus.status === "expired") alerts.push({ code: "membershipExpired" })
  if (membershipStatus.status === "missing") alerts.push({ code: "membershipMissing" })
  const daysWithoutActivity = lastActivityDate ? Math.floor((startOfDay(now) - startOfDay(lastActivityDate)) / DAY_MS) : 999
  if (daysWithoutActivity >= 14) alerts.push({ code: "inactive", value: daysWithoutActivity })
  if (!prRecords.length) alerts.push({ code: "noPr" })
  if (prPeriod.length >= 3) alerts.push({ code: "prProgress", value: prPeriod.length })

  return {
    athlete: {
      id: athlete.id,
      nombre: athlete.nombre || athlete.email || fallbackLabel(locale, "athlete"),
      email: athlete.email || "",
      fotoUrl: athlete.foto_url || athlete.fotoUrl || "",
      sexo: normalizeGender(athlete.sexo),
      fechaNacimiento: athlete.fecha_nacimiento || athlete.fechaNacimiento || null,
      createdAt: athlete.created_at || athlete.createdAt || null,
    },
    range: { days: range.days, startIso: range.startIso, endIso: range.endIso },
    membership,
    membershipStatus,
    summary: {
      totalWods: Number(totalWodCount || 0),
      periodWods: wodResults.length,
      totalPrs: prRecords.length,
      periodPrs: prPeriod.length,
      activeDays: activeDates.size,
      averageWeeklyWods: Math.round((wodResults.length / weeks) * 10) / 10,
      lastActivity: lastActivityDate ? formatDateIso(lastActivityDate) : null,
      memberDays,
    },
    activitySeries: buildAthleteActivitySeries({ range, locale, wodResults, prRecords: prPeriod, attendance }),
    membershipHistory: membershipHistory.map((row) => ({ ...row, status: getMembershipStatus(row, now) })),
    alerts,
    prSummary: {
      total: prRecords.length,
      period: prPeriod.length,
      exercises: prExercises.length,
      latest: latestPr,
      biggestImprovement,
    },
    prExercises,
    prHistory,
    diagnostics,
  }
}

export function buildLinePoints(series = [], width = 720, height = 210, padding = 18) {
  const safe = series.length ? series : [{ value: 0 }]
  const maxValue = Math.max(...safe.map((item) => Number(item.value || item.total || 0)), 1)
  const usableWidth = width - padding * 2
  const usableHeight = height - padding * 2

  return safe.map((item, index) => {
    const value = Number(item.value ?? item.total ?? 0)
    const x = safe.length === 1 ? width / 2 : padding + (index / (safe.length - 1)) * usableWidth
    const y = height - padding - (value / maxValue) * usableHeight
    return { ...item, value, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }
  })
}

export function formatPercent(value) {
  return `${Math.max(0, Math.min(100, Number(value || 0)))}%`
}

function escapeCsv(value) {
  const text = String(value ?? "")
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function csvWodCategoryLabel(copy, key) {
  const labels = {
    strength: copy.wodCategoryStrength,
    weightlifting: copy.wodCategoryWeightlifting,
    gymnastics: copy.wodCategoryGymnastics,
    cardio: copy.wodCategoryCardio,
    mixed: copy.wodCategoryMixed,
    metcon: copy.wodCategoryMetcon,
    other: copy.wodCategoryOther,
  }

  return labels[key] || labels.other || String(key || "")
}

export function buildStatisticsCsv(data, copy, locale = "es") {
  const rows = [
    [copy.csvSection, copy.csvMetric, copy.csvValue],
    [copy.summary, copy.activeAthletes, data.summary.activeAthletes],
    [copy.summary, copy.expiringSoon, data.summary.expiringSoon],
    [copy.summary, copy.wodParticipation, formatPercent(data.summary.wodParticipationRate)],
    [copy.summary, copy.registeredPrs, data.summary.prCount],
    [copy.athletes, copy.totalAthletes, data.athleteStats.summary.total],
    [copy.athletes, copy.newAthletes, data.athleteStats.summary.newInPeriod],
    [copy.athletes, copy.activeInPeriod, data.athleteStats.summary.activeInPeriod],
    [copy.prs, copy.uniqueAthletesWithPr, data.prStats.summary.uniqueAthletes],
    [copy.prs, copy.uniqueExercisesWithPr, data.prStats.summary.uniqueExercises],
    [copy.prs, copy.averagePrPerAthlete, data.prStats.summary.averagePerAthlete],
    [copy.wods, copy.totalWodsPeriod, data.wodStats?.summary?.totalWods || 0],
    [copy.wods, copy.wodResultsRegistered, data.wodStats?.summary?.totalResults || 0],
    [copy.wods, copy.wodAthletesParticipating, data.wodStats?.summary?.uniqueAthletes || 0],
    [copy.wods, copy.averageWodParticipation, formatPercent(data.wodStats?.summary?.averageParticipation || 0)],
    [copy.memberships, copy.active, data.membershipSummary.active],
    [copy.memberships, copy.expiring, data.membershipSummary.expiring],
    [copy.memberships, copy.expired, data.membershipSummary.expired],
    [copy.memberships, copy.upcoming, data.membershipSummary.upcoming],
    [copy.memberships, copy.missing, data.membershipSummary.missing],
    [],
    [copy.csvSection, copy.csvLabel, copy.csvCount],
    ...data.activitySeries.map((item) => [copy.activityTitle, item.label, item.value]),
    ...data.wodWeekSeries.map((item) => [copy.participationByDay, item.label, item.value]),
    ...(data.wodStats?.categorySeries || []).map((item) => [copy.wodTypeDistribution, csvWodCategoryLabel(copy, item.key), item.value]),
    ...(data.wodStats?.groupPerformanceSeries || []).flatMap((category) =>
      (category.series || []).map((item) => [copy.groupPerformanceIndex, `${csvWodCategoryLabel(copy, category.key)}: ${item.name}`, `${item.score}%`])
    ),
    ...data.prMovementSeries.map((item) => [copy.topPrMovements, item.label, item.value]),
    [],
    [copy.periodLabel, `${data.range.startIso} - ${data.range.endIso}`],
    [copy.generatedAt, new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", { dateStyle: "medium", timeStyle: "short", timeZone: STATISTICS_TIME_ZONE }).format(new Date())],
  ]

  return `\uFEFF${rows.map((row) => row.map(escapeCsv).join(",")).join("\n")}`
}


function normalizeWodText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function wodDate(row) {
  return parseLocalDate(row?.fecha || row?.created_at)
}

function wodFamilyKey(wod) {
  const rawName = normalizeWodText(wod?.nombre)
    .replace(/\b(?:wod|workout|entrenamiento)\b/g, " ")
    .replace(/\b\d{4}\s+\d{1,2}\s+\d{1,2}\b/g, " ")
    .replace(/\b\d{1,2}\s+\d{1,2}\s+\d{2,4}\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  if (rawName.length >= 3) return rawName

  return normalizeWodText(wod?.descripcion).slice(0, 140) || String(wod?.id || "wod")
}

export function classifyWodCategory(wod) {
  const text = normalizeWodText([
    wod?.nombre,
    wod?.descripcion,
    wod?.modalidad,
    wod?.modo_ranking,
  ].filter(Boolean).join(" "))

  const domains = []
  const has = (words) => words.some((word) => text.includes(word))

  if (has([
    "fuerza", "strength", "back squat", "front squat", "overhead squat", "deadlift",
    "peso muerto", "sentadilla", "bench press", "strict press", "shoulder press",
  ])) domains.push("strength")

  if (has([
    "halterofilia", "weightlifting", "snatch", "clean", "jerk", "arranque", "envion",
    "clean and jerk", "power clean", "squat clean", "power snatch", "thruster",
  ])) domains.push("weightlifting")

  if (has([
    "gimnasia", "gymnastics", "pull up", "pullup", "toes to bar", "t2b", "hspu",
    "handstand", "muscle up", "muscleup", "ring dip", "pistol", "rope climb",
  ])) domains.push("gymnastics")

  if (has([
    "cardio", "run", "running", "correr", "carrera", "row", "remo", "bike", "assault",
    "ski", "erg", "double under", "single under", "burpee",
  ])) domains.push("cardio")

  const uniqueDomains = [...new Set(domains)]
  if (uniqueDomains.length > 1) return "mixed"
  if (uniqueDomains.length === 1) return uniqueDomains[0]

  if (has(["amrap", "emom", "for time", "por tiempo", "metcon", "chipper", "tabata"])) {
    return "metcon"
  }

  return "other"
}

function resultHasMark(result) {
  return (
    Number(result?.tiempo_segundos || 0) > 0 ||
    Number(result?.repeticiones || 0) > 0 ||
    String(result?.tiempo_texto || "").trim().length > 0 ||
    String(result?.resultado || "").trim().length > 0
  )
}

function resultMetric(wod, result) {
  const mode = String(wod?.modo_ranking || "sin_ranking").toLowerCase()
  const seconds = Number(result?.tiempo_segundos || 0)
  const reps = Number(result?.repeticiones || 0)

  if (mode === "menor_es_mejor") {
    if (seconds > 0) return { value: seconds, higherIsBetter: false, completed: true, kind: "time" }
    if (reps > 0) return { value: reps, higherIsBetter: true, completed: false, kind: "reps" }
    return null
  }

  if (mode === "mayor_es_mejor") {
    if (reps > 0) return { value: reps, higherIsBetter: true, completed: true, kind: "reps" }
    if (seconds > 0) return { value: seconds, higherIsBetter: false, completed: true, kind: "time" }
    return null
  }

  if (reps > 0) return { value: reps, higherIsBetter: true, completed: true, kind: "reps" }
  if (seconds > 0) return { value: seconds, higherIsBetter: false, completed: true, kind: "time" }
  return null
}

function formatSecondsValue(value) {
  const seconds = Math.max(0, Math.round(Number(value || 0)))
  if (!seconds) return "—"
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`
  return `${minutes}:${String(rest).padStart(2, "0")}`
}

export function formatWodResultMark(wod, result) {
  if (!result) return "—"
  if (String(result?.tiempo_texto || "").trim()) return String(result.tiempo_texto)

  const mode = String(wod?.modo_ranking || "sin_ranking").toLowerCase()
  const seconds = Number(result?.tiempo_segundos || 0)
  const reps = Number(result?.repeticiones || 0)

  if (mode === "menor_es_mejor" && seconds > 0) return formatSecondsValue(seconds)
  if (reps > 0) return `${reps} reps`
  if (seconds > 0) return formatSecondsValue(seconds)
  if (String(result?.resultado || "").trim()) return String(result.resultado)
  return "—"
}

function compareWodResults(wod, a, b) {
  const mode = String(wod?.modo_ranking || "sin_ranking").toLowerCase()
  const aMetric = resultMetric(wod, a)
  const bMetric = resultMetric(wod, b)

  if (!aMetric && !bMetric) return (wodDate(a)?.getTime() || 0) - (wodDate(b)?.getTime() || 0)
  if (!aMetric) return 1
  if (!bMetric) return -1

  if (mode === "menor_es_mejor") {
    if (aMetric.completed !== bMetric.completed) return aMetric.completed ? -1 : 1
    if (aMetric.completed) return aMetric.value - bMetric.value
    return bMetric.value - aMetric.value
  }

  if (mode === "mayor_es_mejor") {
    if (aMetric.higherIsBetter) return bMetric.value - aMetric.value
    return aMetric.value - bMetric.value
  }

  return (wodDate(a)?.getTime() || 0) - (wodDate(b)?.getTime() || 0)
}

function sameRankingMark(wod, a, b) {
  const aMetric = resultMetric(wod, a)
  const bMetric = resultMetric(wod, b)
  if (!aMetric || !bMetric) return false
  return aMetric.completed === bMetric.completed && aMetric.value === bMetric.value
}

export function buildWodRanking({ wod, results = [], users = [], locale = "es" }) {
  const usersMap = new Map(users.map((user) => [String(user.id), user]))
  const mode = String(wod?.modo_ranking || "sin_ranking").toLowerCase()
  const marked = results.filter(resultHasMark)

  const toRankingRow = (result, position = null) => {
    const user = usersMap.get(String(result.usuario_id || "")) || {}
    return {
      id: result.id,
      position,
      userId: result.usuario_id,
      name: user.nombre || user.email || fallbackLabel(locale, "athlete"),
      photoUrl: user.foto_url || user.fotoUrl || "",
      gender: user.sexo || "",
      modality: result.modalidad || wod?.modalidad || "",
      mark: formatWodResultMark(wod, result),
      calories: Number(result.calorias_estimadas || 0),
      date: result.fecha || result.created_at,
    }
  }

  if (mode === "sin_ranking") {
    return marked.map((result) => toRankingRow(result, null))
  }

  const comparable = marked
    .filter((result) => Boolean(resultMetric(wod, result)))
    .slice()
    .sort((a, b) => compareWodResults(wod, a, b))
  const nonComparable = marked.filter((result) => !resultMetric(wod, result))

  let lastPosition = 0
  const ranked = comparable.map((result, index) => {
    const position = index > 0 && sameRankingMark(wod, result, comparable[index - 1])
      ? lastPosition
      : index + 1

    lastPosition = position
    return toRankingRow(result, position)
  })

  return [
    ...ranked,
    ...nonComparable.map((result) => toRankingRow(result, null)),
  ]
}


const MIN_GROUP_PERFORMANCE_RESULTS = 2

function resultTimestamp(row) {
  if (row?.created_at) {
    const createdAt = new Date(row.created_at)
    if (!Number.isNaN(createdAt.getTime())) return createdAt.getTime()
  }

  return parseLocalDate(row?.fecha)?.getTime() || 0
}

function uniqueLatestResultsByAthlete(results = []) {
  const latestByAthlete = new Map()

  results.filter(resultHasMark).forEach((result) => {
    const athleteId = String(result?.usuario_id || "")
    if (!athleteId) return

    const current = latestByAthlete.get(athleteId)
    if (!current || resultTimestamp(result) >= resultTimestamp(current)) {
      latestByAthlete.set(athleteId, result)
    }
  })

  return [...latestByAthlete.values()]
}

function normalizedModality(wod, result) {
  return normalizeWodText(result?.modalidad || wod?.modalidad || "general") || "general"
}

function averageNumbers(values = []) {
  const valid = values.map(Number).filter(Number.isFinite)
  if (!valid.length) return 0
  return valid.reduce((sum, value) => sum + value, 0) / valid.length
}

function roundedPercent(value) {
  const safe = Math.min(100, Math.max(0, Number(value || 0)))
  return Math.round(safe * 10) / 10
}

function chooseGroupMetricKind(wod, metricRows) {
  const mode = String(wod?.modo_ranking || "sin_ranking").toLowerCase()
  const completedTimes = metricRows.filter((row) => row.metric.kind === "time" && row.metric.completed)
  const repetitions = metricRows.filter((row) => row.metric.kind === "reps")

  if (mode === "menor_es_mejor") {
    if (completedTimes.length) return "time"
    if (repetitions.length) return "reps"
    return null
  }

  if (mode === "mayor_es_mejor") {
    if (repetitions.length) return "reps"
    if (completedTimes.length) return "time"
    return null
  }

  if (repetitions.length >= completedTimes.length && repetitions.length) return "reps"
  if (completedTimes.length) return "time"
  return null
}

function buildWodGroupPerformancePoint(wod, wodResults = []) {
  const latestResults = uniqueLatestResultsByAthlete(wodResults)
  const metricRows = latestResults
    .map((result) => ({ result, metric: resultMetric(wod, result) }))
    .filter((row) => row.metric?.kind)

  if (metricRows.length < MIN_GROUP_PERFORMANCE_RESULTS) return null

  const metricKind = chooseGroupMetricKind(wod, metricRows)
  if (!metricKind) return null

  const mode = String(wod?.modo_ranking || "sin_ranking").toLowerCase()
  const rowsForScore = metricKind === "time"
    ? metricRows.filter((row) => row.metric.kind === "time" || (mode === "menor_es_mejor" && row.metric.kind === "reps"))
    : metricRows.filter((row) => row.metric.kind === "reps")

  if (rowsForScore.length < MIN_GROUP_PERFORMANCE_RESULTS) return null

  const groups = new Map()
  rowsForScore.forEach((row) => {
    const key = normalizedModality(wod, row.result)
    const group = groups.get(key) || []
    group.push(row)
    groups.set(key, group)
  })

  const athleteScores = []
  let completedCount = 0
  let scoredModalityCount = 0
  const completedValues = []
  const repetitionValues = []

  for (const groupRows of groups.values()) {
    // Una modalidad necesita al menos dos marcas para producir una referencia colectiva.
    // Esto evita que una modalidad con un solo atleta genere automáticamente 100 %.
    if (groupRows.length < MIN_GROUP_PERFORMANCE_RESULTS) continue
    scoredModalityCount += 1

    if (metricKind === "time") {
      const completedRows = groupRows.filter(
        (row) => row.metric.kind === "time" && row.metric.completed && Number(row.metric.value || 0) > 0
      )
      const bestTime = completedRows.length
        ? Math.min(...completedRows.map((row) => Number(row.metric.value)))
        : 0

      groupRows.forEach((row) => {
        if (row.metric.kind === "time" && row.metric.completed && bestTime > 0) {
          const seconds = Number(row.metric.value || 0)
          completedCount += 1
          completedValues.push(seconds)
          athleteScores.push(roundedPercent((bestTime / seconds) * 100))
          return
        }

        // En un WOD por tiempo, un registro de repeticiones representa un WOD no completado.
        // Se mantiene dentro del promedio con valor cero para que la tasa de finalización
        // influya en el rendimiento colectivo.
        athleteScores.push(0)
      })
      continue
    }

    const validRows = groupRows.filter(
      (row) => row.metric.kind === "reps" && Number(row.metric.value || 0) > 0
    )
    const bestRepetitions = validRows.length
      ? Math.max(...validRows.map((row) => Number(row.metric.value)))
      : 0

    validRows.forEach((row) => {
      const repetitions = Number(row.metric.value || 0)
      repetitionValues.push(repetitions)
      athleteScores.push(bestRepetitions > 0 ? roundedPercent((repetitions / bestRepetitions) * 100) : 0)
    })
  }

  if (athleteScores.length < MIN_GROUP_PERFORMANCE_RESULTS) return null

  const score = roundedPercent(averageNumbers(athleteScores))
  const validResultCount = athleteScores.length
  const completionRate = metricKind === "time"
    ? roundedPercent((completedCount / validResultCount) * 100)
    : null
  const averageMark = metricKind === "time"
    ? formatSecondsValue(averageNumbers(completedValues))
    : repetitionValues.length
      ? `${Math.round(averageNumbers(repetitionValues) * 10) / 10} reps`
      : "—"

  return {
    id: wod.id,
    name: wod.nombre || "WOD",
    date: wod.fecha,
    category: classifyWodCategory(wod),
    rankingMode: mode,
    metricKind,
    score,
    participantCount: latestResults.length,
    validResultCount,
    completedCount,
    completionRate,
    averageMark,
    modalityCount: scoredModalityCount,
  }
}

function buildWodGroupPerformanceSeries({ wods = [], results = [] }) {
  const resultsByWod = new Map()

  results.forEach((result) => {
    const wodId = String(result?.wod_id || "")
    if (!wodId) return
    const rows = resultsByWod.get(wodId) || []
    rows.push(result)
    resultsByWod.set(wodId, rows)
  })

  const categoryOrder = ["strength", "weightlifting", "gymnastics", "cardio", "mixed", "metcon", "other"]
  const categoryMap = new Map(categoryOrder.map((key) => [key, []]))

  wods
    .slice()
    .sort((a, b) => (wodDate(a)?.getTime() || 0) - (wodDate(b)?.getTime() || 0))
    .forEach((wod) => {
      const point = buildWodGroupPerformancePoint(
        wod,
        resultsByWod.get(String(wod.id || "")) || []
      )
      if (!point) return

      const rows = categoryMap.get(point.category) || []
      rows.push(point)
      categoryMap.set(point.category, rows)
    })

  return categoryOrder.map((key) => {
    const series = categoryMap.get(key) || []
    const first = series[0] || null
    const latest = series.at(-1) || null
    const deltaPoints = first && latest && series.length > 1
      ? Math.round((latest.score - first.score) * 10) / 10
      : 0
    const relativeChange = first && latest && series.length > 1 && first.score > 0
      ? Math.round(((latest.score - first.score) / first.score) * 1000) / 10
      : 0

    return {
      key,
      series,
      wodCount: series.length,
      firstScore: first?.score || 0,
      latestScore: latest?.score || 0,
      averageScore: series.length
        ? Math.round(averageNumbers(series.map((row) => row.score)) * 10) / 10
        : 0,
      deltaPoints,
      relativeChange,
      trend: deltaPoints > 0 ? "up" : deltaPoints < 0 ? "down" : "stable",
    }
  })
}

export function buildWodStatistics({
  wods = [],
  results = [],
  participationResults = results,
  users = [],
  activeAthleteCount = 0,
  activeAthleteIds = null,
  locale = "es",
}) {
  const visibleWods = wods.slice().sort((a, b) => {
    return (parseLocalDate(b.fecha)?.getTime() || 0) - (parseLocalDate(a.fecha)?.getTime() || 0)
  })
  const resultsByWod = new Map()
  const participationByWod = new Map()
  const activeIds = activeAthleteIds instanceof Set
    ? new Set([...activeAthleteIds].map((value) => String(value)))
    : null

  results.forEach((result) => {
    const key = String(result.wod_id || "")
    if (!key) return
    const rows = resultsByWod.get(key) || []
    rows.push(result)
    resultsByWod.set(key, rows)
  })

  participationResults.forEach((result) => {
    const key = String(result.wod_id || "")
    if (!key) return
    const rows = participationByWod.get(key) || []
    rows.push(result)
    participationByWod.set(key, rows)
  })

  const detailedWods = visibleWods.map((wod) => {
    const wodResults = resultsByWod.get(String(wod.id)) || []
    const wodParticipationResults = participationByWod.get(String(wod.id)) || []
    const participantIds = new Set(wodParticipationResults.map((row) => String(row.usuario_id || "")).filter(Boolean))
    const rateParticipantIds = activeIds
      ? new Set([...participantIds].filter((userId) => activeIds.has(userId)))
      : participantIds
    const participationRate = activeAthleteCount
      ? Math.min(100, Math.round((rateParticipantIds.size / activeAthleteCount) * 100))
      : 0

    return {
      id: wod.id,
      name: wod.nombre || "WOD",
      date: wod.fecha,
      description: wod.descripcion || "",
      rankingMode: String(wod.modo_ranking || "sin_ranking").toLowerCase(),
      modality: wod.modalidad || "",
      category: classifyWodCategory(wod),
      participantCount: participantIds.size,
      participationRate,
      ranking: buildWodRanking({ wod, results: wodResults, users, locale }),
    }
  })

  const categoryOrder = ["strength", "weightlifting", "gymnastics", "cardio", "mixed", "metcon", "other"]
  const categoryCounts = new Map(categoryOrder.map((key) => [key, 0]))
  detailedWods.forEach((wod) => categoryCounts.set(wod.category, (categoryCounts.get(wod.category) || 0) + 1))
  const totalWods = detailedWods.length
  const categorySeries = categoryOrder.map((key) => {
    const value = categoryCounts.get(key) || 0
    return {
      key,
      value,
      percentage: totalWods ? Math.round((value / totalWods) * 1000) / 10 : 0,
    }
  })

  const uniqueAthletes = new Set(participationResults.map((row) => String(row.usuario_id || "")).filter(Boolean)).size
  const participationValues = detailedWods.map((wod) => wod.participationRate)
  const averageParticipation = participationValues.length
    ? Math.round(participationValues.reduce((sum, value) => sum + value, 0) / participationValues.length)
    : 0

  return {
    summary: {
      totalWods,
      totalResults: results.length,
      uniqueAthletes,
      averageParticipation,
    },
    wods: detailedWods,
    categorySeries,
    groupPerformanceSeries: buildWodGroupPerformanceSeries({ wods: visibleWods, results }),
  }
}
