import { DEFAULT_THEME_KEY } from "./themeConstants.js"

export const THEME_KEYS = Object.freeze([
  "phoenix",
  "new_year",
  "valentines_day",
  "carnival",
  "international_womens_day",
  "good_friday",
  "labor_day",
  "mothers_day",
  "battle_of_pichincha",
  "childrens_day",
  "fathers_day",
  "guayaquil_foundation",
  "first_cry_of_independence",
  "flag_day",
  "guayaquil_independence",
  "halloween",
  "all_souls_day",
  "cuenca_independence",
  "quito_foundation",
  "christmas",
  "year_end",
])

export const THEME_KEY_SET = new Set(THEME_KEYS)

export function isKnownThemeKey(value) {
  return THEME_KEY_SET.has(String(value || "").trim().toLowerCase())
}

export function normalizeThemeKey(value) {
  const key = String(value || "").trim().toLowerCase()
  return isKnownThemeKey(key) ? key : DEFAULT_THEME_KEY
}
