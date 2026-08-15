const fs = require("fs")
const path = require("path")

const ROOT = process.cwd()

const files = {
  page: path.join(
    ROOT,
    "src",
    "modules",
    "admin",
    "pages",
    "AdminThemesPage.jsx"
  ),

  service: path.join(
    ROOT,
    "src",
    "modules",
    "admin",
    "themes",
    "services",
    "themeAdminService.js"
  ),

  runtime: path.join(
    ROOT,
    "src",
    "theme",
    "themeRuntimeService.js"
  ),
}

console.log("")
console.log("PHO3NIX V2 — VERIFY AUTO-ONLY")
console.log("==============================")
console.log("")

for (const file of Object.values(files)) {
  if (!fs.existsSync(file)) {
    throw new Error(
      `Falta ${path.relative(ROOT, file)}`
    )
  }
}

const page =
  fs.readFileSync(files.page, "utf8")

const service =
  fs.readFileSync(files.service, "utf8")

const runtime =
  fs.readFileSync(files.runtime, "utf8")

const problems = []

for (const term of [
  "ThemeManualControl",
  "setManualThemeMode",
  "setAutomaticThemeMode",
  "setThemeCalendarEnabled",
]) {
  if (
    page.includes(term) ||
    service.includes(term)
  ) {
    problems.push(
      `Control manual todavía presente: ${term}`
    )
  }
}

if (
  !runtime.includes(
    'const AUTO_ONLY_MODE = "auto"'
  )
) {
  problems.push(
    "Runtime no declara AUTO_ONLY_MODE."
  )
}

if (
  !runtime.includes(
    "manualThemeKey:\n      null"
  )
) {
  problems.push(
    "Runtime no fuerza manualThemeKey = null."
  )
}

if (problems.length) {
  console.log("❌ VALIDACIÓN FALLIDA")
  console.log("")

  for (const problem of problems) {
    console.log(`- ${problem}`)
  }

  process.exit(1)
}

console.log("✅ Panel Admin: solo lectura")
console.log("✅ Runtime: AUTO-ONLY")
console.log("✅ manualThemeKey: null")
console.log("✅ Sin controles de escritura")
console.log("")
console.log("Theme Engine listo para calendario automático.")
console.log("")
