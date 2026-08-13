export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function normalizeNumber(value) {
  const number = Number(value || 0)
  return Number.isFinite(number) ? number : 0
}

export function formatLb(value) {
  const number = normalizeNumber(value)
  return number ? `${number} lb` : "--"
}

export function formatDateCompact(value) {
  if (!value) return "--"

  try {
    return new Intl.DateTimeFormat("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .format(new Date(`${value}T00:00:00`))
      .replace(".", "")
  } catch {
    return String(value)
  }
}

export function getInitials(name) {
  const parts = String(name || "PH").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "PH"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}


export function normalizeExerciseName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
}

export function removeDuplicateExercises(exercises = []) {
  const seen = new Set()
  const cleaned = []

  ;(exercises || []).forEach((exercise) => {
    const key = normalizeExerciseName(exercise?.nombre)

    if (!key || seen.has(key)) return

    seen.add(key)
    cleaned.push(exercise)
  })

  return cleaned
}

export function buildExerciseMap(exercises = []) {
  return new Map((exercises || []).map((item) => [String(item.id), item.nombre || "Ejercicio"]))
}

export function hydratePrRows(rows = [], exercises = [], users = []) {
  const exerciseMap = buildExerciseMap(exercises)
  const userMap = new Map((users || []).map((item) => [String(item.id), item]))

  return (rows || []).map((row) => {
    const user = userMap.get(String(row.usuario))

    return {
      ...row,
      peso_libras: normalizeNumber(row.peso_libras),
      ejercicio_nombre: exerciseMap.get(String(row.ejercicio_id)) || "Ejercicio",
      usuario_nombre: user?.nombre || row.usuario_nombre || "Atleta PHO3NIX",
      usuario_foto_url: user?.foto_url || row.usuario_foto_url || "",
    }
  })
}

export function buildPrSummary(rows = []) {
  const ordered = [...rows].sort((a, b) => {
    const dateA = new Date(`${a.fecha || "1900-01-01"}T00:00:00`).getTime()
    const dateB = new Date(`${b.fecha || "1900-01-01"}T00:00:00`).getTime()
    if (dateA !== dateB) return dateB - dateA
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  })

  const bestPr =
    [...rows].sort((a, b) => normalizeNumber(b.peso_libras) - normalizeNumber(a.peso_libras))[0] || null

  const bestByExerciseMap = new Map()

  rows.forEach((row) => {
    const current = bestByExerciseMap.get(String(row.ejercicio_id))

    if (!current || normalizeNumber(row.peso_libras) > normalizeNumber(current.peso_libras)) {
      bestByExerciseMap.set(String(row.ejercicio_id), row)
    }
  })

  const bestByExercise = Array.from(bestByExerciseMap.values()).sort(
    (a, b) => normalizeNumber(b.peso_libras) - normalizeNumber(a.peso_libras)
  )

  const now = new Date()
  const thisMonth = rows.filter((row) => {
    const date = new Date(`${row.fecha || "1900-01-01"}T00:00:00`)
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  })

  return {
    total: rows.length,
    thisMonth: thisMonth.length,
    latestPr: ordered[0] || null,
    bestPr,
    strongest: bestByExercise[0] || null,
    bestByExercise,
    allRecords: ordered,
  }
}

export function getEvolutionRows(rows = [], exerciseId) {
  if (!exerciseId) return []

  return rows
    .filter((row) => String(row.ejercicio_id) === String(exerciseId))
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .slice(-8)
}

export function hasPrForExerciseAndDate(rows = [], exerciseId, date, ignoredId = null) {
  return rows.some((row) => {
    if (ignoredId && String(row.id) === String(ignoredId)) return false
    return String(row.ejercicio_id) === String(exerciseId) && String(row.fecha) === String(date)
  })
}

export function getMembershipStatus(membership) {
  if (!membership?.fecha_fin) {
    return {
      status: "expired",
      title: "Membresía vencida",
      subtitle: "Regulariza tu acceso.",
    }
  }

  const now = new Date()
  const end = new Date(`${membership.fecha_fin}T23:59:59`)
  const diffDays = Math.ceil((end.getTime() - now.getTime()) / 86400000)

  if (diffDays < 0 || membership.estado === "inactiva") {
    return {
      status: "expired",
      title: "Membresía vencida",
      subtitle: "Regulariza tu acceso.",
    }
  }

  if (diffDays <= 7) {
    return {
      status: "warning",
      title: "Membresía por vencer",
      subtitle: `Vence en ${diffDays} día(s).`,
    }
  }

  return {
    status: "active",
    title: "Membresía activa",
    subtitle: `Vence el ${formatDateCompact(membership.fecha_fin)}.`,
  }
}
