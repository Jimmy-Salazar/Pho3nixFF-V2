import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { applyThemeVariables } from "./applyThemeVariables.js"
import { defaultTheme } from "./themeDefaults.js"
import { fetchActiveRemoteTheme } from "./remoteThemeService.js"

const ThemeContext = createContext(null)
const THEME_CACHE_KEY = "phoenix:v2:theme-cache"

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(defaultTheme)
  const [loadingTheme, setLoadingTheme] = useState(true)
  const [themeError, setThemeError] = useState("")
  useEffect(() => {
    let alive = true
    async function loadTheme() {
      try {
        setLoadingTheme(true)
        const cached = readCachedTheme()
        const firstTheme = cached || defaultTheme
        setTheme(firstTheme); applyThemeVariables(firstTheme)
        const remoteTheme = await fetchActiveRemoteTheme()
        if (!alive) return
        const nextTheme = remoteTheme || firstTheme
        setTheme(nextTheme); applyThemeVariables(nextTheme)
        if (remoteTheme) writeCachedTheme(remoteTheme)
      } catch (error) {
        if (!alive) return
        setThemeError(error?.message || "No se pudo cargar el tema remoto.")
        applyThemeVariables(defaultTheme)
      } finally {
        if (alive) setLoadingTheme(false)
      }
    }
    loadTheme()
    return () => { alive = false }
  }, [])
  const value = useMemo(() => ({ theme, loadingTheme, themeError, isRemoteTheme: theme?.source === "remote" }), [theme, loadingTheme, themeError])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error("useTheme debe usarse dentro de ThemeProvider.")
  return value
}
function readCachedTheme() {
  if (typeof window === "undefined") return null
  try { const raw = window.localStorage.getItem(THEME_CACHE_KEY); return raw ? JSON.parse(raw) : null } catch { return null }
}
function writeCachedTheme(theme) {
  if (typeof window === "undefined") return
  try { window.localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(theme)) } catch {}
}
