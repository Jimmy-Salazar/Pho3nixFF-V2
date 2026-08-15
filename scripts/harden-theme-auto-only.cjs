const fs = require("fs")
const path = require("path")
const { execFileSync } = require("child_process")

const ROOT = process.cwd()

const SRC = path.join(ROOT, "src")
const ADMIN_THEME = path.join(
  SRC,
  "modules",
  "admin",
  "themes"
)

const ADMIN_PAGE = path.join(
  SRC,
  "modules",
  "admin",
  "pages",
  "AdminThemesPage.jsx"
)

const RUNTIME_SERVICE = path.join(
  SRC,
  "theme",
  "themeRuntimeService.js"
)

const BACKUP_ROOT = path.join(
  ROOT,
  ".pho3nix-backups"
)

main()

function main() {
  console.log("")
  console.log("PHO3NIX V2 — THEME AUTO-ONLY HARDENING")
  console.log("========================================")
  console.log("")

  validateProject()

  if (isAlreadyApplied()) {
    console.log("✅ AUTO-ONLY ya está aplicado.")
    console.log("")
    return
  }

  const backupDir = createBackup()

  try {
    writeAdminPage()
    writeRuntimeCard()
    writeCalendarTable()
    writeAdminService()
    writeRuntimeService()
    writeAutoOnlyNotice()
    removeManualControlUsage()
    validateJavaScript()
    validateArchitecture()

    console.log("")
    console.log("✅ AUTO-ONLY HARDENING COMPLETADO")
    console.log("")
    console.log("Producción:")
    console.log("  mode = auto")
    console.log("  manualThemeKey = null")
    console.log("")
    console.log("Admin Theme Center:")
    console.log("  SOLO MONITOREO")
    console.log("")
    console.log("Backup:")
    console.log(`  ${relative(backupDir)}`)
    console.log("")
    console.log("Ahora ejecuta:")
    console.log("  npm run dev -- --host 0.0.0.0")
    console.log("")
  } catch (error) {
    console.error("")
    console.error("❌ ERROR DURANTE AUTO-ONLY HARDENING")
    console.error(error?.stack || error)
    console.error("")
    console.error("Ejecuta:")
    console.error("  node .\\scripts\\rollback-theme-auto-only.cjs")
    console.error("")
    process.exit(1)
  }
}

function validateProject() {
  if (!fs.existsSync(path.join(ROOT, "package.json"))) {
    fail(
      "Ejecuta el script desde C:\\projects\\phoenix-v2."
    )
  }

  const required = [
    ADMIN_PAGE,
    path.join(
      ADMIN_THEME,
      "components",
      "ThemeRuntimeCard.jsx"
    ),
    path.join(
      ADMIN_THEME,
      "components",
      "ThemeCalendarTable.jsx"
    ),
    path.join(
      ADMIN_THEME,
      "services",
      "themeAdminService.js"
    ),
    RUNTIME_SERVICE,
    path.join(
      SRC,
      "shared",
      "theme",
      "themeRuntimeResolver.js"
    ),
    path.join(
      SRC,
      "shared",
      "theme",
      "themeTimeline.js"
    ),
  ]

  for (const file of required) {
    if (!fs.existsSync(file)) {
      fail(`Falta ${relative(file)}`)
    }
  }

  const runtime = read(RUNTIME_SERVICE)

  for (const exportName of [
    "getDefaultThemeRuntimeConfig",
    "fetchThemeRuntimeSnapshot",
    "readCachedThemeRuntimeSnapshot",
    "subscribeThemeRuntimeChanges",
  ]) {
    if (!runtime.includes(exportName)) {
      fail(
        `themeRuntimeService.js no contiene ${exportName}.`
      )
    }
  }

  console.log("✅ Admin Theme Center detectado.")
  console.log("✅ Theme Runtime Service detectado.")
}

function isAlreadyApplied() {
  const marker = path.join(
    ADMIN_THEME,
    "AUTO-ONLY.md"
  )

  if (!fs.existsSync(marker)) {
    return false
  }

  const runtime = read(RUNTIME_SERVICE)

  return (
    runtime.includes(
      'const AUTO_ONLY_MODE = "auto"'
    ) &&
    runtime.includes(
      "manualThemeKey: null"
    )
  )
}

function createBackup() {
  fs.mkdirSync(
    BACKUP_ROOT,
    { recursive: true }
  )

  const backupDir = path.join(
    BACKUP_ROOT,
    `theme-auto-only-${timestamp()}`
  )

  fs.mkdirSync(
    backupDir,
    { recursive: true }
  )

  fs.cpSync(
    ADMIN_THEME,
    path.join(
      backupDir,
      "admin-themes"
    ),
    { recursive: true }
  )

  fs.copyFileSync(
    ADMIN_PAGE,
    path.join(
      backupDir,
      "AdminThemesPage.jsx"
    )
  )

  fs.copyFileSync(
    RUNTIME_SERVICE,
    path.join(
      backupDir,
      "themeRuntimeService.js"
    )
  )

  writeJson(
    path.join(
      backupDir,
      "backup-meta.json"
    ),
    {
      createdAt: new Date().toISOString(),
      root: ROOT,
    }
  )

  console.log(
    `✅ Backup creado: ${relative(backupDir)}`
  )

  return backupDir
}

function writeAdminPage() {
  write(
    ADMIN_PAGE,
`import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import ThemeRuntimeCard from "../themes/components/ThemeRuntimeCard.jsx"
import ThemeCalendarTable from "../themes/components/ThemeCalendarTable.jsx"

import {
  getThemeAdminOverview,
  subscribeThemeAdminChanges,
} from "../themes/services/themeAdminService.js"

import "../themes/adminThemes.css"

export default function AdminThemesPage() {
  const [overview, setOverview] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      if (!quiet) {
        setLoading(true)
      }

      try {
        const next =
          await getThemeAdminOverview()

        setOverview(next)
        setError("")
      } catch (loadError) {
        console.error(loadError)

        setError(
          loadError?.message ||
          "No se pudo cargar el estado del Theme Engine."
        )
      } finally {
        if (!quiet) {
          setLoading(false)
        }
      }
    },
    []
  )

  useEffect(() => {
    load()

    const unsubscribe =
      subscribeThemeAdminChanges(
        () => {
          load({ quiet: true })
        }
      )

    return unsubscribe
  }, [load])

  const calendar =
    useMemo(
      () =>
        overview?.calendarEntries || [],
      [overview]
    )

  return (
    <main className="phx-theme-admin">
      <header className="phx-theme-admin__header">
        <div>
          <p className="phx-theme-admin__eyebrow">
            PHO3NIX V2
          </p>

          <h1>
            Theme Engine
          </h1>

          <p className="phx-theme-admin__subtitle">
            Monitor del calendario automático de PHO3NIX.
          </p>
        </div>

        <button
          type="button"
          className="phx-theme-admin__refresh"
          onClick={() => load()}
          disabled={loading}
        >
          Actualizar
        </button>
      </header>

      <div
        className="phx-theme-admin__alert phx-theme-admin__alert--success"
        role="status"
      >
        El Theme Engine opera automáticamente. No requiere intervención de Admin ni Coach.
      </div>

      {error ? (
        <div
          className="phx-theme-admin__alert phx-theme-admin__alert--error"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {loading && !overview ? (
        <section className="phx-theme-admin__loading">
          Cargando Theme Engine…
        </section>
      ) : (
        <>
          <section className="phx-theme-admin__grid phx-theme-admin__grid--single">
            <ThemeRuntimeCard
              overview={overview}
            />
          </section>

          <ThemeCalendarTable
            entries={calendar}
          />
        </>
      )}
    </main>
  )
}
`
  )

  console.log("✅ AdminThemesPage convertido a solo lectura.")
}

function writeRuntimeCard() {
  const file = path.join(
    ADMIN_THEME,
    "components",
    "ThemeRuntimeCard.jsx"
  )

  write(
    file,
`import {
  getThemeLabel,
} from "../utils/themeAdminLabels.js"

export default function ThemeRuntimeCard({
  overview,
}) {
  const runtime =
    overview?.runtimeConfig || {}

  const current =
    overview?.currentSelection || {}

  const next =
    overview?.nextTransition || null

  return (
    <article className="phx-theme-admin-card">
      <div className="phx-theme-admin-card__heading">
        <span className="phx-theme-status phx-theme-status--auto">
          AUTOMÁTICO
        </span>

        <span className="phx-theme-admin-card__source">
          {overview?.source || "local"}
        </span>
      </div>

      <dl className="phx-theme-admin-stats">
        <div>
          <dt>Theme actual</dt>
          <dd>
            {getThemeLabel(
              current.themeKey
            )}
          </dd>
          <small>
            {current.themeKey || "phoenix"}
          </small>
        </div>

        <div>
          <dt>Próximo theme</dt>
          <dd>
            {next
              ? getThemeLabel(
                  next.toThemeKey
                )
              : "Sin cambio próximo"}
          </dd>

          <small>
            {next?.dateTimeKey || "—"}
          </small>
        </div>

        <div>
          <dt>Zona horaria</dt>
          <dd>
            {runtime.timeZone ||
              "America/Guayaquil"}
          </dd>
        </div>

        <div>
          <dt>Modo de producción</dt>
          <dd>AUTO-ONLY</dd>
          <small>
            Calendario oficial
          </small>
        </div>
      </dl>
    </article>
  )
}
`
  )

  console.log("✅ Runtime Card endurecida a AUTO.")
}

function writeCalendarTable() {
  const file = path.join(
    ADMIN_THEME,
    "components",
    "ThemeCalendarTable.jsx"
  )

  write(
    file,
`import {
  describeThemeRule,
  getThemeLabel,
} from "../utils/themeAdminLabels.js"

export default function ThemeCalendarTable({
  entries,
}) {
  return (
    <section className="phx-theme-calendar">
      <div className="phx-theme-calendar__header">
        <div>
          <p className="phx-theme-admin__eyebrow">
            CALENDARIO MAESTRO
          </p>

          <h2>
            {entries.length} reglas automáticas
          </h2>
        </div>
      </div>

      <div className="phx-theme-calendar__table-wrap">
        <table className="phx-theme-calendar__table">
          <thead>
            <tr>
              <th>Theme</th>
              <th>Activación</th>
              <th>Prioridad</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {entries.map(
              (entry) => (
                <tr key={entry.themeKey}>
                  <td>
                    <strong>
                      {getThemeLabel(
                        entry.themeKey
                      )}
                    </strong>

                    <small>
                      {entry.themeKey}
                    </small>
                  </td>

                  <td>
                    {describeThemeRule(
                      entry.rule
                    )}
                  </td>

                  <td>
                    {entry.priority}
                  </td>

                  <td>
                    <span className="phx-theme-status phx-theme-status--auto">
                      {entry.enabled !== false
                        ? "Programado"
                        : "No disponible"}
                    </span>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
`
  )

  console.log("✅ Calendar Table convertida a solo lectura.")
}

function writeAdminService() {
  const file = path.join(
    ADMIN_THEME,
    "services",
    "themeAdminService.js"
  )

  write(
    file,
`import {
  fetchThemeRuntimeSnapshot,
  getDefaultThemeRuntimeConfig,
  subscribeThemeRuntimeChanges,
} from "../../../../theme/themeRuntimeService.js"

import {
  resolveRuntimeThemeSelection,
} from "../../../../shared/theme/themeRuntimeResolver.js"

import {
  findNextThemeTransition,
} from "../../../../shared/theme/themeTimeline.js"

import {
  THEME_KEYS,
} from "../../../../shared/theme/themeRegistry.js"

import {
  getDateTimeKeyInTimeZone,
} from "../../../../theme/themeCalendar.js"

const DEFAULT_THEME_KEY = "phoenix"

export async function getThemeAdminOverview() {
  const snapshot =
    await fetchThemeRuntimeSnapshot()

  const runtimeConfig = {
    ...getDefaultThemeRuntimeConfig(),
    ...(snapshot?.runtimeConfig || {}),

    // Production authority:
    mode: "auto",
    manualThemeKey: null,
  }

  const calendarEntries =
    snapshot?.calendarEntries || []

  const timeZone =
    runtimeConfig.timeZone ||
    "America/Guayaquil"

  const dateTimeKey =
    getDateTimeKeyInTimeZone(
      new Date(),
      timeZone
    )

  const currentSelection =
    resolveRuntimeThemeSelection({
      dateTimeKey,
      runtimeConfig,
      calendarEntries,
      availableThemeKeys:
        THEME_KEYS,
      defaultThemeKey:
        DEFAULT_THEME_KEY,
    })

  const nextTransition =
    findNextThemeTransition({
      startDate: new Date(),
      timeZone,
      calendarEntries,
      availableThemeKeys:
        THEME_KEYS,
      defaultThemeKey:
        DEFAULT_THEME_KEY,
      toDateTimeKey:
        (date) =>
          getDateTimeKeyInTimeZone(
            date,
            timeZone
          ),
    })

  return {
    ...snapshot,
    runtimeConfig,
    calendarEntries,
    currentSelection,
    nextTransition,
    themeKeys:
      THEME_KEYS,
  }
}

export function subscribeThemeAdminChanges(
  onChange
) {
  return subscribeThemeRuntimeChanges(
    onChange
  )
}
`
  )

  console.log("✅ Theme Admin Service sin escrituras.")
}

function writeRuntimeService() {
  write(
    RUNTIME_SERVICE,
`import {
  readThemeRuntimeSnapshotCache,
  writeThemeRuntimeSnapshotCache,
} from "../platform/web/theme/themeStorage.js"

import {
  fetchThemeRuntimeSnapshotRemote,
  subscribeThemeRuntimeRemote,
} from "../platform/web/theme/themeSync.js"

const DEFAULT_TIME_ZONE =
  "America/Guayaquil"

const AUTO_ONLY_MODE = "auto"

/*
 * PHO3NIX V2 — PRODUCTION AUTO-ONLY
 *
 * The holiday calendar is the production authority.
 * Remote runtime rows may still provide timezone/revision,
 * but a stale manual mode can never force a production theme.
 */

export function getDefaultThemeRuntimeConfig() {
  return {
    mode: AUTO_ONLY_MODE,
    manualThemeKey: null,
    timeZone: DEFAULT_TIME_ZONE,
    revision: 1,
  }
}

export async function fetchThemeRuntimeSnapshot() {
  try {
    const remote =
      await fetchThemeRuntimeSnapshotRemote()

    const snapshot = {
      runtimeConfig:
        mapAutoOnlyRuntimeConfig(
          remote.runtimeRow
        ),

      calendarEntries:
        (remote.calendarRows || [])
          .map(mapCalendarEntry),

      fetchedAt:
        remote.fetchedAt ||
        new Date().toISOString(),

      source: "remote",
    }

    writeThemeRuntimeSnapshotCache(
      snapshot
    )

    return snapshot
  } catch (error) {
    const cached =
      readCachedThemeRuntimeSnapshot()

    if (cached) {
      return cached
    }

    throw error
  }
}

export function readCachedThemeRuntimeSnapshot() {
  const parsed =
    readThemeRuntimeSnapshotCache()

  if (!parsed) return null

  return {
    ...parsed,

    runtimeConfig:
      normalizeAutoOnlyRuntimeConfig(
        parsed.runtimeConfig
      ),

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

function mapAutoOnlyRuntimeConfig(row) {
  return {
    mode: AUTO_ONLY_MODE,

    manualThemeKey:
      null,

    timeZone:
      String(
        row?.timezone ||
        DEFAULT_TIME_ZONE
      ),

    revision:
      Number(
        row?.revision ||
        1
      ),

    updatedAt:
      row?.updated_at ||
      null,
  }
}

function normalizeAutoOnlyRuntimeConfig(
  runtime
) {
  return {
    ...getDefaultThemeRuntimeConfig(),
    ...(runtime || {}),

    mode:
      AUTO_ONLY_MODE,

    manualThemeKey:
      null,

    timeZone:
      String(
        runtime?.timeZone ||
        DEFAULT_TIME_ZONE
      ),
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
  )

  console.log("✅ Runtime Service endurecido: manual remoto ignorado.")
}

function writeAutoOnlyNotice() {
  write(
    path.join(
      ADMIN_THEME,
      "AUTO-ONLY.md"
    ),
`# PHO3NIX V2 — AUTO-ONLY

El Theme Engine de producción opera únicamente en modo automático.

## Autoridad

\`\`\`text
America/Guayaquil
        ↓
Calendario oficial
        ↓
Shared Theme Engine
        ↓
Theme activo
\`\`\`

## Producción

\`\`\`text
mode = auto
manualThemeKey = null
\`\`\`

Un valor remoto antiguo \`mode = manual\` no puede forzar un theme.

## Admin Theme Center

\`/admin/themes\` es un monitor de solo lectura.

No contiene:

- selector manual;
- botones para cambiar theme;
- interruptores para activar/desactivar reglas;
- escrituras a Supabase.

## Preview DEV

Las herramientas de preview de desarrollo continúan siendo locales
y no forman parte del runtime global de producción.

## Fallback

\`\`\`text
phoenix
\`\`\`
`
  )
}

function removeManualControlUsage() {
  const manualControl = path.join(
    ADMIN_THEME,
    "components",
    "ThemeManualControl.jsx"
  )

  if (fs.existsSync(manualControl)) {
    fs.renameSync(
      manualControl,
      path.join(
        ADMIN_THEME,
        "components",
        "ThemeManualControl.UNUSED.jsx"
      )
    )
  }

  console.log("✅ Control manual retirado del módulo activo.")
}

function validateJavaScript() {
  const files = [
    RUNTIME_SERVICE,
    path.join(
      ADMIN_THEME,
      "services",
      "themeAdminService.js"
    ),
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
      fail(
        `Error de sintaxis en ${relative(file)}:\n` +
        String(
          error?.stderr ||
          error?.stdout ||
          error?.message ||
          error
        )
      )
    }
  }

  console.log("✅ Sintaxis JavaScript validada.")
}

function validateArchitecture() {
  const page =
    read(ADMIN_PAGE)

  const adminService =
    read(
      path.join(
        ADMIN_THEME,
        "services",
        "themeAdminService.js"
      )
    )

  const runtime =
    read(RUNTIME_SERVICE)

  const forbiddenPage = [
    "ThemeManualControl",
    "setAutomaticThemeMode",
    "setManualThemeMode",
    "setThemeCalendarEnabled",
    "onEnabledChange",
  ]

  for (const term of forbiddenPage) {
    if (page.includes(term)) {
      fail(
        `AdminThemesPage todavía contiene control de escritura: ${term}`
      )
    }
  }

  const forbiddenService = [
    "updateThemeRuntimeModeRemote",
    "updateThemeCalendarEnabledRemote",
    "setManualThemeMode",
    "setAutomaticThemeMode",
  ]

  for (const term of forbiddenService) {
    if (adminService.includes(term)) {
      fail(
        `themeAdminService todavía contiene escritura: ${term}`
      )
    }
  }

  if (
    !runtime.includes(
      'const AUTO_ONLY_MODE = "auto"'
    ) ||
    !runtime.includes(
      "manualThemeKey:\n      null"
    )
  ) {
    fail(
      "themeRuntimeService no quedó bloqueado en AUTO-ONLY."
    )
  }

  console.log("✅ AUTO-ONLY validado.")
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
    content.replace(
      /\r\n/g,
      "\n"
    ),
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
    path.relative(
      ROOT,
      file
    ) || "."
  )
}

function timestamp() {
  const date = new Date()

  const pad = (value) =>
    String(value).padStart(2, "0")

  return (
    `${date.getFullYear()}` +
    `${pad(date.getMonth() + 1)}` +
    `${pad(date.getDate())}-` +
    `${pad(date.getHours())}` +
    `${pad(date.getMinutes())}` +
    `${pad(date.getSeconds())}`
  )
}

function fail(message) {
  throw new Error(message)
}
