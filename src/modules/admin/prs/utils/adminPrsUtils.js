export const PLATE_OPTIONS = [45, 35, 25, 15, 10, 5, 2.5]

export function normalizeRole(value) {
  return String(value || "").trim().toLowerCase()
}

export function normalizeGender(value) {
  const text = String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  if (!text || text === "all" || text === "todos") return "all"
  if (["m", "male", "masculino", "hombre"].includes(text) || text.startsWith("masc")) return "male"
  if (["f", "female", "femenino", "mujer"].includes(text) || text.startsWith("fem")) return "female"
  return "unknown"
}

export function formatIsoDate(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date)
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function parseLocalDate(value) {
  if (!value) return null
  if (value instanceof Date) return value

  const text = String(value).slice(0, 10)
  const [year, month, day] = text.split("-").map(Number)
  if ([year, month, day].every(Number.isFinite)) return new Date(year, month - 1, day)

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatDate(value, locale = "es") {
  const date = parseLocalDate(value)
  if (!date) return "—"

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function formatWeight(value, locale = "es") {
  const number = Number(value)
  if (!Number.isFinite(number)) return "—"

  return `${new Intl.NumberFormat(locale === "en" ? "en-US" : "es-EC", {
    maximumFractionDigits: 1,
  }).format(number)} lb`
}

export function getAthleteFromRecord(record) {
  return record?.usuarios || record?.usuario_data || record?.athlete || null
}

export function getExerciseFromRecord(record) {
  return record?.ejercicios || record?.ejercicio_data || record?.exercise || null
}

export function getAthleteName(record) {
  const athlete = getAthleteFromRecord(record)
  return athlete?.nombre || record?.usuario_nombre || record?.nombre_usuario || "Atleta"
}

export function getAthleteId(record) {
  const athlete = getAthleteFromRecord(record)
  return record?.usuario || record?.usuario_id || athlete?.id || null
}

export function getExerciseName(record) {
  const exercise = getExerciseFromRecord(record)
  return exercise?.nombre || record?.ejercicio_nombre || "Ejercicio"
}

export function getRecordTimestamp(record) {
  const date = parseLocalDate(record?.fecha)
  if (date) return date.getTime()

  const created = record?.created_at ? new Date(record.created_at).getTime() : 0
  return Number.isFinite(created) ? created : 0
}

export function buildLatestByAthlete(records = []) {
  const map = new Map()

  records.forEach((record, index) => {
    const athleteId = getAthleteId(record)
    const key = athleteId ? `id:${athleteId}` : `row:${record?.id || index}`
    const current = map.get(key)

    if (!current || getRecordTimestamp(record) > getRecordTimestamp(current)) {
      map.set(key, record)
    }
  })

  return Array.from(map.values())
}

export function buildRanking(records = [], exerciseId, gender = "all") {
  const targetGender = normalizeGender(gender)
  const scoped = records.filter((record) => String(record?.ejercicio_id) === String(exerciseId))
  const bestByAthlete = new Map()

  scoped.forEach((record, index) => {
    const athlete = getAthleteFromRecord(record)
    const athleteGender = normalizeGender(athlete?.sexo || athlete?.genero)

    if (targetGender !== "all" && athleteGender !== targetGender) return

    const athleteId = getAthleteId(record)
    const key = athleteId ? `id:${athleteId}` : `row:${record?.id || index}`
    const current = bestByAthlete.get(key)
    const nextWeight = Number(record?.peso_libras || 0)
    const currentWeight = Number(current?.peso_libras || 0)

    if (!current || nextWeight > currentWeight || (nextWeight === currentWeight && getRecordTimestamp(record) > getRecordTimestamp(current))) {
      bestByAthlete.set(key, record)
    }
  })

  return Array.from(bestByAthlete.values())
    .sort((a, b) => Number(b?.peso_libras || 0) - Number(a?.peso_libras || 0))
    .slice(0, 20)
}

export function buildExerciseRows(exercises = [], records = []) {
  return exercises
    .map((exercise) => {
      const scoped = records
        .filter((record) => String(record?.ejercicio_id) === String(exercise.id))
        .sort((a, b) => Number(b?.peso_libras || 0) - Number(a?.peso_libras || 0) || getRecordTimestamp(b) - getRecordTimestamp(a))

      const best = scoped[0] || null
      const previous = scoped[1] || null
      const bestWeight = best ? Number(best.peso_libras || 0) : null
      const previousWeight = previous ? Number(previous.peso_libras || 0) : null
      const improvement = bestWeight !== null && previousWeight !== null ? round(bestWeight - previousWeight, 1) : null
      const improvementPercent = improvement !== null && previousWeight > 0 ? round((improvement / previousWeight) * 100, 1) : null

      return {
        id: exercise.id,
        nombre: exercise.nombre,
        created_at: exercise.created_at,
        historyCount: scoped.length,
        athleteCount: buildLatestByAthlete(scoped).length,
        bestRecord: best,
        previousRecord: previous,
        bestWeight,
        previousWeight,
        improvement,
        improvementPercent,
      }
    })
    .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es"))
}

export function filterExerciseRows(rows = [], search = "") {
  const term = String(search || "").trim().toLowerCase()
  if (!term) return rows

  return rows.filter((row) => {
    return [row.nombre, getAthleteName(row.bestRecord), getAthleteName(row.previousRecord)]
      .some((value) => String(value || "").toLowerCase().includes(term))
  })
}

export function buildPrStats(records = [], exerciseRows = [], now = new Date()) {
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const monthRecords = records.filter((record) => {
    const date = parseLocalDate(record?.fecha || record?.created_at)
    return date && date.getMonth() === currentMonth && date.getFullYear() === currentYear
  })

  const athleteIds = new Set(records.map(getAthleteId).filter(Boolean).map(String))

  return {
    total: records.length,
    thisMonth: monthRecords.length,
    exercisesWithPr: exerciseRows.filter((row) => row.historyCount > 0).length,
    athletesWithPr: athleteIds.size,
  }
}

export function buildHistory(records = [], athleteId, exerciseId) {
  return records
    .filter((record) => String(getAthleteId(record)) === String(athleteId))
    .filter((record) => String(record?.ejercicio_id) === String(exerciseId))
    .sort((a, b) => getRecordTimestamp(a) - getRecordTimestamp(b))
}

export function buildChartPoints(records = []) {
  const values = records.map((record) => Number(record?.peso_libras || 0)).filter(Number.isFinite)
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = Math.max(max - min, 1)

  return records.map((record) => ({
    ...record,
    height: Math.max(12, Math.round(((Number(record?.peso_libras || 0) - min) / range) * 86) + 12),
  }))
}

export function calculateBarbellTotal(barWeight, plates = {}) {
  const sideTotal = PLATE_OPTIONS.reduce((sum, plate) => sum + Number(plates[String(plate)] || 0) * plate, 0)
  return {
    sideTotal: round(sideTotal, 1),
    total: round(Number(barWeight || 0) + sideTotal * 2, 1),
  }
}

export function round(value, decimals = 1) {
  const factor = 10 ** decimals
  return Math.round(Number(value || 0) * factor) / factor
}
