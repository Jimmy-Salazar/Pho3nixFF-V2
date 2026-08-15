const fs = require("fs")
const path = require("path")

const ROOT = process.cwd()

const paths = {
  page: "src/modules/alumno/pages/StudentPdaPage.jsx",
  service: "src/modules/alumno/pda/services/studentPdaService.js",
  utils: "src/modules/alumno/pda/utils/studentPdaUtils.js",
  visibility: "src/modules/alumno/pda/utils/pdaVisibility.js",
  comingSoon: "src/modules/alumno/pda/components/StudentPdaComingSoon.jsx",
  navigation: "src/modules/alumno/dashboard/components/studentNavigation.js",
  sidebar: "src/modules/alumno/dashboard/components/StudentSidebar.jsx",
  mobile: "src/modules/alumno/dashboard/components/StudentMobileNav.jsx",
  routes: "src/app/routes/AppRoutes.jsx",
}

let failed = false
let warnings = 0

console.log("")
console.log("PHO3NIX V2 — VERIFY PDA PRODUCTION")
console.log("==================================")
console.log("")

for (const [key, relative] of Object.entries(paths)) {
  if (!fs.existsSync(path.join(ROOT, relative))) {
    if (["navigation", "sidebar", "mobile"].includes(key)) {
      warn(`No pude revisar ${relative}`)
      continue
    }
    fail(`Falta ${relative}`)
  }
}

const page = read(paths.page)
const service = read(paths.service)
const utils = read(paths.utils)
const visibility = read(paths.visibility)
const comingSoon = read(paths.comingSoon)
const routes = read(paths.routes)

check(
  utils.includes("PDA_DEVELOPMENT_UNLOCK = false"),
  "Development unlock desactivado"
)

check(
  !service.includes("isPdaDevelopmentUnlockEnabled"),
  "Service sin bypass de desarrollo"
)

check(
  service.includes('.from("pda_resultados")') &&
    service.includes('pda_ranking_general'),
  "Resultados por usuario + ranking general conectados"
)

check(
  !service.includes('.from("pda_inscripciones")'),
  "Frontend sin dependencia de pda_inscripciones"
)

check(
  service.includes('.eq("publicada", true)') &&
    !service.includes('.eq("estado", "activa")'),
  "Edición visible por publicación, sin exigir estado=activa"
)

check(
  page.includes("StudentPdaComingSoon") &&
    comingSoon.includes("getPdaPosterFallbackPath"),
  "Afiche anual con fallback conectado"
)

check(
  visibility.includes('timeZone: PDA_TIME_ZONE') &&
    visibility.includes("day <= 5") &&
    visibility.includes("year - 1"),
  "Regla anual Guayaquil Nov 15 → Jan 5"
)

check(
  routes.includes('path="/atleta/pda"'),
  "Ruta /atleta/pda presente"
)

const navText = [
  safeRead(paths.navigation),
  safeRead(paths.sidebar),
  safeRead(paths.mobile),
].join("\n")

if (!/pda/i.test(navText)) {
  warn(
    "No detecté PDA en navigation/sidebar/mobile. " +
    "La ruta está protegida, pero falta verificar el botón estacional."
  )
} else {
  console.log("✅ Navegación contiene integración PDA")
}

console.log("")

if (failed) {
  console.log("❌ PDA PRODUCTION: VALIDACIÓN FALLIDA")
  process.exit(1)
}

console.log("✅ PDA PRODUCTION: FRONTEND CORE VALIDADO")

if (warnings) {
  console.log(`⚠️  ${warnings} advertencia(s) requieren revisión visual.`)
}

console.log("")
console.log("Ahora ejecuta:")
console.log("  npm run build")
console.log("")

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), "utf8")
}

function safeRead(relative) {
  const absolute = path.join(ROOT, relative)
  return fs.existsSync(absolute) ? fs.readFileSync(absolute, "utf8") : ""
}

function check(condition, message) {
  if (condition) {
    console.log(`✅ ${message}`)
  } else {
    fail(message)
  }
}

function warn(message) {
  warnings += 1
  console.log(`⚠️  ${message}`)
}

function fail(message) {
  failed = true
  console.log(`❌ ${message}`)
}
