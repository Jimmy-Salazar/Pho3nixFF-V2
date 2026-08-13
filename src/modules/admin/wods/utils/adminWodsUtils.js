import { estimateWodCalories } from "./estimateCalories.js"

export const WOD_STATUS = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  ACTIVE: "active",
  HISTORICAL: "historical",
}

export function getTodayISO(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date)
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function parseLocalDate(value) {
  if (!value) return null
  if (value instanceof Date) return value

  const parts = String(value).slice(0, 10).split("-").map(Number)
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    return new Date(parts[0], parts[1] - 1, parts[2])
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function getWodStatus(wod, now = new Date()) {
  if (!wod?.publicado || !wod?.fecha || !wod?.fecha_publicacion) {
    return WOD_STATUS.DRAFT
  }

  const publishAt = new Date(wod.fecha_publicacion)
  const wodDate = parseLocalDate(wod.fecha)

  if (Number.isNaN(publishAt.getTime()) || !wodDate) return WOD_STATUS.DRAFT
  if (now < publishAt) return WOD_STATUS.SCHEDULED

  const endOfWodDay = new Date(
    wodDate.getFullYear(),
    wodDate.getMonth(),
    wodDate.getDate(),
    23,
    59,
    59,
    999
  )

  if (now > endOfWodDay) return WOD_STATUS.HISTORICAL
  return WOD_STATUS.ACTIVE
}

export function canEditWod(wod, now = new Date()) {
  const status = getWodStatus(wod, now)
  return status === WOD_STATUS.DRAFT || status === WOD_STATUS.SCHEDULED
}

export function buildWodStats(wods = [], now = new Date()) {
  return wods.reduce(
    (stats, wod) => {
      const status = getWodStatus(wod, now)
      stats.total += 1
      if (status === WOD_STATUS.DRAFT) stats.drafts += 1
      if (status === WOD_STATUS.SCHEDULED) stats.scheduled += 1
      if (status === WOD_STATUS.ACTIVE) stats.active += 1
      if (status === WOD_STATUS.HISTORICAL) stats.historical += 1
      return stats
    },
    { total: 0, drafts: 0, scheduled: 0, active: 0, historical: 0 }
  )
}

export function filterWods(wods = [], { search = "", status = "all" } = {}) {
  const term = normalizeText(search)

  return sortWodsForDirectory(
    wods.filter((wod) => {
      const currentStatus = getWodStatus(wod)
      const matchesStatus = status === "all" || currentStatus === status
      const haystack = normalizeText([
        wod.nombre,
        wod.descripcion,
        wod.modalidad,
        wod.modo_ranking,
        wod.fecha,
      ].join(" "))

      return matchesStatus && (!term || haystack.includes(term))
    })
  )
}

export function sortWodsForDirectory(wods = []) {
  const order = {
    [WOD_STATUS.ACTIVE]: 0,
    [WOD_STATUS.SCHEDULED]: 1,
    [WOD_STATUS.DRAFT]: 2,
    [WOD_STATUS.HISTORICAL]: 3,
  }

  return [...wods].sort((a, b) => {
    const statusA = getWodStatus(a)
    const statusB = getWodStatus(b)
    const statusDiff = order[statusA] - order[statusB]
    if (statusDiff !== 0) return statusDiff

    const timeA = getSortTime(a)
    const timeB = getSortTime(b)

    if (statusA === WOD_STATUS.HISTORICAL || statusA === WOD_STATUS.DRAFT) {
      return timeB - timeA
    }

    return timeA - timeB
  })
}


export function getCurrentWeekRange(now = new Date()) {
  const current = now instanceof Date ? new Date(now) : new Date(now)
  const day = current.getDay()
  const distanceToMonday = day === 0 ? -6 : 1 - day

  const start = new Date(current)
  start.setDate(current.getDate() + distanceToMonday)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

export function isWodInCurrentWeek(wod, now = new Date()) {
  const date = parseLocalDate(wod?.fecha)
  if (!date) return false

  const { start, end } = getCurrentWeekRange(now)
  return date >= start && date <= end
}

export function buildCurrentWeekWods(wods = [], now = new Date()) {
  const weekRows = wods.filter((wod) => {
    const status = getWodStatus(wod, now)

    // Los borradores no tienen fecha, pero deben permanecer visibles para que
    // el administrador pueda completarlos y programarlos desde esta sección.
    if (status === WOD_STATUS.DRAFT) return true

    return isWodInCurrentWeek(wod, now)
  })

  return sortWodsForDirectory(weekRows)
}

export function buildWodMonthGroups(wods = [], locale = "es", now = new Date()) {
  const groups = new Map()

  wods.forEach((wod) => {
    if (getWodStatus(wod, now) === WOD_STATUS.DRAFT) return
    if (isWodInCurrentWeek(wod, now)) return

    const date = parseLocalDate(wod?.fecha)
    if (!date) return

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: formatMonthLabel(date, locale),
        rows: [],
      })
    }

    groups.get(key).rows.push(wod)
  })

  return [...groups.values()]
    .map((group) => ({ ...group, rows: sortWodsForDirectory(group.rows) }))
    .sort((a, b) => b.key.localeCompare(a.key))
}

export function getPreferredWodMonthKey(groups = [], now = new Date()) {
  if (groups.length === 0) return ""

  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  return groups.some((group) => group.key === currentKey) ? currentKey : groups[0].key
}

export function buildPreviousDay1930(dateString) {
  const target = parseLocalDate(dateString)
  if (!target) return ""

  target.setDate(target.getDate() - 1)
  target.setHours(19, 30, 0, 0)
  return target.toISOString()
}

export function isPastDate(dateString, now = new Date()) {
  const target = parseLocalDate(dateString)
  if (!target) return false

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return target < today
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

export function formatDateTime(value, locale = "es") {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)
}

export function formatRanking(value, copy) {
  const ranking = String(value || "").trim().toLowerCase()
  if (ranking === "mayor_es_mejor") return copy.moreReps
  if (ranking === "menor_es_mejor") return copy.lessTime
  return copy.noRanking
}

export function formatModality(value, copy) {
  const modality = String(value || "").trim().toLowerCase()
  if (modality === "duo") return copy.duo
  if (modality === "trio") return copy.trio
  return copy.single
}

export function getStatusLabel(status, copy) {
  if (status === WOD_STATUS.SCHEDULED) return copy.scheduledStatus
  if (status === WOD_STATUS.ACTIVE) return copy.activeStatus
  if (status === WOD_STATUS.HISTORICAL) return copy.historicalStatus
  return copy.draftStatus
}

export function buildStoredEstimate(wod, locale = "es") {
  const local = estimateWodCalories({
    nombre: wod?.nombre || "",
    descripcion: wod?.descripcion || "",
    modoRanking: wod?.modo_ranking || "sin_ranking",
    modalidad: wod?.modalidad || "single",
    locale,
  })

  const hasStoredEstimate = Number.isFinite(Number(wod?.calorias_min)) || Number.isFinite(Number(wod?.calorias_max))
  if (!hasStoredEstimate) return local

  return {
    ...local,
    caloriasMin: Number(wod.calorias_min) || local.caloriasMin,
    caloriasMax: Number(wod.calorias_max) || local.caloriasMax,
    intensidad: wod.intensidad_estimada || local.intensidad,
    duracion: wod.duracion_estimada || local.duracion,
    nota: wod.calorias_nota || local.nota,
    source: "stored",
  }
}

export function buildWodPayload(form, estimate) {
  return {
    nombre: String(form.nombre || "").trim() || null,
    descripcion: String(form.descripcion || "").trim(),
    modo_ranking: form.modoRanking || "sin_ranking",
    modalidad: form.modalidad || "single",
    calorias_min: Number.isFinite(Number(estimate?.caloriasMin)) ? Number(estimate.caloriasMin) : null,
    calorias_max: Number.isFinite(Number(estimate?.caloriasMax)) ? Number(estimate.caloriasMax) : null,
    intensidad_estimada: estimate?.intensidad || null,
    duracion_estimada: estimate?.duracion || null,
    calorias_nota: estimate?.nota || null,
  }
}

function formatMonthLabel(date, locale) {
  const label = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
    month: "long",
    year: "numeric",
  }).format(date)

  return label.charAt(0).toUpperCase() + label.slice(1)
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function getSortTime(wod) {
  const date = parseLocalDate(wod?.fecha)
  if (date) return date.getTime()

  const created = new Date(wod?.created_at || 0)
  return Number.isNaN(created.getTime()) ? 0 : created.getTime()
}
