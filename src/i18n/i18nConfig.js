import es from "./locales/es.json"
import en from "./locales/en.json"
export const DEFAULT_LOCALE = "es"
export const SUPPORTED_LOCALES = ["es", "en"]
export const dictionaries = { es, en }
export function detectInitialLocale() {
  if (typeof window === "undefined") return DEFAULT_LOCALE
  const saved = window.localStorage.getItem("phoenix:v2:locale")
  if (SUPPORTED_LOCALES.includes(saved)) return saved
  return (window.navigator.language || "").toLowerCase().startsWith("en") ? "en" : DEFAULT_LOCALE
}
export function translate(dictionary, key) {
  return String(key).split(".").reduce((value, part) => value?.[part], dictionary) ?? key
}
