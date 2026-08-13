export function normalizeText(value) {
  return String(value || "").trim().replace(/\s+/g, " ")
}

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase()
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value))
}

export function getInitials(name) {
  const parts = normalizeText(name || "PH").split(" ").filter(Boolean)
  if (parts.length === 0) return "PH"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function formatProfileRole(role, copy) {
  const value = String(role || "").trim().toLowerCase()
  if (value === "alumno" || value === "student" || value === "athlete") return copy.roleAthlete
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : copy.roleAthlete
}

export function parseISODate(value) {
  if (!value) return null
  const raw = String(value).slice(0, 10)
  const [year, month, day] = raw.split("-").map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

export function formatProfileDate(value, locale = "es", fallback = "—") {
  const date = parseISODate(value)
  if (!date) return fallback

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date).replace(".", "")
}

export function getProfileAge(value) {
  const birthDate = parseISODate(value)
  if (!birthDate) return null

  const now = new Date()
  let age = now.getFullYear() - birthDate.getFullYear()
  const monthDifference = now.getMonth() - birthDate.getMonth()

  if (monthDifference < 0 || (monthDifference === 0 && now.getDate() < birthDate.getDate())) {
    age -= 1
  }

  return age >= 0 ? age : null
}

export function buildExerciseMap(exercises = []) {
  return new Map((exercises || []).map((item) => [String(item.id), item.nombre || "Exercise"]))
}

export function hydrateProfilePrRows(rows = [], exercises = []) {
  const exerciseMap = buildExerciseMap(exercises)

  return (rows || []).map((row) => ({
    ...row,
    peso_libras: Number(row.peso_libras || 0),
    ejercicio_nombre: exerciseMap.get(String(row.ejercicio_id)) || "Exercise",
  }))
}

export function calculateProfileStats(rows = []) {
  const ordered = [...(rows || [])].sort((left, right) => {
    const leftDate = new Date(`${left.fecha || "1900-01-01"}T00:00:00`).getTime()
    const rightDate = new Date(`${right.fecha || "1900-01-01"}T00:00:00`).getTime()
    if (leftDate !== rightDate) return rightDate - leftDate
    return new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime()
  })

  const bestGeneral = [...ordered].sort(
    (left, right) => Number(right.peso_libras || 0) - Number(left.peso_libras || 0)
  )[0] || null

  const bestByExercise = new Map()
  ordered.forEach((row) => {
    const key = String(row.ejercicio_id || row.ejercicio_nombre || "")
    const current = bestByExercise.get(key)
    if (!current || Number(row.peso_libras || 0) > Number(current.peso_libras || 0)) {
      bestByExercise.set(key, row)
    }
  })

  const strongestExercise = [...bestByExercise.values()].sort(
    (left, right) => Number(right.peso_libras || 0) - Number(left.peso_libras || 0)
  )[0] || null

  return {
    total: ordered.length,
    latestPr: ordered[0] || null,
    bestGeneral,
    strongestExercise,
    recent: ordered.slice(0, 5),
  }
}

export function validateProfilePayload(payload, copy) {
  const name = normalizeText(payload?.nombre)
  if (!name) throw new Error(copy.nameRequired)
  if (name.length < 3) throw new Error(copy.nameTooShort)

  return {
    nombre: name,
    telefono: normalizeText(payload?.telefono) || null,
    fecha_nacimiento: payload?.fecha_nacimiento || null,
  }
}
