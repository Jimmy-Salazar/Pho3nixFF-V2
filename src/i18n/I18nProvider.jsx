import { createContext, useContext, useMemo, useState } from "react"
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, detectInitialLocale, dictionaries, translate } from "./i18nConfig.js"
const I18nContext = createContext(null)
export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(detectInitialLocale)
  const setLocale = (nextLocale) => {
    const safeLocale = SUPPORTED_LOCALES.includes(nextLocale) ? nextLocale : DEFAULT_LOCALE
    setLocaleState(safeLocale)
    if (typeof window !== "undefined") window.localStorage.setItem("phoenix:v2:locale", safeLocale)
  }
  const dictionary = dictionaries[locale] || dictionaries[DEFAULT_LOCALE]
  const value = useMemo(() => ({ locale, setLocale, t: (key) => translate(dictionary, key) }), [dictionary, locale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
export function useI18n() {
  const value = useContext(I18nContext)
  if (!value) throw new Error("useI18n debe usarse dentro de I18nProvider.")
  return value
}
