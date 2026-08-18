export function formatDateISO(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function getCurrentWeekRange(date = new Date()) {
  const current = new Date(date)
  const day = current.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day

  const monday = new Date(current)
  monday.setDate(current.getDate() + diffToMonday)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return {
    startIso: formatDateISO(monday),
    endIso: formatDateISO(sunday),
  }
}

export function buildWeeklyWodStats(rows = []) {
  const uniqueByWod = new Map()

  rows.forEach((item) => {
    const key = item.wod_id || item.id
    if (!uniqueByWod.has(key)) uniqueByWod.set(key, item)
  })

  const uniqueRows = Array.from(uniqueByWod.values())
  const caloriesByDay = [0, 0, 0, 0, 0, 0, 0]

  const caloriesTotal = uniqueRows.reduce((sum, item) => {
    const savedCalories = Number(item.calorias_estimadas || 0)
    const maxCalories = Number(item.wod?.calorias_max || 0)
    const value = savedCalories > 0 ? savedCalories : maxCalories

    if (item.fecha) {
      const date = new Date(`${String(item.fecha).slice(0, 10)}T00:00:00`)
      if (!Number.isNaN(date.getTime())) {
        const day = date.getDay()
        const index = day === 0 ? 6 : day - 1
        caloriesByDay[index] += Number(value || 0)
      }
    }

    return sum + Number(value || 0)
  }, 0)

  const caloriesSeries = []
  let running = 0

  caloriesByDay.forEach((value) => {
    running += value
    caloriesSeries.push(running)
  })

  return {
    count: uniqueRows.length,
    caloriesTotal,
    caloriesTarget: 6000,
    caloriesSeries,
  }
}

export function getMembershipInfo(membership, now = new Date()) {
  if (!membership) return null

  const status = String(membership.estado || "").toLowerCase()
  const endDate = membership.fecha_fin ? parseISODate(membership.fecha_fin) : null
  const today = parseISODate(formatDateISO(now))

  if (!endDate || !today) {
    return {
      active: status === "activo",
      daysLeft: null,
      endDate: membership.fecha_fin || null,
    }
  }

  const daysLeft = Math.floor((endDate.getTime() - today.getTime()) / 86400000)

  return {
    active: status === "activo" && daysLeft >= 0,
    daysLeft,
    endDate: membership.fecha_fin,
  }
}

export function getMembershipLabel(membership, info, copy) {
  if (!membership || !info) {
    return {
      status: "expired",
      icon: "!",
      title: copy.membershipMissing,
      subtitle: copy.renew,
      dateLabel: "—",
      progress: 0,
    }
  }

  const dateLabel = info.endDate ? formatDisplayDate(info.endDate) : "—"

  if (!info.active) {
    return {
      status: "expired",
      icon: "!",
      title: copy.membershipExpired,
      subtitle:
        info.daysLeft !== null && info.daysLeft < 0
          ? `${copy.expiredAgo} ${Math.abs(info.daysLeft)} ${copy.days}`
          : copy.renew,
      dateLabel,
      progress: 0,
    }
  }

  const progress =
    info.daysLeft !== null
      ? Math.max(8, Math.min(100, Math.round((Math.min(Math.max(info.daysLeft, 0), 30) / 30) * 100)))
      : 92

  if (info.daysLeft !== null && info.daysLeft <= 7) {
    return {
      status: "warning",
      icon: "⚠",
      title: copy.membershipDueSoon,
      subtitle: info.daysLeft === 0 ? copy.expiresToday : `${copy.expiresIn} ${info.daysLeft} ${copy.days}`,
      dateLabel,
      progress,
    }
  }

  return {
    status: "active",
    icon: "✓",
    title: copy.membershipActive,
    subtitle: info.daysLeft !== null ? `${copy.expiresIn} ${info.daysLeft} ${copy.days}` : copy.membershipActive,
    dateLabel,
    progress,
  }
}

export function parseISODate(value) {
  if (!value) return null
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

export function formatDisplayDate(value) {
  const date = parseISODate(value)
  if (!date) return "—"

  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
  })
    .format(date)
    .replace(".", "")
}

export function getUpcomingBirthdays(users = [], date = new Date(), limit = 3) {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const currentYear = today.getFullYear()

  return users
    .filter((user) => Boolean(user.fecha_nacimiento))
    .map((user) => {
      const [, month, day] = String(user.fecha_nacimiento).split("-").map(Number)
      if (!month || !day) return null

      const thisYearBirthday = new Date(currentYear, month - 1, day)
      const nextBirthday =
        thisYearBirthday < today
          ? new Date(currentYear + 1, month - 1, day)
          : thisYearBirthday

      return {
        id: user.id,
        nombre: user.nombre || "PHO3NIX",
        nextBirthday,
        day,
        monthLabel: getMonthName(month - 1),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.nextBirthday.getTime() - b.nextBirthday.getTime())
    .slice(0, limit)
}

export function getMonthName(monthIndex) {
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
  return months[monthIndex] || ""
}

export function getFirstName(name) {
  return String(name || "Alumno").trim().split(/\s+/)[0] || "Alumno"
}

export function getInitials(name) {
  const parts = String(name || "PH").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "PH"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function formatCompactNumber(value) {
  const number = Number(value || 0)

  if (number >= 1000) {
    return new Intl.NumberFormat("es-EC", {
      maximumFractionDigits: 1,
      notation: "compact",
    }).format(number)
  }

  return new Intl.NumberFormat("es-EC").format(number)
}
