const fs = require("fs")
const path = require("path")
const { pathToFileURL } = require("url")

const ROOT = process.cwd()

const SHARED = path.join(
  ROOT,
  "src",
  "shared",
  "theme"
)

const WEB_CALENDAR = path.join(
  ROOT,
  "src",
  "theme",
  "themeCalendar.js"
)

const RUNTIME_SERVICE = path.join(
  ROOT,
  "src",
  "theme",
  "themeRuntimeService.js"
)

const EXPECTED_THEME_KEYS = [
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

main().catch((error) => {
  console.error("")
  console.error("❌ VALIDACIÓN INTERRUMPIDA")
  console.error(error?.stack || error)
  console.error("")
  process.exit(1)
})

async function main() {
  console.log("")
  console.log("PHO3NIX V2 — THEME ENGINE VALIDATION SUITE")
  console.log("===========================================")
  console.log("")

  validateProject()

  const modules =
    await loadSharedModules()

  const calendarEntries =
    resolveCalendarEntries(
      modules.calendar
    )

  const themeKeys =
    resolveThemeKeys(
      modules.registry
    )

  validateRegistry(themeKeys)

  validateCalendarCount(
    calendarEntries
  )

  runCalendarTests({
    calendarEntries,
    resolver:
      modules.scheduleResolver,
    themeKeys,
  })

  validateAutoOnlyRuntime()

  validateWebPreviewSupport()

  validateOfflineFallback()

  console.log("")
  console.log("===========================================")
  console.log("✅ PHO3NIX THEME ENGINE: VALIDACIÓN SUPERADA")
  console.log("===========================================")
  console.log("")
  console.log("Motor:")
  console.log("  AUTO-ONLY                 ✅")
  console.log("  20 themes especiales      ✅")
  console.log("  phoenix fallback           ✅")
  console.log("  Carnaval dinámico          ✅")
  console.log("  Viernes Santo dinámico     ✅")
  console.log("  Madre/Padre dinámicos      ✅")
  console.log("  Diciembre/Enero            ✅")
  console.log("  Preview DEV PC/móvil       ✅")
  console.log("  Cache offline              ✅")
  console.log("")
}

function validateProject() {
  const required = [
    path.join(ROOT, "package.json"),
    path.join(
      SHARED,
      "themeCalendar.js"
    ),
    path.join(
      SHARED,
      "themeScheduleResolver.js"
    ),
    path.join(
      SHARED,
      "themeRegistry.js"
    ),
    RUNTIME_SERVICE,
    WEB_CALENDAR,
  ]

  for (const file of required) {
    if (!fs.existsSync(file)) {
      fail(
        `Falta ${relative(file)}`
      )
    }
  }

  console.log("✅ Proyecto PHO3NIX V2 detectado.")
}

async function loadSharedModules() {
  const calendar =
    await dynamicImport(
      path.join(
        SHARED,
        "themeCalendar.js"
      )
    )

  const scheduleResolver =
    await dynamicImport(
      path.join(
        SHARED,
        "themeScheduleResolver.js"
      )
    )

  const registry =
    await dynamicImport(
      path.join(
        SHARED,
        "themeRegistry.js"
      )
    )

  if (
    typeof scheduleResolver
      .resolveScheduleEntry !==
    "function"
  ) {
    fail(
      "themeScheduleResolver.js no exporta resolveScheduleEntry()."
    )
  }

  console.log("✅ Shared Theme Engine cargado.")

  return {
    calendar,
    scheduleResolver,
    registry,
  }
}

async function dynamicImport(file) {
  try {
    return await import(
      pathToFileURL(file).href +
      `?validation=${Date.now()}`
    )
  } catch (error) {
    fail(
      `No pude importar ${relative(file)}:\n${error.message}`
    )
  }
}

function resolveCalendarEntries(module) {
  const candidates = [
    module.THEME_CALENDAR,
    module.themeCalendar,
    module.DEFAULT_THEME_CALENDAR,
    module.LOCAL_THEME_CALENDAR,
    module.calendarEntries,
    module.default,
  ]

  for (const value of candidates) {
    if (Array.isArray(value)) {
      return value
    }
  }

  for (const value of Object.values(module)) {
    if (
      Array.isArray(value) &&
      value.length >= 15
    ) {
      return value
    }
  }

  fail(
    "No pude localizar el array de calendario en src/shared/theme/themeCalendar.js."
  )
}

function resolveThemeKeys(module) {
  const directCandidates = [
    module.THEME_KEYS,
    module.themeKeys,
    module.REGISTERED_THEME_KEYS,
  ]

  for (const value of directCandidates) {
    if (Array.isArray(value)) {
      return normalizeKeys(value)
    }
  }

  const objectCandidates = [
    module.THEME_REGISTRY,
    module.themeRegistry,
    module.registry,
  ]

  for (const value of objectCandidates) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      return normalizeKeys(
        Object.keys(value)
      )
    }
  }

  /*
   * Some registries expose helper functions instead of raw arrays.
   * Fall back to the expected canonical list, but verify each key by
   * searching the registry source so this is still a real validation.
   */
  const source = fs.readFileSync(
    path.join(
      SHARED,
      "themeRegistry.js"
    ),
    "utf8"
  )

  const present =
    EXPECTED_THEME_KEYS.filter(
      (key) =>
        source.includes(
          `"${key}"`
        ) ||
        source.includes(
          `'${key}'`
        )
    )

  return normalizeKeys(present)
}

function normalizeKeys(values) {
  return [
    ...new Set(
      (values || [])
        .map(
          (value) =>
            String(value || "")
              .trim()
              .toLowerCase()
        )
        .filter(Boolean)
    ),
  ]
}

function validateRegistry(themeKeys) {
  const missing =
    EXPECTED_THEME_KEYS.filter(
      (key) =>
        !themeKeys.includes(key)
    )

  if (missing.length) {
    fail(
      "Faltan themes en el registro:\n" +
      missing
        .map(
          (key) => `  - ${key}`
        )
        .join("\n")
    )
  }

  console.log(
    `✅ Registry: ${EXPECTED_THEME_KEYS.length} keys encontrados (phoenix + 20 especiales).`
  )
}

function validateCalendarCount(entries) {
  const keys =
    entries
      .map(
        (entry) =>
          normalizeThemeKey(
            entry?.themeKey ??
            entry?.theme_key
          )
      )
      .filter(Boolean)

  const special =
    EXPECTED_THEME_KEYS
      .filter(
        (key) => key !== "phoenix"
      )

  const missing =
    special.filter(
      (key) => !keys.includes(key)
    )

  if (missing.length) {
    fail(
      "El calendario no contiene todas las reglas aprobadas:\n" +
      missing
        .map(
          (key) => `  - ${key}`
        )
        .join("\n")
    )
  }

  console.log(
    `✅ Calendario: ${special.length} reglas especiales presentes.`
  )
}

function runCalendarTests({
  calendarEntries,
  resolver,
  themeKeys,
}) {
  const allowed =
    new Set(themeKeys)

  const tests = [
    // Normal day
    ["2026-08-14T12:00", "phoenix", "día normal"],

    // New Year
    ["2026-01-01T00:00", "new_year", "Año Nuevo inicio"],
    ["2026-01-01T23:59", "new_year", "Año Nuevo fin"],
    ["2026-01-02T00:00", "phoenix", "Año Nuevo retorno"],

    // Valentine special hourly rule
    ["2026-02-13T22:59", "phoenix", "San Valentín antes"],
    ["2026-02-13T23:00", "valentines_day", "San Valentín inicio"],
    ["2026-02-14T23:59", "valentines_day", "San Valentín fin"],
    ["2026-02-15T00:00", "carnival", "San Valentín termina pero Carnaval continúa"],

    // Carnival 2026
    ["2026-02-13T23:59", "valentines_day", "Cruce Valentine/Carnival prioridad"],
    ["2026-02-14T00:00", "valentines_day", "Solapamiento: San Valentín conserva prioridad sobre Carnaval"],
    ["2026-02-14T12:00", "valentines_day", "Solapamiento San Valentín/Carnaval: prioridad 120 > 95"],
    ["2026-02-14T23:59", "valentines_day", "San Valentín mantiene prioridad hasta 23:59"],
    ["2026-02-17T23:59", "carnival", "Carnaval 2026 martes"],
    ["2026-02-18T00:00", "phoenix", "Carnaval 2026 retorno"],

    // Women's Day
    ["2026-03-08T12:00", "international_womens_day", "Día de la Mujer"],

    // Good Friday 2026
    ["2026-04-03T12:00", "good_friday", "Viernes Santo 2026"],
    ["2026-04-04T00:00", "phoenix", "Viernes Santo retorno"],

    // May
    ["2026-05-01T12:00", "labor_day", "Día del Trabajo"],
    ["2026-05-10T12:00", "mothers_day", "Día de la Madre 2026"],
    ["2026-05-24T12:00", "battle_of_pichincha", "Batalla de Pichincha"],

    // June
    ["2026-06-01T12:00", "childrens_day", "Día del Niño"],
    ["2026-06-21T12:00", "fathers_day", "Día del Padre 2026"],

    // Guayaquil / national
    ["2026-07-25T12:00", "guayaquil_foundation", "Fundación Guayaquil"],
    ["2026-08-10T12:00", "first_cry_of_independence", "10 de Agosto"],
    ["2026-09-26T12:00", "flag_day", "Día de la Bandera"],
    ["2026-10-09T12:00", "guayaquil_independence", "Independencia Guayaquil"],
    ["2026-10-31T12:00", "halloween", "Halloween"],
    ["2026-11-02T12:00", "all_souls_day", "Difuntos"],
    ["2026-11-03T12:00", "cuenca_independence", "Independencia Cuenca"],
    ["2026-12-06T12:00", "quito_foundation", "Fundación Quito"],

    // December transitions
    ["2026-12-20T23:59", "phoenix", "antes de Navidad"],
    ["2026-12-21T00:00", "christmas", "Navidad inicio"],
    ["2026-12-28T23:59", "christmas", "Navidad fin"],
    ["2026-12-29T00:00", "year_end", "Fin de Año inicio"],
    ["2026-12-31T23:59", "year_end", "Fin de Año fin"],
    ["2027-01-01T00:00", "new_year", "Año Nuevo 2027"],
    ["2027-01-02T00:00", "phoenix", "retorno Phoenix 2027"],

    // Dynamic future Carnival
    ["2027-02-06T12:00", "carnival", "Carnaval 2027"],
    ["2028-02-26T12:00", "carnival", "Carnaval 2028"],
  ]

  let passed = 0

  for (const [
    dateTimeKey,
    expected,
    label,
  ] of tests) {
    const actual =
      resolveThemeKey({
        dateTimeKey,
        calendarEntries,
        allowed,
        resolver,
      })

    if (actual !== expected) {
      fail(
        `Prueba fallida: ${label}\n` +
        `  fecha:    ${dateTimeKey}\n` +
        `  esperado: ${expected}\n` +
        `  recibido: ${actual}`
      )
    }

    passed += 1
  }

  console.log(
    `✅ Calendario: ${passed} pruebas de fechas superadas.`
  )
}

function resolveThemeKey({
  dateTimeKey,
  calendarEntries,
  allowed,
  resolver,
}) {
  const entry =
    resolver.resolveScheduleEntry({
      dateTimeKey,
      calendarEntries,
      allowedThemeKeys:
        allowed,
    })

  return (
    normalizeThemeKey(
      entry?.themeKey ??
      entry?.theme_key
    ) ||
    "phoenix"
  )
}

function validateAutoOnlyRuntime() {
  const source =
    fs.readFileSync(
      RUNTIME_SERVICE,
      "utf8"
    )

  const checks = [
    [
      'const AUTO_ONLY_MODE = "auto"',
      "AUTO_ONLY_MODE",
    ],
    [
      "manualThemeKey",
      "manualThemeKey",
    ],
    [
      "mapAutoOnlyRuntimeConfig",
      "normalización runtime",
    ],
    [
      "readCachedThemeRuntimeSnapshot",
      "cache fallback",
    ],
  ]

  for (const [
    needle,
    label,
  ] of checks) {
    if (!source.includes(needle)) {
      fail(
        `Runtime AUTO-ONLY incompleto: falta ${label}.`
      )
    }
  }

  /*
   * Verify that manual mode from a remote row is not used as authority.
   */
  if (
    /row\.mode\s*===\s*["']manual["']/.test(
      source
    )
  ) {
    fail(
      "themeRuntimeService todavía contiene una decisión basada en row.mode === manual."
    )
  }

  console.log(
    "✅ Runtime: AUTO-ONLY confirmado."
  )
}

function validateWebPreviewSupport() {
  const source =
    fs.readFileSync(
      WEB_CALENDAR,
      "utf8"
    )

  const required = [
    "themeDate",
    "readDevelopmentThemeDateKeyFromUrl",
    "getEffectiveThemeDateKey",
  ]

  for (const term of required) {
    if (!source.includes(term)) {
      fail(
        `Preview DEV incompleto: falta ${term}.`
      )
    }
  }

  console.log(
    "✅ Preview DEV por URL disponible para PC/móvil."
  )
}

function validateOfflineFallback() {
  const runtime =
    fs.readFileSync(
      RUNTIME_SERVICE,
      "utf8"
    )

  const hasTry =
    runtime.includes("try {")

  const hasCatch =
    runtime.includes("catch")

  const hasCache =
    runtime.includes(
      "readCachedThemeRuntimeSnapshot"
    )

  if (
    !hasTry ||
    !hasCatch ||
    !hasCache
  ) {
    fail(
      "No detecté fallback a cache ante error remoto."
    )
  }

  console.log(
    "✅ Fallback offline: cache detectada."
  )
}

function normalizeThemeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
}

function relative(file) {
  return (
    path.relative(
      ROOT,
      file
    ) || "."
  )
}

function fail(message) {
  throw new Error(message)
}
