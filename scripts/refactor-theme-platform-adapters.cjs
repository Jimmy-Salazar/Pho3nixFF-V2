const fs = require("fs")
const path = require("path")
const { execFileSync } = require("child_process")

const ROOT = process.cwd()

const SRC = path.join(ROOT, "src")
const SRC_THEME = path.join(SRC, "theme")
const SHARED_THEME = path.join(SRC, "shared", "theme")
const PLATFORM_ROOT = path.join(SRC, "platform")
const WEB_THEME = path.join(PLATFORM_ROOT, "web", "theme")
const MOBILE_THEME = path.join(PLATFORM_ROOT, "mobile", "theme")
const BACKUP_ROOT = path.join(ROOT, ".pho3nix-backups")

const RUNTIME_SERVICE =
  path.join(SRC_THEME, "themeRuntimeService.js")

const REMOTE_SERVICE =
  path.join(SRC_THEME, "remoteThemeService.js")

main()

function main() {
  console.log("")
  console.log("PHO3NIX V2 — THEME PLATFORM ADAPTERS")
  console.log("====================================")
  console.log("")

  validateProject()

  if (isAlreadyApplied()) {
    console.log("✅ Platform Adapters ya están instalados.")
    console.log("")
    console.log("No se realizó ningún cambio.")
    console.log("")
    return
  }

  const backupDir = createBackup()

  try {
    fs.mkdirSync(WEB_THEME, { recursive: true })
    fs.mkdirSync(MOBILE_THEME, { recursive: true })

    writePlatformFiles()
    writeServiceBridges()
    writeManifest(backupDir)

    validateGeneratedJavaScript()
    validateArchitecture()

    console.log("")
    console.log("✅ PLATFORM ADAPTERS COMPLETADOS")
    console.log("")
    console.log("Web adapters:")
    console.log("  src/platform/web/theme/")
    console.log("")
    console.log("Mobile contract:")
    console.log("  src/platform/mobile/theme/")
    console.log("")
    console.log("Los imports existentes siguen funcionando:")
    console.log("  src/theme/themeRuntimeService.js")
    console.log("  src/theme/remoteThemeService.js")
    console.log("")
    console.log("Backup:")
    console.log(`  ${relative(backupDir)}`)
    console.log("")
    console.log("Ahora ejecuta:")
    console.log("  npm run dev -- --host 0.0.0.0")
    console.log("")
  } catch (error) {
    console.error("")
    console.error("❌ ERROR DURANTE LA FASE PLATFORM ADAPTERS")
    console.error(error?.stack || error)
    console.error("")
    console.error("Ejecuta:")
    console.error("  node scripts/rollback-theme-platform-adapters.cjs")
    console.error("")
    process.exitCode = 1
  }
}

function validateProject() {
  if (!fs.existsSync(path.join(ROOT, "package.json"))) {
    fail(
      "Ejecuta este script desde C:\\projects\\phoenix-v2 " +
      "o desde la raíz donde está package.json."
    )
  }

  if (!fs.existsSync(SHARED_THEME)) {
    fail(
      "No existe src/shared/theme/. " +
      "Primero debe estar completada la Fase 1 — Shared Theme Engine."
    )
  }

  const sharedRequired = [
    "themeCalendar.js",
    "themeScheduleResolver.js",
    "themeRuntimeResolver.js",
    "themeRegistry.js",
  ]

  for (const name of sharedRequired) {
    const file = path.join(SHARED_THEME, name)

    if (!fs.existsSync(file)) {
      fail(`Falta ${relative(file)}`)
    }
  }

  for (const file of [RUNTIME_SERVICE, REMOTE_SERVICE]) {
    if (!fs.existsSync(file)) {
      fail(`Falta ${relative(file)}`)
    }
  }

  const runtimeSource = read(RUNTIME_SERVICE)
  const remoteSource = read(REMOTE_SERVICE)

  const expectedRuntimeExports = [
    "getDefaultThemeRuntimeConfig",
    "fetchThemeRuntimeSnapshot",
    "readCachedThemeRuntimeSnapshot",
    "subscribeThemeRuntimeChanges",
  ]

  const expectedRemoteExports = [
    "fetchRemoteThemeByKey",
    "readCachedRemoteTheme",
    "fetchActiveRemoteTheme",
  ]

  for (const exportName of expectedRuntimeExports) {
    if (!runtimeSource.includes(exportName)) {
      fail(
        `themeRuntimeService.js no contiene ${exportName}. ` +
        "No modificaré una versión desconocida."
      )
    }
  }

  for (const exportName of expectedRemoteExports) {
    if (!remoteSource.includes(exportName)) {
      fail(
        `remoteThemeService.js no contiene ${exportName}. ` +
        "No modificaré una versión desconocida."
      )
    }
  }

  console.log("✅ Shared Theme Engine detectado.")
  console.log("✅ Servicios actuales detectados.")
}

function isAlreadyApplied() {
  const manifest = path.join(
    PLATFORM_ROOT,
    "theme-platform-manifest.json"
  )

  if (!fs.existsSync(manifest)) return false

  const runtimeSource =
    fs.existsSync(RUNTIME_SERVICE)
      ? read(RUNTIME_SERVICE)
      : ""

  const remoteSource =
    fs.existsSync(REMOTE_SERVICE)
      ? read(REMOTE_SERVICE)
      : ""

  return (
    runtimeSource.includes(
      "../platform/web/theme/themeStorage.js"
    ) &&
    remoteSource.includes(
      "../platform/web/theme/themeSync.js"
    )
  )
}

function createBackup() {
  fs.mkdirSync(BACKUP_ROOT, { recursive: true })

  const backupDir = path.join(
    BACKUP_ROOT,
    `theme-platform-${timestamp()}`
  )

  fs.mkdirSync(backupDir, { recursive: true })

  fs.cpSync(
    SRC_THEME,
    path.join(backupDir, "theme"),
    { recursive: true }
  )

  const platformExisted =
    fs.existsSync(PLATFORM_ROOT)

  if (platformExisted) {
    fs.cpSync(
      PLATFORM_ROOT,
      path.join(backupDir, "platform"),
      { recursive: true }
    )
  }

  writeJson(
    path.join(backupDir, "backup-meta.json"),
    {
      createdAt: new Date().toISOString(),
      root: ROOT,
      platformExisted,
    }
  )

  console.log(
    `✅ Backup creado: ${relative(backupDir)}`
  )

  return backupDir
}

function writePlatformFiles() {
  write(
    path.join(WEB_THEME, "themeStorage.js"),
    buildThemeStorage()
  )

  write(
    path.join(WEB_THEME, "themeSync.js"),
    buildThemeSync()
  )

  write(
    path.join(WEB_THEME, "index.js"),
    [
      'export * from "./themeStorage.js"',
      'export * from "./themeSync.js"',
      "",
    ].join("\n")
  )

  write(
    path.join(MOBILE_THEME, "ADAPTER-CONTRACT.md"),
    buildMobileContract()
  )

  console.log("✅ Web storage adapter creado.")
  console.log("✅ Web Supabase/Realtime adapter creado.")
  console.log("✅ Contrato Mobile creado.")
}

function writeServiceBridges() {
  write(
    RUNTIME_SERVICE,
    buildRuntimeService()
  )

  write(
    REMOTE_SERVICE,
    buildRemoteThemeService()
  )

  console.log("✅ themeRuntimeService.js conectado al adapter Web.")
  console.log("✅ remoteThemeService.js conectado al adapter Web.")
}

function buildThemeStorage() {
  return `/*
 * PHO3NIX V2 — WEB THEME STORAGE ADAPTER
 *
 * Browser-only persistence.
 *
 * Future React Native implementation:
 *   AsyncStorage / SecureStore / filesystem cache.
 *
 * Domain/calendar logic must NOT be added here.
 */

const RUNTIME_CACHE_KEY =
  "phoenix:v2:theme-runtime-snapshot"

const THEME_VISUAL_CACHE_PREFIX =
  "phoenix:v2:theme-visual:"

export function readThemeRuntimeSnapshotCache() {
  const storage = getBrowserStorage()
  if (!storage) return null

  try {
    const raw =
      storage.getItem(RUNTIME_CACHE_KEY)

    if (!raw) return null

    const parsed = JSON.parse(raw)

    if (
      !parsed ||
      !Array.isArray(parsed.calendarEntries)
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function writeThemeRuntimeSnapshotCache(
  snapshot
) {
  const storage = getBrowserStorage()
  if (!storage || !snapshot) return

  try {
    storage.setItem(
      RUNTIME_CACHE_KEY,
      JSON.stringify(snapshot)
    )
  } catch {}
}

export function clearThemeRuntimeSnapshotCache() {
  const storage = getBrowserStorage()
  if (!storage) return

  try {
    storage.removeItem(RUNTIME_CACHE_KEY)
  } catch {}
}

export function readThemeVisualCache(themeKey) {
  const storage = getBrowserStorage()
  if (!storage) return null

  const key = normalizeThemeKey(themeKey)
  if (!key) return null

  try {
    const raw = storage.getItem(
      visualCacheKey(key)
    )

    if (!raw) return null

    const parsed = JSON.parse(raw)

    return normalizeThemeKey(
      parsed?.themeKey
    ) === key
      ? parsed
      : null
  } catch {
    return null
  }
}

export function writeThemeVisualCache(theme) {
  const storage = getBrowserStorage()
  if (!storage) return

  const key = normalizeThemeKey(
    theme?.themeKey
  )

  if (!key) return

  try {
    storage.setItem(
      visualCacheKey(key),
      JSON.stringify(theme)
    )
  } catch {}
}

export function clearThemeVisualCache(themeKey) {
  const storage = getBrowserStorage()
  if (!storage) return

  const key = normalizeThemeKey(themeKey)
  if (!key) return

  try {
    storage.removeItem(
      visualCacheKey(key)
    )
  } catch {}
}

function visualCacheKey(themeKey) {
  return \`\${THEME_VISUAL_CACHE_PREFIX}\${themeKey}\`
}

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return null
  }

  try {
    return window.localStorage || null
  } catch {
    return null
  }
}

function normalizeThemeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
}
`
}

function buildThemeSync() {
  return `import { supabase } from "../../../config/supabase.js"

/*
 * PHO3NIX V2 — WEB THEME SYNC ADAPTER
 *
 * Network/Realtime implementation used by the Web client.
 *
 * Future mobile adapter must expose the same conceptual operations,
 * while the shared Theme Engine remains unchanged.
 */

export async function fetchThemeRuntimeSnapshotRemote() {
  requireSupabase()

  const [runtimeResult, calendarResult] =
    await Promise.all([
      supabase
        .from("app_theme_runtime")
        .select(
          "config_key, mode, manual_theme_key, timezone, revision, updated_at"
        )
        .eq("config_key", "global")
        .maybeSingle(),

      supabase
        .from("app_theme_calendar")
        .select(
          "theme_key, enabled, priority, rule, updated_at"
        )
        .eq("enabled", true)
        .order("priority", {
          ascending: false,
        })
        .order("theme_key", {
          ascending: true,
        }),
    ])

  if (runtimeResult.error) {
    throw runtimeResult.error
  }

  if (calendarResult.error) {
    throw calendarResult.error
  }

  return {
    runtimeRow: runtimeResult.data || null,
    calendarRows: calendarResult.data || [],
    fetchedAt: new Date().toISOString(),
    source: "remote",
  }
}

export async function fetchThemeVisualByKeyRemote(
  themeKey
) {
  if (!supabase) return null

  const key = normalizeThemeKey(themeKey)
  if (!key) return null

  const { data, error } = await supabase
    .from("app_themes")
    .select("*")
    .eq("theme_key", key)
    .order("is_active", {
      ascending: false,
    })
    .order("priority", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle()

  if (error) throw error

  return data || null
}

export async function fetchActiveThemeVisualRemote(
  dateKey
) {
  if (!supabase) return null

  const day = String(dateKey || "").trim()
  if (!day) return null

  const { data, error } = await supabase
    .from("app_themes")
    .select("*")
    .eq("is_active", true)
    .or(
      \`start_date.is.null,start_date.lte.\${day}\`
    )
    .or(
      \`end_date.is.null,end_date.gte.\${day}\`
    )
    .order("priority", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle()

  if (error) throw error

  return data || null
}

export function subscribeThemeRuntimeRemote(
  onChange
) {
  if (
    !supabase?.channel ||
    typeof onChange !== "function"
  ) {
    return () => {}
  }

  const channel = supabase
    .channel("pho3nix-v2-theme-runtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "app_theme_runtime",
      },
      () => onChange("runtime")
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "app_theme_calendar",
      },
      () => onChange("calendar")
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "app_themes",
      },
      () => onChange("theme")
    )
    .subscribe()

  return () => {
    try {
      supabase.removeChannel(channel)
    } catch {}
  }
}

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase no está disponible."
    )
  }
}

function normalizeThemeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
}
`
}

function buildRuntimeService() {
  return `import {
  readThemeRuntimeSnapshotCache,
  writeThemeRuntimeSnapshotCache,
} from "../platform/web/theme/themeStorage.js"

import {
  fetchThemeRuntimeSnapshotRemote,
  subscribeThemeRuntimeRemote,
} from "../platform/web/theme/themeSync.js"

const DEFAULT_TIME_ZONE =
  "America/Guayaquil"

/*
 * Application-facing service.
 *
 * ThemeProvider keeps importing this file, while browser-specific
 * persistence/network code lives under src/platform/web/theme/.
 */

export function getDefaultThemeRuntimeConfig() {
  return {
    mode: "auto",
    manualThemeKey: null,
    timeZone: DEFAULT_TIME_ZONE,
    revision: 1,
  }
}

export async function fetchThemeRuntimeSnapshot() {
  const remote =
    await fetchThemeRuntimeSnapshotRemote()

  const snapshot = {
    runtimeConfig:
      mapRuntimeConfig(remote.runtimeRow),

    calendarEntries:
      (remote.calendarRows || [])
        .map(mapCalendarEntry),

    fetchedAt:
      remote.fetchedAt ||
      new Date().toISOString(),

    source: "remote",
  }

  writeThemeRuntimeSnapshotCache(snapshot)

  return snapshot
}

export function readCachedThemeRuntimeSnapshot() {
  const parsed =
    readThemeRuntimeSnapshotCache()

  if (!parsed) return null

  return {
    ...parsed,

    runtimeConfig: {
      ...getDefaultThemeRuntimeConfig(),
      ...(parsed.runtimeConfig || {}),
    },

    source: "cache",
  }
}

export function subscribeThemeRuntimeChanges(
  onChange
) {
  return subscribeThemeRuntimeRemote(
    onChange
  )
}

function mapRuntimeConfig(row) {
  const defaults =
    getDefaultThemeRuntimeConfig()

  if (!row) return defaults

  return {
    mode:
      row.mode === "manual"
        ? "manual"
        : "auto",

    manualThemeKey:
      normalizeThemeKey(
        row.manual_theme_key
      ) || null,

    timeZone:
      String(
        row.timezone ||
        defaults.timeZone
      ),

    revision:
      Number(
        row.revision ||
        defaults.revision
      ),

    updatedAt:
      row.updated_at || null,
  }
}

function mapCalendarEntry(row) {
  return {
    themeKey:
      normalizeThemeKey(
        row.theme_key
      ),

    enabled:
      row.enabled !== false,

    priority:
      Number(
        row.priority || 0
      ),

    rule:
      row.rule &&
      typeof row.rule === "object"
        ? row.rule
        : {},

    updatedAt:
      row.updated_at || null,
  }
}

function normalizeThemeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
}
`
}

function buildRemoteThemeService() {
  return `import {
  readThemeVisualCache,
  writeThemeVisualCache,
} from "../platform/web/theme/themeStorage.js"

import {
  fetchActiveThemeVisualRemote,
  fetchThemeVisualByKeyRemote,
} from "../platform/web/theme/themeSync.js"

import {
  getAppTimeZone,
  getDateKeyInTimeZone,
} from "./timezone.js"

/*
 * Application-facing visual theme service.
 *
 * Browser storage + Supabase transport are delegated to:
 *   src/platform/web/theme/
 */

export async function fetchRemoteThemeByKey(
  themeKey
) {
  const key = normalizeThemeKey(themeKey)
  if (!key) return null

  const row =
    await fetchThemeVisualByKeyRemote(key)

  const theme =
    row ? mapRemoteTheme(row) : null

  if (theme) {
    writeThemeVisualCache(theme)
  }

  return theme
}

export function readCachedRemoteTheme(
  themeKey
) {
  return readThemeVisualCache(
    themeKey
  )
}

/*
 * Legacy method kept for compatibility with any existing imports.
 */
export async function fetchActiveRemoteTheme({
  date = new Date(),
  timeZone = getAppTimeZone(),
} = {}) {
  const today =
    getDateKeyInTimeZone(
      date,
      timeZone
    )

  const row =
    await fetchActiveThemeVisualRemote(
      today
    )

  return row
    ? mapRemoteTheme(row)
    : null
}

function mapRemoteTheme(row) {
  const homeHeroUrl =
    row.home_hero_url ||
    row.home_background_url ||
    row.home_image_url ||
    null

  const homeHeroMobileUrl =
    row.home_hero_mobile_url ||
    row.home_background_mobile_url ||
    homeHeroUrl

  const loginHeroUrl =
    row.login_hero_url ||
    row.login_image_url ||
    homeHeroUrl

  const dashboardHeroUrl =
    row.dashboard_hero_url ||
    row.dashboard_image_url ||
    homeHeroUrl

  const wodsHeroUrl =
    row.wods_hero_url ||
    dashboardHeroUrl

  const prHeroUrl =
    row.pr_hero_url ||
    dashboardHeroUrl

  const nutritionHeroUrl =
    row.nutrition_hero_url ||
    dashboardHeroUrl

  const challengeHeroUrl =
    row.challenge_hero_url ||
    dashboardHeroUrl

  const dashboardWodUrl =
    row.dashboard_wod_url ||
    wodsHeroUrl ||
    dashboardHeroUrl

  return {
    themeKey: row.theme_key,
    name: row.name,
    source: "remote",

    colors: {
      primary: row.primary_color,
      primaryDark:
        row.primary_dark_color,
      secondary:
        row.secondary_color,
      accent:
        row.accent_color,
      background:
        row.background_color,
      surface:
        row.surface_color,
      surfaceSoft:
        row.surface_soft_color,
      border:
        row.border_color,
      text:
        row.text_color,
      textMuted:
        row.text_muted_color,
    },

    radius: {
      card: row.card_radius,
      button: row.button_radius,
    },

    assets: {
      logoUrl:
        row.logo_url,

      partnerLogoUrl:
        row.partner_logo_url,

      homeHeroUrl,
      homeHeroMobileUrl,
      loginHeroUrl,
      dashboardHeroUrl,
      dashboardWodUrl,
      wodsHeroUrl,
      prHeroUrl,
      nutritionHeroUrl,
      challengeHeroUrl,

      loginImageUrl:
        row.login_image_url ||
        loginHeroUrl,

      homeImageUrl:
        row.home_image_url ||
        homeHeroUrl,

      dashboardImageUrl:
        row.dashboard_image_url ||
        dashboardHeroUrl,

      homeBackgroundUrl:
        row.home_background_url ||
        homeHeroUrl,

      homeBackgroundMobileUrl:
        row.home_background_mobile_url ||
        homeHeroMobileUrl,

      homeMonumentUrl:
        row.home_monument_url,

      homeBrandWordUrl:
        row.home_brand_word_url,

      homePartnerLogoUrl:
        row.home_partner_logo_url ||
        row.partner_logo_url,
    },
  }
}

function normalizeThemeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
}
`
}

function buildMobileContract() {
  return `# PHO3NIX V2 — Mobile Theme Adapter Contract

Este directorio queda reservado para React Native / Expo.

El motor compartido está en:

\`\`\`text
src/shared/theme/
\`\`\`

La futura aplicación móvil NO debe copiar el calendario ni sus reglas.

Debe implementar adapters equivalentes a los de:

\`\`\`text
src/platform/web/theme/
\`\`\`

## Storage

En Web:

\`\`\`text
localStorage
\`\`\`

En móvil podrá utilizarse:

\`\`\`text
AsyncStorage
\`\`\`

o la solución persistente aprobada para la app.

La interfaz conceptual requerida es:

\`\`\`js
readThemeRuntimeSnapshotCache()
writeThemeRuntimeSnapshotCache(snapshot)

readThemeVisualCache(themeKey)
writeThemeVisualCache(theme)
\`\`\`

## Sync

Debe proporcionar operaciones equivalentes a:

\`\`\`js
fetchThemeRuntimeSnapshotRemote()
fetchThemeVisualByKeyRemote(themeKey)
fetchActiveThemeVisualRemote(dateKey)
subscribeThemeRuntimeRemote(onChange)
\`\`\`

## Regla

La app debe consumir:

\`\`\`text
Supabase
   ↓
Platform Mobile Adapter
   ↓
Shared Theme Engine
   ↓
React Native renderer
\`\`\`

Cambios de calendario/themes remotos NO deben requerir una nueva
publicación en Google Play o App Store.

Fallback definitivo:

\`\`\`text
phoenix
\`\`\`

Timezone:

\`\`\`text
America/Guayaquil
\`\`\`
`
}

function writeManifest(backupDir) {
  writeJson(
    path.join(
      PLATFORM_ROOT,
      "theme-platform-manifest.json"
    ),
    {
      phase:
        "PHO3NIX V2 Theme Platform Adapters",

      completedAt:
        new Date().toISOString(),

      backup:
        relative(backupDir),

      sharedEngine:
        "src/shared/theme",

      webAdapter:
        "src/platform/web/theme",

      futureMobileAdapter:
        "src/platform/mobile/theme",

      fallback:
        "phoenix",

      timezone:
        "America/Guayaquil",

      web: {
        storage:
          "localStorage",

        sync:
          "Supabase + Realtime",
      },

      mobile: {
        storage:
          "AsyncStorage or approved persistent adapter",

        sync:
          "Supabase + Realtime",
      },
    }
  )
}

function validateGeneratedJavaScript() {
  const files = [
    path.join(
      WEB_THEME,
      "themeStorage.js"
    ),

    path.join(
      WEB_THEME,
      "themeSync.js"
    ),

    path.join(
      WEB_THEME,
      "index.js"
    ),

    RUNTIME_SERVICE,
    REMOTE_SERVICE,
  ]

  for (const file of files) {
    try {
      execFileSync(
        process.execPath,
        ["--check", file],
        {
          cwd: ROOT,
          stdio: "pipe",
        }
      )
    } catch (error) {
      const output =
        String(
          error?.stderr ||
          error?.stdout ||
          error?.message ||
          error
        )

      fail(
        `Error de sintaxis en ${relative(file)}:\n${output}`
      )
    }
  }

  console.log("✅ Sintaxis JavaScript validada.")
}

function validateArchitecture() {
  const storageSource =
    read(
      path.join(
        WEB_THEME,
        "themeStorage.js"
      )
    )

  const syncSource =
    read(
      path.join(
        WEB_THEME,
        "themeSync.js"
      )
    )

  const runtimeSource =
    read(RUNTIME_SERVICE)

  const remoteSource =
    read(REMOTE_SERVICE)

  if (
    !storageSource.includes(
      "window.localStorage"
    )
  ) {
    fail(
      "themeStorage.js no contiene el adapter Web esperado."
    )
  }

  if (
    storageSource.includes(
      "supabase"
    )
  ) {
    fail(
      "themeStorage.js no debe contener Supabase."
    )
  }

  if (
    !syncSource.includes(
      'from "../../../config/supabase.js"'
    )
  ) {
    fail(
      "themeSync.js no está conectado a Supabase."
    )
  }

  if (
    syncSource.includes(
      "localStorage"
    )
  ) {
    fail(
      "themeSync.js no debe contener localStorage."
    )
  }

  if (
    runtimeSource.includes(
      "window.localStorage"
    )
  ) {
    fail(
      "themeRuntimeService.js todavía contiene almacenamiento Web."
    )
  }

  if (
    remoteSource.includes(
      "window.localStorage"
    )
  ) {
    fail(
      "remoteThemeService.js todavía contiene almacenamiento Web."
    )
  }

  if (
    runtimeSource.includes(
      'from "../config/supabase.js"'
    )
  ) {
    fail(
      "themeRuntimeService.js todavía contiene transporte Supabase."
    )
  }

  if (
    remoteSource.includes(
      'from "../config/supabase.js"'
    )
  ) {
    fail(
      "remoteThemeService.js todavía contiene transporte Supabase."
    )
  }

  console.log("✅ Separación Storage / Sync validada.")
}

function read(file) {
  return fs.readFileSync(
    file,
    "utf8"
  )
}

function write(file, content) {
  fs.mkdirSync(
    path.dirname(file),
    { recursive: true }
  )

  fs.writeFileSync(
    file,
    content.replace(/\r\n/g, "\n"),
    "utf8"
  )
}

function writeJson(file, value) {
  write(
    file,
    JSON.stringify(
      value,
      null,
      2
    ) + "\n"
  )
}

function relative(file) {
  return (
    path.relative(ROOT, file) ||
    "."
  )
}

function timestamp() {
  const date = new Date()

  const p = (value) =>
    String(value).padStart(2, "0")

  return (
    `${date.getFullYear()}` +
    `${p(date.getMonth() + 1)}` +
    `${p(date.getDate())}-` +
    `${p(date.getHours())}` +
    `${p(date.getMinutes())}` +
    `${p(date.getSeconds())}`
  )
}

function fail(message) {
  throw new Error(message)
}
