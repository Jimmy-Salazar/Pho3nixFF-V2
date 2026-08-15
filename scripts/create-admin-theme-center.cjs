const fs = require("fs")
const path = require("path")
const { execFileSync } = require("child_process")

const ROOT = process.cwd()
const SRC = path.join(ROOT, "src")

const SHARED_THEME = path.join(
  SRC,
  "shared",
  "theme"
)

const PLATFORM_WEB_THEME = path.join(
  SRC,
  "platform",
  "web",
  "theme"
)

const ADMIN_THEME_MODULE = path.join(
  SRC,
  "modules",
  "admin",
  "themes"
)

const ADMIN_PAGES = path.join(
  SRC,
  "modules",
  "admin",
  "pages"
)

const ADMIN_PAGE = path.join(
  ADMIN_PAGES,
  "AdminThemesPage.jsx"
)

const BACKUP_ROOT = path.join(
  ROOT,
  ".pho3nix-backups"
)

main()

function main() {
  console.log("")
  console.log("PHO3NIX V2 — ADMIN THEME CENTER")
  console.log("================================")
  console.log("")

  validateProject()

  if (isAlreadyInstalled()) {
    console.log("✅ Admin Theme Center ya existe.")
    console.log("")
    console.log("No se realizó ningún cambio.")
    console.log("")
    return
  }

  const routerCandidate =
    findRouterCandidate()

  const backupDir =
    createBackup(routerCandidate)

  try {
    createModule()
    createAdminSyncAdapter()
    createSharedTimelineHelper()

    const routeResult =
      patchRouter(routerCandidate)

    writeManifest({
      backupDir,
      routeResult,
    })

    validateGeneratedJavaScript()
    validateGeneratedFiles()

    console.log("")
    console.log("✅ ADMIN THEME CENTER CREADO")
    console.log("")
    console.log("Página:")
    console.log(
      "  src/modules/admin/pages/AdminThemesPage.jsx"
    )
    console.log("")
    console.log("Módulo:")
    console.log(
      "  src/modules/admin/themes/"
    )
    console.log("")

    if (routeResult.patched) {
      console.log("✅ Ruta agregada automáticamente:")
      console.log("  /admin/themes")
    } else {
      console.log("⚠️ No modifiqué el router automáticamente.")
      console.log(
        "   Revisa src/modules/admin/themes/INTEGRACION-RUTA.md"
      )
    }

    console.log("")
    console.log("Backup:")
    console.log(
      `  ${relative(backupDir)}`
    )
    console.log("")
    console.log("Ahora ejecuta:")
    console.log(
      "  npm run dev -- --host 0.0.0.0"
    )
    console.log("")
  } catch (error) {
    console.error("")
    console.error(
      "❌ ERROR CREANDO ADMIN THEME CENTER"
    )
    console.error(
      error?.stack || error
    )
    console.error("")
    console.error("Ejecuta:")
    console.error(
      "  node scripts/rollback-admin-theme-center.cjs"
    )
    console.error("")
    process.exitCode = 1
  }
}

function validateProject() {
  if (
    !fs.existsSync(
      path.join(ROOT, "package.json")
    )
  ) {
    fail(
      "Ejecuta el script desde la raíz de phoenix-v2."
    )
  }

  const required = [
    path.join(
      SHARED_THEME,
      "themeRuntimeResolver.js"
    ),
    path.join(
      SHARED_THEME,
      "themeScheduleResolver.js"
    ),
    path.join(
      SHARED_THEME,
      "themeRegistry.js"
    ),
    path.join(
      PLATFORM_WEB_THEME,
      "themeStorage.js"
    ),
    path.join(
      PLATFORM_WEB_THEME,
      "themeSync.js"
    ),
    path.join(
      SRC,
      "theme",
      "themeRuntimeService.js"
    ),
  ]

  for (const file of required) {
    if (!fs.existsSync(file)) {
      fail(
        `Falta ${relative(file)}. ` +
        "Completa primero las Fases 1 y 2."
      )
    }
  }

  if (!fs.existsSync(ADMIN_PAGES)) {
    fail(
      "No existe src/modules/admin/pages/. " +
      "No parece ser la estructura esperada de PHO3NIX V2."
    )
  }

  console.log("✅ Shared Theme Engine detectado.")
  console.log("✅ Platform Adapters detectados.")
  console.log("✅ Módulo Admin detectado.")
}

function isAlreadyInstalled() {
  return (
    fs.existsSync(ADMIN_PAGE) &&
    fs.existsSync(
      path.join(
        ADMIN_THEME_MODULE,
        "services",
        "themeAdminService.js"
      )
    )
  )
}

function createBackup(routerCandidate) {
  fs.mkdirSync(
    BACKUP_ROOT,
    { recursive: true }
  )

  const backupDir = path.join(
    BACKUP_ROOT,
    `admin-theme-center-${timestamp()}`
  )

  fs.mkdirSync(
    backupDir,
    { recursive: true }
  )

  const targets = [
    {
      source: path.join(
        SRC,
        "modules",
        "admin"
      ),
      destination: path.join(
        backupDir,
        "admin"
      ),
    },
    {
      source: PLATFORM_WEB_THEME,
      destination: path.join(
        backupDir,
        "platform-web-theme"
      ),
    },
    {
      source: SHARED_THEME,
      destination: path.join(
        backupDir,
        "shared-theme"
      ),
    },
  ]

  for (const target of targets) {
    if (
      fs.existsSync(target.source)
    ) {
      fs.cpSync(
        target.source,
        target.destination,
        { recursive: true }
      )
    }
  }

  if (
    routerCandidate?.file &&
    fs.existsSync(routerCandidate.file)
  ) {
    fs.copyFileSync(
      routerCandidate.file,
      path.join(
        backupDir,
        "router-original" +
        path.extname(
          routerCandidate.file
        )
      )
    )
  }

  writeJson(
    path.join(
      backupDir,
      "backup-meta.json"
    ),
    {
      createdAt:
        new Date().toISOString(),

      root: ROOT,

      routerFile:
        routerCandidate?.file
          ? relative(
              routerCandidate.file
            )
          : null,

      adminThemeModuleExisted:
        fs.existsSync(
          ADMIN_THEME_MODULE
        ),

      adminPageExisted:
        fs.existsSync(
          ADMIN_PAGE
        ),
    }
  )

  console.log(
    `✅ Backup creado: ${relative(backupDir)}`
  )

  return backupDir
}

function createModule() {
  const componentsDir = path.join(
    ADMIN_THEME_MODULE,
    "components"
  )

  const servicesDir = path.join(
    ADMIN_THEME_MODULE,
    "services"
  )

  const utilsDir = path.join(
    ADMIN_THEME_MODULE,
    "utils"
  )

  fs.mkdirSync(
    componentsDir,
    { recursive: true }
  )

  fs.mkdirSync(
    servicesDir,
    { recursive: true }
  )

  fs.mkdirSync(
    utilsDir,
    { recursive: true }
  )

  write(
    ADMIN_PAGE,
    buildAdminPage()
  )

  write(
    path.join(
      servicesDir,
      "themeAdminService.js"
    ),
    buildAdminService()
  )

  write(
    path.join(
      utilsDir,
      "themeAdminLabels.js"
    ),
    buildLabels()
  )

  write(
    path.join(
      componentsDir,
      "ThemeRuntimeCard.jsx"
    ),
    buildRuntimeCard()
  )

  write(
    path.join(
      componentsDir,
      "ThemeManualControl.jsx"
    ),
    buildManualControl()
  )

  write(
    path.join(
      componentsDir,
      "ThemeCalendarTable.jsx"
    ),
    buildCalendarTable()
  )

  write(
    path.join(
      ADMIN_THEME_MODULE,
      "adminThemes.css"
    ),
    buildCss()
  )

  write(
    path.join(
      ADMIN_THEME_MODULE,
      "INTEGRACION-RUTA.md"
    ),
    buildRouteInstructions()
  )

  console.log("✅ Módulo Admin Themes creado.")
}

function createAdminSyncAdapter() {
  const file = path.join(
    PLATFORM_WEB_THEME,
    "themeAdminSync.js"
  )

  write(
    file,
    buildAdminSync()
  )

  const indexFile = path.join(
    PLATFORM_WEB_THEME,
    "index.js"
  )

  if (fs.existsSync(indexFile)) {
    let content = read(indexFile)

    if (
      !content.includes(
        'export * from "./themeAdminSync.js"'
      )
    ) {
      content =
        content.trimEnd() +
        '\nexport * from "./themeAdminSync.js"\n'

      write(
        indexFile,
        content
      )
    }
  }

  console.log(
    "✅ Adapter Admin Supabase creado."
  )
}

function createSharedTimelineHelper() {
  const timelineFile = path.join(
    SHARED_THEME,
    "themeTimeline.js"
  )

  if (!fs.existsSync(timelineFile)) {
    write(
      timelineFile,
      buildTimelineHelper()
    )
  }

  const indexFile = path.join(
    SHARED_THEME,
    "index.js"
  )

  if (fs.existsSync(indexFile)) {
    let content = read(indexFile)

    if (
      !content.includes(
        'export * from "./themeTimeline.js"'
      )
    ) {
      content =
        content.trimEnd() +
        '\nexport * from "./themeTimeline.js"\n'

      write(
        indexFile,
        content
      )
    }
  }

  console.log(
    "✅ Timeline helper compartido creado."
  )
}

function findRouterCandidate() {
  const files = walk(SRC)
    .filter(
      (file) =>
        /\.(jsx|js)$/.test(file)
    )

  const candidates = []

  for (const file of files) {
    const source = safeRead(file)

    if (!source) continue

    const hasRoute =
      source.includes("<Route")

    const hasDashboardRoute =
      /path\s*=\s*["']\/admin\/dashboard["']/.test(
        source
      )

    const hasDashboardPage =
      source.includes(
        "AdminDashboardPage"
      )

    if (
      hasRoute &&
      hasDashboardRoute &&
      hasDashboardPage
    ) {
      candidates.push(file)
    }
  }

  if (candidates.length === 1) {
    console.log(
      `✅ Router candidato: ${relative(candidates[0])}`
    )

    return {
      file: candidates[0],
    }
  }

  if (candidates.length > 1) {
    console.log(
      "⚠️ Encontré más de un router candidato. " +
      "No modificaré ninguno automáticamente."
    )
  } else {
    console.log(
      "⚠️ No encontré una ruta exacta /admin/dashboard."
    )
  }

  return null
}

function patchRouter(candidate) {
  if (!candidate?.file) {
    return {
      patched: false,
      reason:
        "No exact router candidate.",
    }
  }

  const file = candidate.file
  let source = read(file)

  if (
    /path\s*=\s*["']\/admin\/themes["']/.test(
      source
    )
  ) {
    return {
      patched: true,
      file: relative(file),
      alreadyPresent: true,
    }
  }

  const importPath =
    relativeImportPath(
      file,
      ADMIN_PAGE
    )

  const importLine =
    `import AdminThemesPage from "${importPath}"`

  if (
    !source.includes(
      "AdminThemesPage"
    )
  ) {
    const importMatches =
      [...source.matchAll(
        /^import .*$/gm
      )]

    if (!importMatches.length) {
      return {
        patched: false,
        reason:
          "No import section found.",
      }
    }

    const last =
      importMatches[
        importMatches.length - 1
      ]

    const insertAt =
      last.index +
      last[0].length

    source =
      source.slice(0, insertAt) +
      "\n" +
      importLine +
      source.slice(insertAt)
  }

  const routeRegex =
    /<Route\b[\s\S]{0,700}?path\s*=\s*["']\/admin\/dashboard["'][\s\S]{0,700}?\/>/

  const match =
    source.match(routeRegex)

  if (!match) {
    return {
      patched: false,
      reason:
        "Dashboard route is not self-closing or is too complex.",
    }
  }

  const newRoute =
    '\n          <Route path="/admin/themes" element={<AdminThemesPage />} />'

  source =
    source.replace(
      match[0],
      match[0] + newRoute
    )

  write(
    file,
    source
  )

  return {
    patched: true,
    file: relative(file),
  }
}

function buildAdminPage() {
  return `import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import ThemeRuntimeCard from "../themes/components/ThemeRuntimeCard.jsx"
import ThemeManualControl from "../themes/components/ThemeManualControl.jsx"
import ThemeCalendarTable from "../themes/components/ThemeCalendarTable.jsx"

import {
  getThemeAdminOverview,
  setAutomaticThemeMode,
  setManualThemeMode,
  setThemeCalendarEnabled,
  subscribeThemeAdminChanges,
} from "../themes/services/themeAdminService.js"

import "../themes/adminThemes.css"

export default function AdminThemesPage() {
  const [overview, setOverview] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState("")

  const [message, setMessage] =
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
          "No se pudo cargar la configuración de themes."
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

  const runtime =
    overview?.runtimeConfig || null

  const calendar =
    useMemo(
      () =>
        overview?.calendarEntries || [],
      [overview]
    )

  async function performSave(action) {
    setSaving(true)
    setError("")
    setMessage("")

    try {
      await action()
      await load({ quiet: true })

      setMessage(
        "Configuración publicada correctamente."
      )
    } catch (saveError) {
      console.error(saveError)

      setError(
        formatAdminWriteError(
          saveError
        )
      )
    } finally {
      setSaving(false)
    }
  }

  function handleAuto() {
    return performSave(
      () =>
        setAutomaticThemeMode({
          revision:
            runtime?.revision,
        })
    )
  }

  function handleManual(themeKey) {
    return performSave(
      () =>
        setManualThemeMode({
          themeKey,
          revision:
            runtime?.revision,
        })
    )
  }

  function handleCalendarEnabled(
    themeKey,
    enabled
  ) {
    return performSave(
      () =>
        setThemeCalendarEnabled({
          themeKey,
          enabled,
        })
    )
  }

  return (
    <main className="phx-theme-admin">
      <header className="phx-theme-admin__header">
        <div>
          <p className="phx-theme-admin__eyebrow">
            PHO3NIX V2
          </p>

          <h1>
            Administrador de Themes
          </h1>

          <p className="phx-theme-admin__subtitle">
            Calendario, modo automático y publicación global Web/App.
          </p>
        </div>

        <button
          type="button"
          className="phx-theme-admin__refresh"
          onClick={() => load()}
          disabled={loading || saving}
        >
          Actualizar
        </button>
      </header>

      {error ? (
        <div
          className="phx-theme-admin__alert phx-theme-admin__alert--error"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {message ? (
        <div
          className="phx-theme-admin__alert phx-theme-admin__alert--success"
          role="status"
        >
          {message}
        </div>
      ) : null}

      {loading && !overview ? (
        <section className="phx-theme-admin__loading">
          Cargando Theme Engine…
        </section>
      ) : (
        <>
          <section className="phx-theme-admin__grid">
            <ThemeRuntimeCard
              overview={overview}
            />

            <ThemeManualControl
              runtimeConfig={runtime}
              themeKeys={
                overview?.themeKeys || []
              }
              saving={saving}
              onAutomatic={handleAuto}
              onManual={handleManual}
            />
          </section>

          <ThemeCalendarTable
            entries={calendar}
            saving={saving}
            onEnabledChange={
              handleCalendarEnabled
            }
          />
        </>
      )}
    </main>
  )
}

function formatAdminWriteError(error) {
  const message =
    String(
      error?.message ||
      ""
    )

  const code =
    String(
      error?.code ||
      ""
    )

  if (
    code === "42501" ||
    /row-level security/i.test(message) ||
    /permission denied/i.test(message)
  ) {
    return (
      "Supabase bloqueó la escritura por RLS. " +
      "El panel está instalado correctamente; " +
      "falta autorizar estas operaciones exclusivamente al rol Administrador."
    )
  }

  return (
    message ||
    "No se pudo publicar el cambio."
  )
}
`
}

function buildRuntimeCard() {
  return `import {
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
        <span
          className={
            runtime.mode === "manual"
              ? "phx-theme-status phx-theme-status--manual"
              : "phx-theme-status phx-theme-status--auto"
          }
        >
          {runtime.mode === "manual"
            ? "MANUAL"
            : "AUTO"}
        </span>

        <span className="phx-theme-admin-card__source">
          {overview?.source || "—"}
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
          <dt>Próximo cambio AUTO</dt>
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
          <dt>Revisión</dt>
          <dd>
            {runtime.revision || 1}
          </dd>
        </div>
      </dl>
    </article>
  )
}
`
}

function buildManualControl() {
  return `import {
  getThemeLabel,
} from "../utils/themeAdminLabels.js"

export default function ThemeManualControl({
  runtimeConfig,
  themeKeys,
  saving,
  onAutomatic,
  onManual,
}) {
  const manualKey =
    runtimeConfig?.manualThemeKey ||
    "phoenix"

  return (
    <article className="phx-theme-admin-card">
      <h2>Control global</h2>

      <p className="phx-theme-admin-card__text">
        AUTO usa el calendario. MANUAL fuerza el mismo theme en todos los clientes sincronizados.
      </p>

      <div className="phx-theme-mode-buttons">
        <button
          type="button"
          className={
            runtimeConfig?.mode !== "manual"
              ? "is-active"
              : ""
          }
          disabled={saving}
          onClick={onAutomatic}
        >
          Automático
        </button>

        <select
          aria-label="Theme manual"
          defaultValue={manualKey}
          disabled={saving}
          onChange={(event) => {
            const key =
              event.target.value

            if (key) {
              onManual(key)
            }
          }}
        >
          {themeKeys.map(
            (themeKey) => (
              <option
                key={themeKey}
                value={themeKey}
              >
                {getThemeLabel(
                  themeKey
                )}
              </option>
            )
          )}
        </select>
      </div>

      <p className="phx-theme-admin-card__hint">
        El preview DEV de una PC continúa siendo local; este control publica el estado global.
      </p>
    </article>
  )
}
`
}

function buildCalendarTable() {
  return `import {
  describeThemeRule,
  getThemeLabel,
} from "../utils/themeAdminLabels.js"

export default function ThemeCalendarTable({
  entries,
  saving,
  onEnabledChange,
}) {
  return (
    <section className="phx-theme-calendar">
      <div className="phx-theme-calendar__header">
        <div>
          <p className="phx-theme-admin__eyebrow">
            CALENDARIO MAESTRO
          </p>

          <h2>
            {entries.length} reglas sincronizadas
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
                    <label className="phx-theme-toggle">
                      <input
                        type="checkbox"
                        checked={
                          entry.enabled !== false
                        }
                        disabled={saving}
                        onChange={(event) =>
                          onEnabledChange(
                            entry.themeKey,
                            event.target.checked
                          )
                        }
                      />

                      <span>
                        {entry.enabled !== false
                          ? "Activo"
                          : "Inactivo"}
                      </span>
                    </label>
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
}

function buildAdminService() {
  return `import {
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

import {
  updateThemeCalendarEnabledRemote,
  updateThemeRuntimeModeRemote,
} from "../../../../platform/web/theme/themeAdminSync.js"

const DEFAULT_THEME_KEY = "phoenix"

export async function getThemeAdminOverview() {
  const snapshot =
    await fetchThemeRuntimeSnapshot()

  const runtimeConfig = {
    ...getDefaultThemeRuntimeConfig(),
    ...(snapshot?.runtimeConfig || {}),
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
    themeKeys: THEME_KEYS,
  }
}

export function subscribeThemeAdminChanges(
  onChange
) {
  return subscribeThemeRuntimeChanges(
    onChange
  )
}

export async function setAutomaticThemeMode({
  revision,
} = {}) {
  return updateThemeRuntimeModeRemote({
    mode: "auto",
    manualThemeKey: null,
    revision,
  })
}

export async function setManualThemeMode({
  themeKey,
  revision,
} = {}) {
  return updateThemeRuntimeModeRemote({
    mode: "manual",
    manualThemeKey: themeKey,
    revision,
  })
}

export async function setThemeCalendarEnabled({
  themeKey,
  enabled,
} = {}) {
  return updateThemeCalendarEnabledRemote({
    themeKey,
    enabled,
  })
}
`
}

function buildLabels() {
  return `const THEME_LABELS = {
  phoenix: "PHOENIX",
  new_year: "Año Nuevo",
  valentines_day: "San Valentín",
  carnival: "Carnaval",
  international_womens_day:
    "Día Internacional de la Mujer",
  good_friday: "Viernes Santo",
  labor_day: "Día del Trabajo",
  mothers_day: "Día de la Madre",
  battle_of_pichincha:
    "Batalla de Pichincha",
  childrens_day: "Día del Niño",
  fathers_day: "Día del Padre",
  guayaquil_foundation:
    "Fundación de Guayaquil",
  first_cry_of_independence:
    "Primer Grito de Independencia",
  flag_day: "Día de la Bandera",
  guayaquil_independence:
    "Independencia de Guayaquil",
  halloween: "Halloween",
  all_souls_day:
    "Día de los Difuntos",
  cuenca_independence:
    "Independencia de Cuenca",
  quito_foundation:
    "Fundación de Quito",
  christmas: "Navidad",
  year_end: "Fin de Año",
}

export function getThemeLabel(
  themeKey
) {
  const key =
    String(
      themeKey || ""
    )
      .trim()
      .toLowerCase()

  return (
    THEME_LABELS[key] ||
    key ||
    "PHOENIX"
  )
}

export function describeThemeRule(
  rule
) {
  if (!rule) return "—"

  if (
    rule.type ===
    "annual_datetime_range"
  ) {
    return (
      \`\${pad(rule.startDay)}/\${pad(rule.startMonth)} \` +
      \`\${pad(rule.startHour)}:\${pad(rule.startMinute)} → \` +
      \`\${pad(rule.endDay)}/\${pad(rule.endMonth)} \` +
      \`\${pad(rule.endHour)}:\${pad(rule.endMinute)}\`
    )
  }

  if (
    rule.type === "annual_date"
  ) {
    return (
      \`\${pad(rule.day)}/\${pad(rule.month)} \` +
      "00:00 → 23:59"
    )
  }

  if (
    rule.type === "annual_range"
  ) {
    return (
      \`\${pad(rule.startDay)}/\${pad(rule.startMonth)} 00:00 → \` +
      \`\${pad(rule.endDay)}/\${pad(rule.endMonth)} 23:59\`
    )
  }

  if (
    rule.type ===
    "easter_offset_range"
  ) {
    return (
      \`Pascua \${signed(rule.startOffsetDays)} días → \` +
      \`Pascua \${signed(rule.endOffsetDays)} días\`
    )
  }

  if (
    rule.type ===
    "easter_offset"
  ) {
    return (
      \`Pascua \${signed(rule.offsetDays)} días\`
    )
  }

  if (
    rule.type ===
    "nth_weekday_of_month"
  ) {
    return (
      \`\${ordinal(rule.occurrence)} domingo de \` +
      monthName(rule.month) +
      " 00:00 → 23:59"
    )
  }

  return rule.type || "Regla"
}

function pad(value) {
  return String(
    Number(value || 0)
  ).padStart(2, "0")
}

function signed(value) {
  const number =
    Number(value || 0)

  return number >= 0
    ? \`+\${number}\`
    : String(number)
}

function ordinal(value) {
  const number =
    Number(value || 1)

  if (number === 2) return "2.º"
  if (number === 3) return "3.er"

  return \`\${number}.º\`
}

function monthName(value) {
  const months = [
    "",
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ]

  return (
    months[
      Number(value || 0)
    ] || "mes"
  )
}
`
}

function buildAdminSync() {
  return `import {
  supabase,
} from "../../../config/supabase.js"

/*
 * Admin-only write transport.
 *
 * Supabase RLS remains the authority.
 * This file does NOT bypass security.
 */

export async function updateThemeRuntimeModeRemote({
  mode,
  manualThemeKey = null,
  revision = 1,
} = {}) {
  requireSupabase()

  const safeMode =
    mode === "manual"
      ? "manual"
      : "auto"

  const safeThemeKey =
    safeMode === "manual"
      ? normalizeThemeKey(
          manualThemeKey
        )
      : null

  const nextRevision =
    Number(revision || 0) + 1

  const {
    data,
    error,
  } = await supabase
    .from("app_theme_runtime")
    .update({
      mode: safeMode,
      manual_theme_key:
        safeThemeKey,
      revision:
        nextRevision,
      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "config_key",
      "global"
    )
    .select(
      "config_key, mode, manual_theme_key, timezone, revision, updated_at"
    )
    .single()

  if (error) throw error

  return data
}

export async function updateThemeCalendarEnabledRemote({
  themeKey,
  enabled,
} = {}) {
  requireSupabase()

  const key =
    normalizeThemeKey(themeKey)

  if (!key) {
    throw new Error(
      "themeKey es requerido."
    )
  }

  const {
    data,
    error,
  } = await supabase
    .from("app_theme_calendar")
    .update({
      enabled:
        Boolean(enabled),
      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "theme_key",
      key
    )
    .select(
      "theme_key, enabled, priority, rule, updated_at"
    )
    .single()

  if (error) throw error

  return data
}

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase no está disponible."
    )
  }
}

function normalizeThemeKey(value) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase()
}
`
}

function buildTimelineHelper() {
  return `import {
  resolveScheduleEntry,
} from "./themeScheduleResolver.js"

/*
 * Pure timeline helper.
 *
 * No React, DOM, browser storage or Supabase.
 * Safe for future Web / Android / iOS reuse.
 */

export function findNextThemeTransition({
  startDate = new Date(),
  timeZone = "America/Guayaquil",
  calendarEntries = [],
  availableThemeKeys = [],
  defaultThemeKey = "phoenix",
  toDateTimeKey,
  searchHours = 24 * 370,
} = {}) {
  if (
    typeof toDateTimeKey !==
    "function"
  ) {
    return null
  }

  const allowed =
    new Set(
      Array.from(
        availableThemeKeys || []
      )
        .map(normalizeThemeKey)
        .filter(Boolean)
    )

  allowed.add(
    normalizeThemeKey(
      defaultThemeKey
    )
  )

  const initialKey =
    resolveThemeKey({
      dateTimeKey:
        toDateTimeKey(
          startDate,
          timeZone
        ),
      calendarEntries,
      allowedThemeKeys:
        allowed,
      defaultThemeKey,
    })

  for (
    let hour = 1;
    hour <= searchHours;
    hour += 1
  ) {
    const date =
      new Date(
        startDate.getTime() +
        hour * 60 * 60 * 1000
      )

    const dateTimeKey =
      toDateTimeKey(
        date,
        timeZone
      )

    const key =
      resolveThemeKey({
        dateTimeKey,
        calendarEntries,
        allowedThemeKeys:
          allowed,
        defaultThemeKey,
      })

    if (key !== initialKey) {
      return {
        dateTimeKey,
        fromThemeKey:
          initialKey,
        toThemeKey:
          key,
        hoursFromStart:
          hour,
      }
    }
  }

  return null
}

function resolveThemeKey({
  dateTimeKey,
  calendarEntries,
  allowedThemeKeys,
  defaultThemeKey,
}) {
  const entry =
    resolveScheduleEntry({
      dateTimeKey,
      calendarEntries,
      allowedThemeKeys,
    })

  return (
    normalizeThemeKey(
      entry?.themeKey
    ) ||
    normalizeThemeKey(
      defaultThemeKey
    )
  )
}

function normalizeThemeKey(value) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase()
}
`
}

function buildCss() {
  return `.phx-theme-admin {
  min-height: 100%;
  padding: 28px;
  color: var(--phx-color-text, #fff);
}

.phx-theme-admin__header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
  margin-bottom: 24px;
}

.phx-theme-admin__eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .14em;
  color: var(--phx-color-primary, #f97316);
}

.phx-theme-admin h1,
.phx-theme-admin h2 {
  margin: 0;
}

.phx-theme-admin h1 {
  font-size: clamp(28px, 4vw, 44px);
}

.phx-theme-admin__subtitle,
.phx-theme-admin-card__text,
.phx-theme-admin-card__hint {
  color: var(--phx-color-text-muted, rgba(255,255,255,.64));
}

.phx-theme-admin__refresh,
.phx-theme-mode-buttons button,
.phx-theme-mode-buttons select {
  min-height: 44px;
  border-radius: 14px;
  border: 1px solid var(--phx-color-border, rgba(249,115,22,.22));
  background: var(--phx-color-surface-soft, #14141a);
  color: var(--phx-color-text, #fff);
  padding: 0 16px;
}

.phx-theme-admin__refresh,
.phx-theme-mode-buttons button {
  cursor: pointer;
}

.phx-theme-mode-buttons button.is-active {
  background: var(--phx-color-primary, #f97316);
  color: #fff;
}

.phx-theme-admin__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(280px, .75fr);
  gap: 18px;
}

.phx-theme-admin-card,
.phx-theme-calendar {
  border: 1px solid var(--phx-color-border, rgba(249,115,22,.22));
  background: color-mix(
    in srgb,
    var(--phx-color-surface, #0b0b0f) 94%,
    transparent
  );
  border-radius: 22px;
}

.phx-theme-admin-card {
  padding: 20px;
}

.phx-theme-admin-card__heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 18px;
}

.phx-theme-status {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
}

.phx-theme-status--auto {
  background: color-mix(in srgb, var(--phx-color-primary, #f97316) 18%, transparent);
  color: var(--phx-color-primary, #f97316);
}

.phx-theme-status--manual {
  background: rgba(239, 68, 68, .16);
  color: #fca5a5;
}

.phx-theme-admin-card__source {
  font-size: 12px;
  color: var(--phx-color-text-muted, rgba(255,255,255,.64));
}

.phx-theme-admin-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.phx-theme-admin-stats > div {
  padding: 14px;
  border-radius: 16px;
  background: var(--phx-color-surface-soft, #14141a);
}

.phx-theme-admin-stats dt {
  font-size: 12px;
  color: var(--phx-color-text-muted, rgba(255,255,255,.64));
}

.phx-theme-admin-stats dd {
  margin: 6px 0 2px;
  font-size: 17px;
  font-weight: 800;
}

.phx-theme-admin-stats small {
  color: var(--phx-color-text-muted, rgba(255,255,255,.64));
}

.phx-theme-mode-buttons {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-top: 18px;
}

.phx-theme-calendar {
  margin-top: 18px;
  overflow: hidden;
}

.phx-theme-calendar__header {
  padding: 20px;
}

.phx-theme-calendar__table-wrap {
  overflow-x: auto;
}

.phx-theme-calendar__table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}

.phx-theme-calendar__table th,
.phx-theme-calendar__table td {
  padding: 14px 20px;
  text-align: left;
  border-top: 1px solid var(--phx-color-border, rgba(249,115,22,.16));
}

.phx-theme-calendar__table th {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--phx-color-text-muted, rgba(255,255,255,.64));
}

.phx-theme-calendar__table td strong,
.phx-theme-calendar__table td small {
  display: block;
}

.phx-theme-calendar__table td small {
  margin-top: 4px;
  color: var(--phx-color-text-muted, rgba(255,255,255,.54));
}

.phx-theme-toggle {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.phx-theme-admin__alert {
  margin-bottom: 18px;
  padding: 13px 16px;
  border-radius: 14px;
}

.phx-theme-admin__alert--error {
  background: rgba(239,68,68,.12);
  border: 1px solid rgba(239,68,68,.32);
}

.phx-theme-admin__alert--success {
  background: rgba(34,197,94,.12);
  border: 1px solid rgba(34,197,94,.28);
}

.phx-theme-admin__loading {
  padding: 40px 20px;
  text-align: center;
}

@media (max-width: 860px) {
  .phx-theme-admin {
    padding: 18px 14px 96px;
  }

  .phx-theme-admin__header {
    flex-direction: column;
  }

  .phx-theme-admin__grid {
    grid-template-columns: 1fr;
  }

  .phx-theme-admin-stats {
    grid-template-columns: 1fr;
  }

  .phx-theme-admin__refresh {
    width: 100%;
  }
}
`
}

function buildRouteInstructions() {
  return `# Integración de ruta

El script intenta agregar automáticamente:

\`\`\`jsx
<Route
  path="/admin/themes"
  element={<AdminThemesPage />}
/>
\`\`\`

Si no pudo hacerlo, agrega manualmente al router:

\`\`\`jsx
import AdminThemesPage from "<ruta>/modules/admin/pages/AdminThemesPage.jsx"
\`\`\`

y dentro de \`<Routes>\`:

\`\`\`jsx
<Route
  path="/admin/themes"
  element={<AdminThemesPage />}
/>
\`\`\`

La página creada es:

\`\`\`text
src/modules/admin/pages/AdminThemesPage.jsx
\`\`\`

No agregues esta ruta al acceso público.
Debe permanecer bajo la protección Admin que ya utiliza PHO3NIX.
`
}

function buildManifestText(data) {
  return JSON.stringify(
    data,
    null,
    2
  ) + "\n"
}

function writeManifest({
  backupDir,
  routeResult,
}) {
  write(
    path.join(
      ADMIN_THEME_MODULE,
      "admin-theme-center-manifest.json"
    ),
    buildManifestText({
      phase:
        "PHO3NIX V2 Admin Theme Center",

      completedAt:
        new Date().toISOString(),

      backup:
        relative(backupDir),

      route:
        routeResult,

      page:
        "src/modules/admin/pages/AdminThemesPage.jsx",

      module:
        "src/modules/admin/themes",

      adminSync:
        "src/platform/web/theme/themeAdminSync.js",

      sharedTimeline:
        "src/shared/theme/themeTimeline.js",

      fallback:
        "phoenix",

      timezone:
        "America/Guayaquil",

      security:
        "Supabase RLS remains authoritative; no insecure write policy was created.",
    })
  )
}

function validateGeneratedJavaScript() {
  const files = [
    path.join(
      PLATFORM_WEB_THEME,
      "themeAdminSync.js"
    ),
    path.join(
      SHARED_THEME,
      "themeTimeline.js"
    ),
    path.join(
      ADMIN_THEME_MODULE,
      "services",
      "themeAdminService.js"
    ),
    path.join(
      ADMIN_THEME_MODULE,
      "utils",
      "themeAdminLabels.js"
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

  console.log(
    "✅ Sintaxis JavaScript validada."
  )
}

function validateGeneratedFiles() {
  const required = [
    ADMIN_PAGE,
    path.join(
      ADMIN_THEME_MODULE,
      "adminThemes.css"
    ),
    path.join(
      ADMIN_THEME_MODULE,
      "services",
      "themeAdminService.js"
    ),
    path.join(
      PLATFORM_WEB_THEME,
      "themeAdminSync.js"
    ),
    path.join(
      SHARED_THEME,
      "themeTimeline.js"
    ),
  ]

  for (const file of required) {
    if (!fs.existsSync(file)) {
      fail(
        `No se creó ${relative(file)}`
      )
    }
  }

  const timeline =
    read(
      path.join(
        SHARED_THEME,
        "themeTimeline.js"
      )
    )

  for (const forbidden of [
    "window.",
    "document.",
    "localStorage",
    "supabase",
  ]) {
    if (
      timeline.includes(
        forbidden
      )
    ) {
      fail(
        "themeTimeline.js debe permanecer puro. " +
        `Encontrado: ${forbidden}`
      )
    }
  }

  console.log(
    "✅ Arquitectura del módulo validada."
  )
}

function relativeImportPath(
  fromFile,
  targetFile
) {
  let value =
    path.relative(
      path.dirname(fromFile),
      targetFile
    )
      .replace(/\\/g, "/")

  if (!value.startsWith(".")) {
    value = "./" + value
  }

  return value
}

function walk(directory) {
  if (!fs.existsSync(directory)) {
    return []
  }

  const output = []

  for (
    const entry of fs.readdirSync(
      directory,
      { withFileTypes: true }
    )
  ) {
    if (
      entry.name === "node_modules" ||
      entry.name.startsWith(".")
    ) {
      continue
    }

    const full =
      path.join(
        directory,
        entry.name
      )

    if (entry.isDirectory()) {
      output.push(
        ...walk(full)
      )
    } else {
      output.push(full)
    }
  }

  return output
}

function safeRead(file) {
  try {
    return read(file)
  } catch {
    return ""
  }
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
