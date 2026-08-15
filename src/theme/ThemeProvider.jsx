import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { applyThemeVariables } from "./applyThemeVariables.js"
import { defaultTheme } from "./themeDefaults.js"
import {
  fetchRemoteThemeByKey,
  readCachedRemoteTheme,
} from "./remoteThemeService.js"
import {
  fetchThemeRuntimeSnapshot,
  getDefaultThemeRuntimeConfig,
  readCachedThemeRuntimeSnapshot,
  subscribeThemeRuntimeChanges,
} from "./themeRuntimeService.js"
import { resolveRuntimeThemeSelection } from "./themeRuntimeResolver.js"
import {
  getAppTimeZone,
  getUserTimeZone,
} from "./timezone.js"
import valentinesDayTheme from "./presets/valentinesDayTheme.js"
import flagDayTheme from "./presets/flagDayTheme.js"
import guayaquilIndependenceTheme from "./presets/guayaquilIndependenceTheme.js"
import halloweenTheme from "./presets/halloweenTheme.js"
import allSoulsDayTheme from "./presets/allSoulsDayTheme.js"
import cuencaIndependenceTheme from "./presets/cuencaIndependenceTheme.js"
import christmasTheme from "./presets/christmasTheme.js"
import yearEndTheme from "./presets/yearEndTheme.js"
import firstCryOfIndependenceTheme from "./presets/firstCryOfIndependenceTheme.js"
import quitoFoundationTheme from "./presets/quitoFoundationTheme.js"
import carnivalTheme from "./presets/carnivalTheme.js"
import internationalWomensDayTheme from "./presets/internationalWomensDayTheme.js"
import goodFridayTheme from "./presets/goodFridayTheme.js"
import laborDayTheme from "./presets/laborDayTheme.js"
import mothersDayTheme from "./presets/mothersDayTheme.js"
import battleOfPichinchaTheme from "./presets/battleOfPichinchaTheme.js"
import newYearTheme from "./presets/newYearTheme.js"
import childrensDayTheme from "./presets/childrensDayTheme.js"
import fathersDayTheme from "./presets/fathersDayTheme.js"
import guayaquilFoundationTheme from "./presets/guayaquilFoundationTheme.js"
import FlagDayDecorations from "./FlagDayDecorations.jsx"
import GuayaquilIndependenceDecorations from "./GuayaquilIndependenceDecorations.jsx"
import HalloweenDecorations from "./HalloweenDecorations.jsx"
import AllSoulsDayDecorations from "./AllSoulsDayDecorations.jsx"
import CuencaIndependenceDecorations from "./CuencaIndependenceDecorations.jsx"
import ChristmasDecorations from "./ChristmasDecorations.jsx"
import YearEndDecorations from "./YearEndDecorations.jsx"
import FirstCryOfIndependenceDecorations from "./FirstCryOfIndependenceDecorations.jsx"
import QuitoFoundationDecorations from "./QuitoFoundationDecorations.jsx"
import CarnivalDecorations from "./CarnivalDecorations.jsx"
import InternationalWomensDayDecorations from "./InternationalWomensDayDecorations.jsx"
import GoodFridayDecorations from "./GoodFridayDecorations.jsx"
import LaborDayDecorations from "./LaborDayDecorations.jsx"
import MothersDayDecorations from "./MothersDayDecorations.jsx"
import BattleOfPichinchaDecorations from "./BattleOfPichinchaDecorations.jsx"
import NewYearDecorations from "./NewYearDecorations.jsx"
import ChildrensDayDecorations from "./ChildrensDayDecorations.jsx"
import FathersDayDecorations from "./FathersDayDecorations.jsx"
import GuayaquilFoundationDecorations from "./GuayaquilFoundationDecorations.jsx"
import {
  clearDevelopmentThemeDateKey,
  getDateTimeKeyInTimeZone,
  getEffectiveThemeDateKey,
  readDevelopmentThemeDateKey,
  readDevelopmentThemeDateKeyFromUrl,
  resolveLocalScheduledTheme,
  setDevelopmentThemeDateKey,
} from "./themeCalendar.js"
import ThemeDecorations from "./ThemeDecorations.jsx"

import "./themeAssets.css"
import "./themeDecorations.css"
import "./flagDayTheme.css"
import "./guayaquilIndependenceTheme.css"
import "./halloweenTheme.css"
import "./allSoulsDayTheme.css"
import "./cuencaIndependenceTheme.css"
import "./christmasTheme.css"
import "./yearEndTheme.css"
import "./firstCryOfIndependenceTheme.css"
import "./quitoFoundationTheme.css"
import "./carnivalTheme.css"
import "./internationalWomensDayTheme.css"
import "./goodFridayTheme.css"
import "./laborDayTheme.css"
import "./mothersDayTheme.css"
import "./battleOfPichinchaTheme.css"
import "./newYearTheme.css"
import "./childrensDayTheme.css"
import "./fathersDayTheme.css"
import "./guayaquilFoundationTheme.css"

const ThemeContext = createContext(null)

const THEME_PREVIEW_KEY = "phoenix:v2:theme-preview"
const DEFAULT_THEME_KEY = "phoenix"
const DATE_CHECK_INTERVAL_MS = 15_000
const RUNTIME_REFRESH_INTERVAL_MS = 60_000

const AVAILABLE_THEMES = {
  phoenix: defaultTheme,
  valentines_day: valentinesDayTheme,
  flag_day: flagDayTheme,
  guayaquil_independence: guayaquilIndependenceTheme,
  halloween: halloweenTheme,
  all_souls_day: allSoulsDayTheme,
  cuenca_independence: cuencaIndependenceTheme,
  christmas: christmasTheme,
  year_end: yearEndTheme,
  first_cry_of_independence: firstCryOfIndependenceTheme,
  quito_foundation: quitoFoundationTheme,
  carnival: carnivalTheme,
  international_womens_day: internationalWomensDayTheme,
  good_friday: goodFridayTheme,
  labor_day: laborDayTheme,
  mothers_day: mothersDayTheme,
  battle_of_pichincha: battleOfPichinchaTheme,
  new_year: newYearTheme,
  childrens_day: childrensDayTheme,
  fathers_day: fathersDayTheme,
  guayaquil_foundation: guayaquilFoundationTheme,
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(defaultTheme)
  const [loadingTheme, setLoadingTheme] = useState(true)
  const [themeError, setThemeError] = useState("")

  const appTimeZone = useMemo(() => getAppTimeZone(), [])
  const userTimeZone = useMemo(() => getUserTimeZone(), [])

  useEffect(() => {
    let alive = true
    let requestInFlight = false
    let refreshQueued = false
    let lastSelectionSignature = ""
    let currentAppliedSource = "local-default"
    let runtimeSnapshot = readCachedThemeRuntimeSnapshot()

    function resolveRealDateTimeKey() {
      return getDateTimeKeyInTimeZone(new Date(), appTimeZone)
    }

    function resolveCurrentDateTimeKey() {
      return getEffectiveThemeDateKey(resolveRealDateTimeKey())
    }

    let currentDateTimeKey = resolveCurrentDateTimeKey()

    function applyTheme(themeToApply) {
      if (!alive) return

      const safeTheme = normalizeSupportedTheme(themeToApply)
      currentAppliedSource = safeTheme?.source || "local-default"
      setTheme(safeTheme)
      applyThemeVariables(safeTheme)
    }

    /* A normal DEV page load must not inherit an old local preview. */
    const hasExplicitThemePreview = Boolean(readUrlThemePreviewCode())
    const hasExplicitDatePreview =
      import.meta.env.DEV && Boolean(readDevelopmentThemeDateKeyFromUrl())

    if (
      import.meta.env.DEV &&
      !hasExplicitThemePreview &&
      !hasExplicitDatePreview
    ) {
      clearPreviewThemeCode()
      clearDevelopmentThemeDateKey()
    }

    syncUrlThemePreview()

    function getPreviewTheme() {
      const code = readPreviewThemeCode()
      return code ? AVAILABLE_THEMES[code] || null : null
    }

    function resolveSelection(dateTimeKey = currentDateTimeKey) {
      const previewTheme = getPreviewTheme()

      if (previewTheme) {
        return {
          themeKey: previewTheme.themeKey,
          source: "local-preview",
          mode: "preview",
        }
      }

      const runtimeConfig =
        runtimeSnapshot?.runtimeConfig || getDefaultThemeRuntimeConfig()

      /* A valid remote MANUAL mode wins globally on Web + App. */
      if (
        runtimeConfig?.mode === "manual" &&
        normalizeThemeKey(runtimeConfig?.manualThemeKey) &&
        AVAILABLE_THEMES[normalizeThemeKey(runtimeConfig.manualThemeKey)]
      ) {
        return resolveRuntimeThemeSelection({
          dateTimeKey,
          runtimeConfig,
          calendarEntries: runtimeSnapshot?.calendarEntries || [],
          availableThemeKeys: Object.keys(AVAILABLE_THEMES),
          defaultThemeKey: DEFAULT_THEME_KEY,
        })
      }

      /* Remote calendar is shared by Web + future App when available. */
      if (runtimeSnapshot?.calendarEntries?.length) {
        return resolveRuntimeThemeSelection({
          dateTimeKey,
          runtimeConfig,
          calendarEntries: runtimeSnapshot.calendarEntries,
          availableThemeKeys: Object.keys(AVAILABLE_THEMES),
          defaultThemeKey: DEFAULT_THEME_KEY,
        })
      }

      /* Offline/first-run fallback: exact approved local V2 calendar. */
      const localTheme = resolveLocalScheduledTheme({
        dateTimeKey,
        availableThemes: AVAILABLE_THEMES,
      })

      return {
        themeKey: localTheme?.themeKey || DEFAULT_THEME_KEY,
        source: localTheme ? "local-calendar" : "local-default",
        mode: "auto",
      }
    }

    function selectionSignature(selection) {
      return [
        selection?.themeKey || DEFAULT_THEME_KEY,
        selection?.source || "",
        selection?.mode || "",
        runtimeSnapshot?.runtimeConfig?.revision || 0,
      ].join("|")
    }

    async function loadTheme({
      background = false,
      refreshRuntime = false,
    } = {}) {
      if (requestInFlight) {
        refreshQueued = true
        return
      }

      requestInFlight = true

      try {
        if (!background) setLoadingTheme(true)

        if (refreshRuntime) {
          try {
            runtimeSnapshot = await fetchThemeRuntimeSnapshot()
          } catch (error) {
            const cached = readCachedThemeRuntimeSnapshot()
            if (cached) runtimeSnapshot = cached

            console.warn(
              "[PHO3NIX] Runtime remoto no disponible; se usará caché/calendario local:",
              error
            )
          }
        }

        currentDateTimeKey = resolveCurrentDateTimeKey()
        const selection = resolveSelection(currentDateTimeKey)
        const key = normalizeThemeKey(selection.themeKey)
        const preset = AVAILABLE_THEMES[key] || defaultTheme

        /* Immediate paint: no network dependency. */
        const cachedRemoteTheme = readCachedRemoteTheme(key)
        applyTheme(
          cachedRemoteTheme
            ? mergePresetWithRemote(preset, cachedRemoteTheme, selection.source)
            : { ...preset, source: selection.source }
        )

        lastSelectionSignature = selectionSignature(selection)
        setThemeError("")

        /* Pull latest shared visual definition for this exact key. */
        try {
          const remoteTheme = await fetchRemoteThemeByKey(key)

          if (alive && remoteTheme?.themeKey) {
            applyTheme(
              mergePresetWithRemote(preset, remoteTheme, selection.source)
            )
          }
        } catch (error) {
          if (!alive) return

          console.warn(
            `[PHO3NIX] No se pudo actualizar la definición remota de "${key}"; se conserva preset/caché:`,
            error
          )
        }
      } catch (error) {
        if (!alive) return

        console.warn(
          "[PHO3NIX] Error de resolución de theme. Se usará PHOENIX:",
          error
        )
        applyTheme(defaultTheme)
        setThemeError(error?.message || "No se pudo resolver el theme.")
      } finally {
        requestInFlight = false
        if (alive && !background) setLoadingTheme(false)

        if (alive && refreshQueued) {
          refreshQueued = false
          queueMicrotask(() => {
            loadTheme({ background: true, refreshRuntime: true })
          })
        }
      }
    }

    function checkScheduleTransition() {
      currentDateTimeKey = resolveCurrentDateTimeKey()
      const selection = resolveSelection(currentDateTimeKey)
      const signature = selectionSignature(selection)

      if (signature === lastSelectionSignature) return

      loadTheme({ background: true })
    }

    function refreshWhenVisible() {
      if (document.visibilityState !== "visible") return
      loadTheme({ background: true, refreshRuntime: true })
    }

    window.phoenixThemePreview = {
      list: () => Object.keys(AVAILABLE_THEMES),
      current: () => readPreviewThemeCode() || "auto",
      active: () =>
        document.documentElement.dataset.themeKey || DEFAULT_THEME_KEY,
      source: () => currentAppliedSource,

      calendar: () => {
        const realDateTimeKey = resolveRealDateTimeKey()
        const dateTimeKey = resolveCurrentDateTimeKey()
        const selection = resolveSelection(dateTimeKey)

        return {
          realDateKey: realDateTimeKey.slice(0, 10),
          realDateTimeKey,
          dateKey: dateTimeKey.slice(0, 10),
          dateTimeKey,
          simulated:
            import.meta.env.DEV &&
            Boolean(
              readDevelopmentThemeDateKeyFromUrl() ||
              readDevelopmentThemeDateKey()
            ),
          themeKey: selection.themeKey,
          source: selection.source,
          mode: selection.mode,
          runtimeSource: runtimeSnapshot?.source || "local",
          runtimeRevision: runtimeSnapshot?.runtimeConfig?.revision || 0,
          timeZone: appTimeZone,
        }
      },

      runtime: () => ({
        source: runtimeSnapshot?.source || "local",
        runtimeConfig:
          runtimeSnapshot?.runtimeConfig || getDefaultThemeRuntimeConfig(),
        calendarEntries: runtimeSnapshot?.calendarEntries || [],
      }),

      date: async (value) => {
        if (!import.meta.env.DEV) {
          console.warn(
            "[PHO3NIX] date() está disponible únicamente en desarrollo."
          )
          return false
        }

        const normalized = String(value || "").trim().toLowerCase()

        if (["real", "auto", "clear"].includes(normalized)) {
          clearDevelopmentThemeDateKey()
        } else if (!setDevelopmentThemeDateKey(value)) {
          console.warn(
            `[PHO3NIX] Fecha de preview inválida: ${value}. Usa YYYY-MM-DD, YYYY-MM-DDTHH:mm o "real".`
          )
          return false
        }

        clearPreviewThemeCode()
        await loadTheme({ background: false })
        return true
      },

      set: (code) => {
        const key = normalizeThemeKey(code)
        const nextTheme = AVAILABLE_THEMES[key]

        if (!nextTheme) {
          console.warn(
            `[PHO3NIX] Theme preview desconocido: ${code}. Disponibles:`,
            Object.keys(AVAILABLE_THEMES)
          )
          return false
        }

        writePreviewThemeCode(key)
        applyTheme({ ...nextTheme, source: "local-preview" })
        setThemeError("")
        setLoadingTheme(false)
        return true
      },

      auto: () => {
        clearPreviewThemeCode()

        if (
          import.meta.env.DEV &&
          !readDevelopmentThemeDateKeyFromUrl()
        ) {
          clearDevelopmentThemeDateKey()
        }

        loadTheme({ background: false, refreshRuntime: true })
        return true
      },

      sync: async () => {
        await loadTheme({ background: false, refreshRuntime: true })
        return true
      },
    }

    /* Fast local/cached paint, then shared Supabase sync. */
    loadTheme({ background: false })
    loadTheme({ background: true, refreshRuntime: true })

    const dateCheckTimer = window.setInterval(
      checkScheduleTransition,
      DATE_CHECK_INTERVAL_MS
    )

    const runtimeRefreshTimer = window.setInterval(
      () => loadTheme({ background: true, refreshRuntime: true }),
      RUNTIME_REFRESH_INTERVAL_MS
    )

    const unsubscribeRealtime = subscribeThemeRuntimeChanges(() => {
      loadTheme({ background: true, refreshRuntime: true })
    })

    window.addEventListener("focus", refreshWhenVisible)
    document.addEventListener("visibilitychange", refreshWhenVisible)

    return () => {
      alive = false
      window.clearInterval(dateCheckTimer)
      window.clearInterval(runtimeRefreshTimer)
      unsubscribeRealtime()
      window.removeEventListener("focus", refreshWhenVisible)
      document.removeEventListener("visibilitychange", refreshWhenVisible)
      delete window.phoenixThemePreview
    }
  }, [appTimeZone])

  const value = useMemo(
    () => ({
      theme,
      loadingTheme,
      themeError,
      isRemoteTheme: String(theme?.source || "").includes("remote"),
      appTimeZone,
      userTimeZone,
    }),
    [theme, loadingTheme, themeError, appTimeZone, userTimeZone]
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
      <ThemeDecorations themeKey={theme?.themeKey} />
      <FlagDayDecorations themeKey={theme?.themeKey} />
      <GuayaquilIndependenceDecorations themeKey={theme?.themeKey} />
      <HalloweenDecorations themeKey={theme?.themeKey} />
      <AllSoulsDayDecorations themeKey={theme?.themeKey} />
      <CuencaIndependenceDecorations themeKey={theme?.themeKey} />
      <ChristmasDecorations themeKey={theme?.themeKey} />
      <YearEndDecorations themeKey={theme?.themeKey} />
      <FirstCryOfIndependenceDecorations themeKey={theme?.themeKey} />
      <QuitoFoundationDecorations themeKey={theme?.themeKey} />
      <CarnivalDecorations themeKey={theme?.themeKey} />
      <InternationalWomensDayDecorations themeKey={theme?.themeKey} />
      <GoodFridayDecorations themeKey={theme?.themeKey} />
      <LaborDayDecorations themeKey={theme?.themeKey} />
      <MothersDayDecorations themeKey={theme?.themeKey} />
      <BattleOfPichinchaDecorations themeKey={theme?.themeKey} />
      <NewYearDecorations themeKey={theme?.themeKey} />
      <ChildrensDayDecorations themeKey={theme?.themeKey} />
      <FathersDayDecorations themeKey={theme?.themeKey} />
      <GuayaquilFoundationDecorations themeKey={theme?.themeKey} />
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const value = useContext(ThemeContext)

  if (!value) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider.")
  }

  return value
}

function normalizeSupportedTheme(candidate) {
  if (!candidate?.themeKey) return defaultTheme

  const key = normalizeThemeKey(candidate.themeKey)

  if (!AVAILABLE_THEMES[key]) return defaultTheme

  return {
    ...candidate,
    themeKey: key,
  }
}

function mergePresetWithRemote(preset, remoteTheme, selectionSource) {
  return {
    ...preset,
    ...compactObject(remoteTheme || {}),
    themeKey: normalizeThemeKey(
      remoteTheme?.themeKey || preset?.themeKey
    ),
    source: `${selectionSource || "auto"}+remote-visuals`,
    colors: {
      ...(preset?.colors || {}),
      ...compactObject(remoteTheme?.colors || {}),
    },
    radius: {
      ...(preset?.radius || {}),
      ...compactObject(remoteTheme?.radius || {}),
    },
    assets: mergeAssets(preset?.assets, remoteTheme?.assets),
  }
}

function compactObject(object) {
  return Object.fromEntries(
    Object.entries(object || {}).filter(
      ([, value]) => value !== null && value !== undefined && value !== ""
    )
  )
}

function mergeAssets(base = {}, next = {}) {
  const result = { ...(base || {}) }

  for (const [key, value] of Object.entries(next || {})) {
    if (value !== undefined) result[key] = value
  }

  return result
}

function readUrlThemePreviewCode() {
  if (typeof window === "undefined") return ""

  try {
    const params = new URLSearchParams(window.location.search)
    return normalizeThemeKey(params.get("theme") || "")
  } catch {
    return ""
  }
}

function syncUrlThemePreview() {
  const urlCode = readUrlThemePreviewCode()
  if (!urlCode) return

  if (urlCode === "auto") {
    clearPreviewThemeCode()
    return
  }

  if (!AVAILABLE_THEMES[urlCode]) {
    console.warn(
      `[PHO3NIX] Theme recibido por URL desconocido: ${urlCode}.`
    )
    return
  }

  writePreviewThemeCode(urlCode)
}

function readPreviewThemeCode() {
  if (typeof window === "undefined") return ""

  try {
    return normalizeThemeKey(
      window.localStorage.getItem(THEME_PREVIEW_KEY) || ""
    )
  } catch {
    return ""
  }
}

function writePreviewThemeCode(code) {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(
      THEME_PREVIEW_KEY,
      normalizeThemeKey(code)
    )
  } catch {}
}

function clearPreviewThemeCode() {
  if (typeof window === "undefined") return

  try {
    window.localStorage.removeItem(THEME_PREVIEW_KEY)
  } catch {}
}

function normalizeThemeKey(value) {
  return String(value || "").trim().toLowerCase()
}
