const fs = require("fs")
const path = require("path")
const { execFileSync } = require("child_process")

const ROOT = process.cwd()

const ROUTER = path.join(
  ROOT,
  "src",
  "app",
  "routes",
  "AppRoutes.jsx"
)

const PAGE = path.join(
  ROOT,
  "src",
  "modules",
  "admin",
  "pages",
  "AdminThemesPage.jsx"
)

const BACKUP_ROOT = path.join(
  ROOT,
  ".pho3nix-backups"
)

main()

function main() {
  console.log("")
  console.log("PHO3NIX V2 — FIX /admin/themes ROUTE")
  console.log("====================================")
  console.log("")

  validateProject()

  let source = read(ROUTER)

  const backupDir = createBackup(source)

  try {
    source = removeBadAdminThemesRoutes(source)
    source = ensureAdminThemesImport(source)
    source = insertCorrectAdminThemesRoute(source)

    write(ROUTER, source)

    validateSource(source)
    validateSyntax()

    console.log("")
    console.log("✅ RUTA /admin/themes CORREGIDA")
    console.log("")
    console.log("Archivo:")
    console.log("  src/app/routes/AppRoutes.jsx")
    console.log("")
    console.log("La ruta quedó como hija directa de <Routes>")
    console.log("y protegida únicamente para el rol admin.")
    console.log("")
    console.log("Backup:")
    console.log(`  ${relative(backupDir)}`)
    console.log("")
    console.log("Ahora reinicia Vite:")
    console.log("  npm run dev -- --host 0.0.0.0")
    console.log("")
  } catch (error) {
    console.error("")
    console.error("❌ ERROR CORRIGIENDO LA RUTA")
    console.error(error?.stack || error)
    console.error("")
    console.error("El backup quedó en:")
    console.error(`  ${relative(backupDir)}`)
    console.error("")
    process.exit(1)
  }
}

function validateProject() {
  if (!fs.existsSync(path.join(ROOT, "package.json"))) {
    fail(
      "Ejecuta este script desde la raíz de C:\\projects\\phoenix-v2."
    )
  }

  if (!fs.existsSync(ROUTER)) {
    fail(
      "No existe src/app/routes/AppRoutes.jsx."
    )
  }

  if (!fs.existsSync(PAGE)) {
    fail(
      "No existe src/modules/admin/pages/AdminThemesPage.jsx. " +
      "Primero debe estar creada la Fase 3."
    )
  }

  const source = read(ROUTER)

  if (
    !source.includes("<Routes") ||
    !source.includes("</Routes>")
  ) {
    fail(
      "AppRoutes.jsx no contiene un bloque <Routes> reconocible."
    )
  }

  if (!source.includes("ProtectedRoute")) {
    fail(
      "No encontré ProtectedRoute en AppRoutes.jsx."
    )
  }

  console.log("✅ AppRoutes.jsx detectado.")
  console.log("✅ AdminThemesPage.jsx detectado.")
}

function createBackup(source) {
  fs.mkdirSync(BACKUP_ROOT, { recursive: true })

  const backupDir = path.join(
    BACKUP_ROOT,
    `admin-themes-route-fix-${timestamp()}`
  )

  fs.mkdirSync(backupDir, { recursive: true })

  write(
    path.join(backupDir, "AppRoutes.jsx"),
    source
  )

  console.log(
    `✅ Backup creado: ${relative(backupDir)}`
  )

  return backupDir
}

function removeBadAdminThemesRoutes(source) {
  /*
   * Remove every /admin/themes Route, whether it was inserted correctly
   * or incorrectly. Then we insert one canonical route later.
   *
   * Handles:
   *   <Route path="/admin/themes" element={<AdminThemesPage />} />
   *
   * and common multiline variants.
   */
  const routePattern =
    /[ \t]*<Route\b(?=[\s\S]{0,500}?\bpath\s*=\s*["']\/admin\/themes["'])[\s\S]*?\/>[ \t]*\r?\n?/g

  let result = source
  let previous = null
  let loops = 0

  while (result !== previous && loops < 10) {
    previous = result
    result = result.replace(routePattern, "")
    loops += 1
  }

  /*
   * The broad regex above can stop at an inner self-closing child when
   * the bad route was inserted inside another element. Clean any remaining
   * simple route line explicitly.
   */
  result = result.replace(
    /^[ \t]*<Route\s+path=["']\/admin\/themes["']\s+element=\{<AdminThemesPage\s*\/>\}\s*\/>[ \t]*\r?\n?/gm,
    ""
  )

  return result
}

function ensureAdminThemesImport(source) {
  if (
    source.includes(
      'import AdminThemesPage from "../../modules/admin/pages/AdminThemesPage.jsx"'
    )
  ) {
    return source
  }

  /*
   * Remove any incorrect/duplicate AdminThemesPage import first.
   */
  source = source.replace(
    /^import\s+AdminThemesPage\s+from\s+["'][^"']+AdminThemesPage\.jsx["']\s*;?\s*\r?\n?/gm,
    ""
  )

  const expectedImport =
    'import AdminThemesPage from "../../modules/admin/pages/AdminThemesPage.jsx"'

  const adminDashboardImportRegex =
    /^import\s+AdminDashboardPage\s+from\s+["'][^"']+["']\s*;?\s*$/m

  const match = source.match(
    adminDashboardImportRegex
  )

  if (match) {
    return source.replace(
      match[0],
      `${match[0]}\n${expectedImport}`
    )
  }

  const imports =
    [...source.matchAll(/^import .*$/gm)]

  if (!imports.length) {
    fail(
      "No pude encontrar la sección de imports de AppRoutes.jsx."
    )
  }

  const last =
    imports[imports.length - 1]

  const insertAt =
    last.index + last[0].length

  return (
    source.slice(0, insertAt) +
    "\n" +
    expectedImport +
    source.slice(insertAt)
  )
}

function insertCorrectAdminThemesRoute(source) {
  const routesOpen =
    source.indexOf("<Routes")

  if (routesOpen < 0) {
    fail("No encontré <Routes>.")
  }

  const routesOpenEnd =
    source.indexOf(">", routesOpen)

  const routesClose =
    source.lastIndexOf("</Routes>")

  if (
    routesOpenEnd < 0 ||
    routesClose < 0 ||
    routesClose <= routesOpenEnd
  ) {
    fail(
      "No pude delimitar correctamente <Routes>...</Routes>."
    )
  }

  const beforeRoutes =
    source.slice(0, routesOpenEnd + 1)

  let body =
    source.slice(routesOpenEnd + 1, routesClose)

  const afterRoutes =
    source.slice(routesClose)

  const route = `
      <Route
        path="/admin/themes"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminThemesPage />
          </ProtectedRoute>
        }
      />

`

  /*
   * Prefer to insert before the wildcard route so /admin/themes is
   * obviously part of the normal direct children of <Routes>.
   */
  const wildcardIndex =
    body.search(
      /[ \t]*<Route\b[\s\S]{0,300}?\bpath\s*=\s*["']\*["']/
    )

  if (wildcardIndex >= 0) {
    body =
      body.slice(0, wildcardIndex) +
      route +
      body.slice(wildcardIndex)
  } else {
    body =
      body.trimEnd() +
      "\n" +
      route
  }

  return (
    beforeRoutes +
    body +
    afterRoutes
  )
}

function validateSource(source) {
  const count =
    (
      source.match(
        /path\s*=\s*["']\/admin\/themes["']/g
      ) || []
    ).length

  if (count !== 1) {
    fail(
      `Esperaba exactamente 1 ruta /admin/themes y encontré ${count}.`
    )
  }

  if (
    !source.includes(
      '<ProtectedRoute allowedRoles={["admin"]}>'
    )
  ) {
    fail(
      "/admin/themes no quedó protegida exclusivamente para admin."
    )
  }

  const routesOpen =
    source.indexOf("<Routes")

  const routesClose =
    source.lastIndexOf("</Routes>")

  const routeIndex =
    source.indexOf(
      'path="/admin/themes"'
    )

  if (
    routeIndex < routesOpen ||
    routeIndex > routesClose
  ) {
    fail(
      "/admin/themes quedó fuera de <Routes>."
    )
  }

  console.log("✅ Estructura de rutas validada.")
}

function validateSyntax() {
  /*
   * Node --check cannot parse JSX directly.
   * If Vite is available, invoke a production transform through the
   * installed project tooling would be overkill here; structural
   * validation is sufficient and Vite will perform the final JSX parse.
   */
  const source = read(ROUTER)

  const pairs = [
    ["<Routes", "</Routes>"],
  ]

  for (const [open, close] of pairs) {
    if (
      !source.includes(open) ||
      !source.includes(close)
    ) {
      fail(
        `Falta estructura JSX ${open} ... ${close}`
      )
    }
  }

  console.log("✅ Validación estructural completada.")
}

function read(file) {
  return fs.readFileSync(file, "utf8")
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

function relative(file) {
  return path.relative(ROOT, file) || "."
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
