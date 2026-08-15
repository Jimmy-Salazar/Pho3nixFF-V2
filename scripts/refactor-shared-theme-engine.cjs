const fs = require("fs")
const path = require("path")

const ROOT = process.cwd()
const SRC_THEME = path.join(ROOT, "src", "theme")
const SHARED_THEME = path.join(ROOT, "src", "shared", "theme")
const BACKUP_ROOT = path.join(ROOT, ".pho3nix-backups")

const REQUIRED = [
  path.join(SRC_THEME, "ThemeProvider.jsx"),
  path.join(SRC_THEME, "themeCalendar.js"),
  path.join(SRC_THEME, "themeScheduleResolver.js"),
  path.join(SRC_THEME, "themeRuntimeResolver.js"),
]

const THEME_KEYS = [
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
]

main()

function main() {
  console.log("")
  console.log("PHO3NIX V2 — SHARED THEME ENGINE REFACTOR")
  console.log("==========================================")
  console.log("")

  validateProject()

  const currentCalendar = read(
    path.join(SRC_THEME, "themeCalendar.js")
  )
  const currentSchedule = read(
    path.join(SRC_THEME, "themeScheduleResolver.js")
  )
  const currentRuntime = read(
    path.join(SRC_THEME, "themeRuntimeResolver.js")
  )

  const plan = buildPlan({
    currentCalendar,
    currentSchedule,
    currentRuntime,
  })

  validatePlan(plan)

  const backupDir = createBackup()

  try {
    applyPlan(plan)
    validateResult()
    writeRefactorManifest(backupDir)

    console.log("")
    console.log("✅ REFACTORIZACIÓN COMPLETADA")
    console.log("")
    console.log("Motor compartido:")
    console.log("  src/shared/theme/")
    console.log("")
    console.log("La web sigue usando sus mismos imports.")
    console.log("Los archivos antiguos actúan como bridges/re-exports.")
    console.log("")
    console.log("Backup:")
    console.log(`  ${relative(backupDir)}`)
    console.log("")
    console.log("Ahora ejecuta:")
    console.log("  npm run dev -- --host 0.0.0.0")
    console.log("")
  } catch (error) {
    console.error("")
    console.error("❌ ERROR DURANTE LA REFACTORIZACIÓN")
    console.error(error?.stack || error)
    console.error("")
    console.error("No continúes trabajando sobre estos archivos.")
    console.error("Ejecuta:")
    console.error("  node scripts/rollback-shared-theme-engine.cjs")
    console.error("")
    process.exitCode = 1
  }
}

function validateProject() {
  const packageJson = path.join(ROOT, "package.json")

  if (!fs.existsSync(packageJson)) {
    fail(
      "Ejecuta este script desde la raíz de PHO3NIX V2 " +
      "(donde está package.json)."
    )
  }

  for (const file of REQUIRED) {
    if (!fs.existsSync(file)) {
      fail(`Falta archivo requerido: ${relative(file)}`)
    }
  }

  const provider = read(
    path.join(SRC_THEME, "ThemeProvider.jsx")
  )

  if (!provider.includes("ThemeProvider")) {
    fail("ThemeProvider.jsx no parece ser el archivo esperado.")
  }

  console.log("✅ Proyecto V2 detectado.")
}

function buildPlan({
  currentCalendar,
  currentSchedule,
  currentRuntime,
}) {
  const marker =
    "/* Returns YYYY-MM-DDTHH:mm in the requested IANA time zone. */"

  const markerIndex = currentCalendar.indexOf(marker)

  if (markerIndex < 0) {
    fail(
      "No pude separar themeCalendar.js de forma segura. " +
      "No se encontró el marcador de timezone esperado."
    )
  }

  let sharedCalendar =
    currentCalendar.slice(0, markerIndex).trimEnd() + "\n"

  const webCalendarSuffix =
    currentCalendar.slice(markerIndex).trimStart()

  sharedCalendar = sharedCalendar.replace(
    /const THEME_DATE_PREVIEW_KEY\s*=\s*["'][^"']+["']\s*\n+/,
    ""
  )

  sharedCalendar = sharedCalendar.replace(
    /import\s*\{\s*normalizeThemeMomentKey,\s*resolveScheduleEntry,\s*\}\s*from\s*["']\.\/themeScheduleResolver\.js["']/m,
    'import { resolveScheduleEntry } from "./themeScheduleResolver.js"'
  )

  const scheduleExtraction =
    extractEasterCalculator(currentSchedule)

  const sharedSchedule =
    ensureEasterImport(scheduleExtraction.scheduleSource)

  const easterCalculator =
    scheduleExtraction.easterSource

  const sharedRuntime = currentRuntime.replace(
    /from\s*["']\.\/themeScheduleResolver\.js["']/g,
    'from "./themeScheduleResolver.js"'
  )

  const webCalendar = [
    'import { normalizeThemeMomentKey } from "../shared/theme/themeScheduleResolver.js"',
    "",
    "export {",
    "  LOCAL_THEME_CALENDAR,",
    "  resolveLocalScheduledTheme,",
    "  resolveLocalScheduledThemeKey,",
    '} from "../shared/theme/themeCalendar.js"',
    "",
    'const THEME_DATE_PREVIEW_KEY = "phoenix:v2:theme-date-preview"',
    "",
    webCalendarSuffix,
    "",
  ].join("\n")

  const constants = [
    'export const DEFAULT_THEME_KEY = "phoenix"',
    'export const APP_TIME_ZONE = "America/Guayaquil"',
    "",
  ].join("\n")

  const registry = [
    'import { DEFAULT_THEME_KEY } from "./themeConstants.js"',
    "",
    "export const THEME_KEYS = Object.freeze([",
    ...THEME_KEYS.map((key) => `  "${key}",`),
    "])",
    "",
    "export const THEME_KEY_SET = new Set(THEME_KEYS)",
    "",
    "export function isKnownThemeKey(value) {",
    '  return THEME_KEY_SET.has(String(value || "").trim().toLowerCase())',
    "}",
    "",
    "export function normalizeThemeKey(value) {",
    '  const key = String(value || "").trim().toLowerCase()',
    "  return isKnownThemeKey(key) ? key : DEFAULT_THEME_KEY",
    "}",
    "",
  ].join("\n")

  const index = [
    'export * from "./themeConstants.js"',
    'export * from "./themeRegistry.js"',
    'export * from "./easterCalculator.js"',
    'export * from "./themeScheduleResolver.js"',
    'export * from "./themeCalendar.js"',
    'export * from "./themeRuntimeResolver.js"',
    "",
  ].join("\n")

  const scheduleBridge =
    'export * from "../shared/theme/themeScheduleResolver.js"\n'

  const runtimeBridge =
    'export * from "../shared/theme/themeRuntimeResolver.js"\n'

  return {
    sharedFiles: {
      "themeConstants.js": constants,
      "themeRegistry.js": registry,
      "easterCalculator.js": easterCalculator,
      "themeScheduleResolver.js": sharedSchedule,
      "themeCalendar.js": sharedCalendar,
      "themeRuntimeResolver.js": sharedRuntime,
      "index.js": index,
    },

    webFiles: {
      "themeCalendar.js": webCalendar,
      "themeScheduleResolver.js": scheduleBridge,
      "themeRuntimeResolver.js": runtimeBridge,
    },
  }
}

function extractEasterCalculator(source) {
  const candidates = [
    "export function calculateEasterSundayUTC",
    "function calculateEasterSundayUTC",
  ]

  let start = -1
  let signature = ""

  for (const candidate of candidates) {
    const found = source.indexOf(candidate)

    if (found >= 0) {
      start = found
      signature = candidate
      break
    }
  }

  if (start < 0) {
    fail(
      "No encontré calculateEasterSundayUTC() " +
      "en themeScheduleResolver.js."
    )
  }

  const openBrace = source.indexOf("{", start)

  if (openBrace < 0) {
    fail("No pude leer calculateEasterSundayUTC().")
  }

  let depth = 0
  let end = -1

  for (let i = openBrace; i < source.length; i += 1) {
    const char = source[i]

    if (char === "{") depth += 1
    if (char === "}") depth -= 1

    if (depth === 0) {
      end = i + 1
      break
    }
  }

  if (end < 0) {
    fail("calculateEasterSundayUTC() está incompleta.")
  }

  let functionSource = source.slice(start, end).trim()

  if (!functionSource.startsWith("export ")) {
    functionSource = `export ${functionSource}`
  }

  const scheduleSource =
    (
      source.slice(0, start) +
      source.slice(end)
    )
      .replace(/\n{3,}/g, "\n\n")
      .trimStart()

  return {
    scheduleSource,
    easterSource:
      [
        "/*",
        " * Gregorian Easter calculator.",
        " * Pure JavaScript: reusable by Web, Android and iOS.",
        " */",
        "",
        functionSource,
        "",
      ].join("\n"),
  }
}

function ensureEasterImport(source) {
  if (
    source.includes(
      'from "./easterCalculator.js"'
    )
  ) {
    return source
  }

  return (
    'import { calculateEasterSundayUTC } from "./easterCalculator.js"\n\n' +
    source
  )
}

function validatePlan(plan) {
  const forbidden = [
    /\bwindow\s*\./,
    /\bdocument\s*\./,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bimport\.meta\b/,
    /from\s+["']react["']/,
  ]

  for (const [name, content] of Object.entries(plan.sharedFiles)) {
    const executableSource =
      stripJavaScriptComments(content)

    for (const pattern of forbidden) {
      if (pattern.test(executableSource)) {
        fail(
          `El archivo compartido ${name} todavía contiene ` +
          `una dependencia Web real: ${pattern}`
        )
      }
    }
  }

  if (
    !plan.sharedFiles["themeCalendar.js"].includes(
      "LOCAL_THEME_CALENDAR"
    )
  ) {
    fail("El calendario compartido no contiene LOCAL_THEME_CALENDAR.")
  }

  if (
    !plan.sharedFiles["themeRuntimeResolver.js"].includes(
      "resolveRuntimeThemeSelection"
    )
  ) {
    fail("No encontré resolveRuntimeThemeSelection().")
  }

  console.log("✅ Plan de refactor validado.")
}

function createBackup() {
  fs.mkdirSync(BACKUP_ROOT, { recursive: true })

  const stamp = timestamp()
  const backupDir = path.join(
    BACKUP_ROOT,
    `theme-engine-${stamp}`
  )

  fs.mkdirSync(backupDir, { recursive: true })

  fs.cpSync(
    SRC_THEME,
    path.join(backupDir, "theme"),
    { recursive: true }
  )

  const sharedExists = fs.existsSync(SHARED_THEME)

  if (sharedExists) {
    fs.cpSync(
      SHARED_THEME,
      path.join(backupDir, "shared-theme"),
      { recursive: true }
    )
  }

  writeJson(
    path.join(backupDir, "backup-meta.json"),
    {
      createdAt: new Date().toISOString(),
      root: ROOT,
      sharedThemeExisted: sharedExists,
    }
  )

  console.log(`✅ Backup creado: ${relative(backupDir)}`)

  return backupDir
}

function applyPlan(plan) {
  fs.mkdirSync(SHARED_THEME, { recursive: true })

  for (const [name, content] of Object.entries(plan.sharedFiles)) {
    write(
      path.join(SHARED_THEME, name),
      content
    )
  }

  for (const [name, content] of Object.entries(plan.webFiles)) {
    write(
      path.join(SRC_THEME, name),
      content
    )
  }

  console.log("✅ Motor compartido creado.")
  console.log("✅ Bridges Web creados.")
}

function validateResult() {
  const requiredShared = [
    "themeConstants.js",
    "themeRegistry.js",
    "easterCalculator.js",
    "themeScheduleResolver.js",
    "themeCalendar.js",
    "themeRuntimeResolver.js",
    "index.js",
  ]

  for (const name of requiredShared) {
    const file = path.join(SHARED_THEME, name)

    if (!fs.existsSync(file)) {
      fail(`No se creó ${relative(file)}`)
    }
  }

  const forbidden = [
    "window.",
    "document.",
    "localStorage",
    "sessionStorage",
    "import.meta",
  ]

  for (const name of requiredShared) {
    const file = path.join(SHARED_THEME, name)
    const content = read(file)
    const executableSource =
      stripJavaScriptComments(content)

    for (const token of forbidden) {
      if (executableSource.includes(token)) {
        fail(
          `${relative(file)} contiene dependencia Web real: ${token}`
        )
      }
    }
  }

  const webCalendar = read(
    path.join(SRC_THEME, "themeCalendar.js")
  )

  if (
    !webCalendar.includes(
      '../shared/theme/themeCalendar.js'
    )
  ) {
    fail("themeCalendar.js Web no apunta al motor compartido.")
  }

  console.log("✅ Validación final superada.")
}

function writeRefactorManifest(backupDir) {
  const manifest = {
    refactor: "PHO3NIX V2 Shared Theme Engine",
    completedAt: new Date().toISOString(),
    backup: relative(backupDir),
    sharedPath: "src/shared/theme",
    defaultThemeKey: "phoenix",
    timeZone: "America/Guayaquil",
    themeKeys: THEME_KEYS,
    webOnly: [
      "ThemeProvider.jsx",
      "themeRuntimeService.js",
      "remoteThemeService.js",
      "themeCalendar.js DEV preview adapter",
    ],
    reusableByFutureMobileApp: [
      "themeConstants.js",
      "themeRegistry.js",
      "easterCalculator.js",
      "themeScheduleResolver.js",
      "themeCalendar.js",
      "themeRuntimeResolver.js",
    ],
  }

  writeJson(
    path.join(ROOT, "src", "shared", "theme", "refactor-manifest.json"),
    manifest
  )
}

function stripJavaScriptComments(source) {
  /*
   * Validation helper only.
   *
   * It removes comments while preserving quoted/template strings well
   * enough for dependency detection. This prevents words such as
   * "localStorage" inside documentation comments from being reported
   * as real browser dependencies.
   */
  let result = ""
  let state = "code"

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i]
    const next = source[i + 1]

    if (state === "line-comment") {
      if (ch === "\n") {
        result += "\n"
        state = "code"
      }
      continue
    }

    if (state === "block-comment") {
      if (ch === "*" && next === "/") {
        i += 1
        state = "code"
      } else if (ch === "\n") {
        result += "\n"
      }
      continue
    }

    if (state === "single-quote") {
      result += ch

      if (ch === "\\" && next !== undefined) {
        result += next
        i += 1
        continue
      }

      if (ch === "'") {
        state = "code"
      }
      continue
    }

    if (state === "double-quote") {
      result += ch

      if (ch === "\\" && next !== undefined) {
        result += next
        i += 1
        continue
      }

      if (ch === '"') {
        state = "code"
      }
      continue
    }

    if (state === "template") {
      result += ch

      if (ch === "\\" && next !== undefined) {
        result += next
        i += 1
        continue
      }

      if (ch === "`") {
        state = "code"
      }
      continue
    }

    if (ch === "/" && next === "/") {
      state = "line-comment"
      i += 1
      continue
    }

    if (ch === "/" && next === "*") {
      state = "block-comment"
      i += 1
      continue
    }

    if (ch === "'") {
      result += ch
      state = "single-quote"
      continue
    }

    if (ch === '"') {
      result += ch
      state = "double-quote"
      continue
    }

    if (ch === "`") {
      result += ch
      state = "template"
      continue
    }

    result += ch
  }

  return result
}

function read(file) {
  return fs.readFileSync(file, "utf8")
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(
    file,
    content.replace(/\r\n/g, "\n"),
    "utf8"
  )
}

function writeJson(file, value) {
  write(
    file,
    JSON.stringify(value, null, 2) + "\n"
  )
}

function relative(file) {
  return path.relative(ROOT, file) || "."
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
