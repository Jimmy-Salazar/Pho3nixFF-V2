const BASE_NAV_ITEMS = [
  { key: "home", icon: "⌂", path: "/atleta/dashboard" },
  { key: "wods", icon: "🏋️", path: "/atleta/wods" },
  { key: "records", icon: "🏆", path: "/atleta/records" },
  { key: "progress", icon: "↗", path: "/atleta/progreso" },
]

const PROFILE_ITEM = { key: "profile", icon: "◉", path: "/atleta/perfil" }
const PDA_ITEM = { key: "pda", icon: "🔥", path: "/atleta/pda" }

/**
 * ÚNICA regla restaurada aquí:
 * - PDA visible en navegación del Atleta: 15 de noviembre -> 5 de enero.
 * - PDA oculto en navegación del Atleta: 6 de enero -> 14 de noviembre.
 *
 * No modifica la ruta /atleta/pda, Supabase, publicación, afiche ni lógica PDA.
 * La fecha se evalúa en America/Guayaquil.
 */
export function isPdaNavigationVisible(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Guayaquil",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date)

  const month = Number(parts.find((part) => part.type === "month")?.value || 0)
  const day = Number(parts.find((part) => part.type === "day")?.value || 0)

  if (month === 11 && day >= 15) return true
  if (month === 12) return true
  if (month === 1 && day <= 5) return true

  return false
}

export function getStudentNavigationItems(date = new Date()) {
  return [
    ...BASE_NAV_ITEMS,
    ...(isPdaNavigationVisible(date) ? [PDA_ITEM] : []),
    PROFILE_ITEM,
  ]
}

// Compatibilidad con componentes que todavía importen NAV_ITEMS directamente.
export const NAV_ITEMS = getStudentNavigationItems()
