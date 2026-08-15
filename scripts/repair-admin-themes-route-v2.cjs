const fs = require("fs")
const path = require("path")

const ROOT = process.cwd()

const ROUTER = path.join(
  ROOT,
  "src",
  "app",
  "routes",
  "AppRoutes.jsx"
)

const ADMIN_PAGE = path.join(
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
  console.log("PHO3NIX V2 — REPAIR ADMIN THEMES ROUTE V2")
  console.log("==========================================")
  console.log("")

  validateProject()

  const recovery =
    findBestRecoverySource()

  if (!recovery) {
    fail(
      "No encontré un AppRoutes.jsx seguro para recuperar. " +
      "Sube tu AppRoutes.jsx actual para repararlo manualmente."
    )
  }

  console.log(
    `✅ Fuente segura encontrada: ${recovery.label}`
  )

  const safetyBackup =
    createSafetyBackup()

  try {
    let source =
      fs.readFileSync(
        recovery.file,
        "utf8"
      )

    source =
      removeOnlyAdminThemesRoute(source)

    source =
      ensureAdminThemesImport(source)

    source =
      insertDirectAdminThemesRoute(source)

    validateResult(source)

    fs.writeFileSync(
      ROUTER,
      source.replace(/\r\n/g, "\n"),
      "utf8"
    )

    console.log("")
    console.log("✅ AppRoutes.jsx REPARADO")
    console.log("")
    console.log("Ruta:")
    console.log("  /admin/themes")
    console.log("")
    console.log("Protección:")
    console.log('  allowedRoles={["admin"]}')
    console.log("")
    console.log("Backup de seguridad:")
    console.log(
      `  ${relative(safetyBackup)}`
    )
    console.log("")
    console.log("Ahora ejecuta:")
    console.log(
      "  npm run dev -- --host 0.0.0.0"
    )
    console.log("")
  } catch (error) {
    console.error("")
    console.error("❌ ERROR")
    console.error(
      error?.stack || error
    )
    console.error("")
    console.error(
      "Tu archivo actual quedó respaldado en:"
    )
    console.error(
      `  ${relative(safetyBackup)}`
    )
    console.error("")
    process.exit(1)
  }
}

function validateProject() {
  if (
    !fs.existsSync(
      path.join(ROOT, "package.json")
    )
  ) {
    fail(
      "Ejecuta el script desde C:\\projects\\phoenix-v2."
    )
  }

  if (!fs.existsSync(ROUTER)) {
    fail(
      "No existe src/app/routes/AppRoutes.jsx."
    )
  }

  if (!fs.existsSync(ADMIN_PAGE)) {
    fail(
      "No existe AdminThemesPage.jsx."
    )
  }

  console.log("✅ Proyecto detectado.")
}

function findBestRecoverySource() {
  if (!fs.existsSync(BACKUP_ROOT)) {
    return null
  }

  /*
   * First preference:
   * backup created by the FIRST route-fix script.
   * It contains the syntactically valid AppRoutes before that script
   * damaged it. It may still have /admin/themes nested, which we can
   * safely remove by exact tag matching.
   */
  const routeFixBackups =
    fs.readdirSync(
      BACKUP_ROOT,
      { withFileTypes: true }
    )
      .filter(
        (entry) =>
          entry.isDirectory() &&
          entry.name.startsWith(
            "admin-themes-route-fix-"
          )
      )
      .map(
        (entry) => entry.name
      )
      .sort()
      .reverse()

  for (const name of routeFixBackups) {
    const candidate =
      path.join(
        BACKUP_ROOT,
        name,
        "AppRoutes.jsx"
      )

    if (
      fs.existsSync(candidate) &&
      looksLikeRecoverableRouter(
        fs.readFileSync(
          candidate,
          "utf8"
        )
      )
    ) {
      return {
        file: candidate,
        label:
          `.pho3nix-backups\\${name}\\AppRoutes.jsx`,
      }
    }
  }

  /*
   * Second preference:
   * backup created immediately before Admin Theme Center creation.
   * That router has no /admin/themes route yet and is also safe.
   */
  const adminBackups =
    fs.readdirSync(
      BACKUP_ROOT,
      { withFileTypes: true }
    )
      .filter(
        (entry) =>
          entry.isDirectory() &&
          entry.name.startsWith(
            "admin-theme-center-"
          )
      )
      .map(
        (entry) => entry.name
      )
      .sort()
      .reverse()

  for (const name of adminBackups) {
    const dir =
      path.join(
        BACKUP_ROOT,
        name
      )

    const files =
      fs.readdirSync(dir)

    const routerBackup =
      files.find(
        (file) =>
          file.startsWith(
            "router-original."
          )
      )

    if (!routerBackup) continue

    const candidate =
      path.join(
        dir,
        routerBackup
      )

    if (
      looksLikeRecoverableRouter(
        fs.readFileSync(
          candidate,
          "utf8"
        )
      )
    ) {
      return {
        file: candidate,
        label:
          `.pho3nix-backups\\${name}\\${routerBackup}`,
      }
    }
  }

  return null
}

function looksLikeRecoverableRouter(source) {
  return (
    source.includes("<Routes") &&
    source.includes("</Routes>") &&
    source.includes(
      'path="/admin/dashboard"'
    ) &&
    source.includes(
      "AdminDashboardPage"
    ) &&
    source.includes(
      "ProtectedRoute"
    )
  )
}

function createSafetyBackup() {
  fs.mkdirSync(
    BACKUP_ROOT,
    { recursive: true }
  )

  const dir =
    path.join(
      BACKUP_ROOT,
      `admin-themes-route-repair-v2-${timestamp()}`
    )

  fs.mkdirSync(
    dir,
    { recursive: true }
  )

  fs.copyFileSync(
    ROUTER,
    path.join(
      dir,
      "AppRoutes-BEFORE-REPAIR.jsx"
    )
  )

  return dir
}

function removeOnlyAdminThemesRoute(source) {
  /*
   * IMPORTANT:
   * Match starts ONLY when the current <Route> itself has
   * path="/admin/themes".
   *
   * It does NOT use a lookahead that can begin at /admin/dashboard.
   */

  const multiline =
    /[ \t]*<Route\s+path\s*=\s*["']\/admin\/themes["'][\s\S]*?<\/?Route\s*>[ \t]*\r?\n?/g

  const selfClosing =
    /[ \t]*<Route\s+path\s*=\s*["']\/admin\/themes["'][^>]*\/>[ \t]*\r?\n?/g

  let result =
    source.replace(
      multiline,
      ""
    )

  result =
    result.replace(
      selfClosing,
      ""
    )

  /*
   * Exact original one-line insertion from Phase 3.
   */
  result =
    result.replace(
      /^[ \t]*<Route path=["']\/admin\/themes["'] element=\{<AdminThemesPage \/>\} \/>[ \t]*\r?\n?/gm,
      ""
    )

  return result
}

function ensureAdminThemesImport(source) {
  /*
   * Remove all AdminThemesPage imports, then add exactly one.
   */
  source =
    source.replace(
      /^import\s+AdminThemesPage\s+from\s+["'][^"']+["']\s*;?\s*\r?\n?/gm,
      ""
    )

  const line =
    'import AdminThemesPage from "../../modules/admin/pages/AdminThemesPage.jsx"'

  const dashboardImport =
    source.match(
      /^import\s+AdminDashboardPage\s+from\s+["'][^"']+["']\s*;?\s*$/m
    )

  if (dashboardImport) {
    return source.replace(
      dashboardImport[0],
      `${dashboardImport[0]}\n${line}`
    )
  }

  const imports =
    [...source.matchAll(/^import .*$/gm)]

  if (!imports.length) {
    fail(
      "No encontré imports en AppRoutes.jsx."
    )
  }

  const last =
    imports[
      imports.length - 1
    ]

  const at =
    last.index +
    last[0].length

  return (
    source.slice(0, at) +
    "\n" +
    line +
    source.slice(at)
  )
}

function insertDirectAdminThemesRoute(source) {
  const closeIndex =
    source.lastIndexOf(
      "</Routes>"
    )

  if (closeIndex < 0) {
    fail(
      "No encontré </Routes>."
    )
  }

  const before =
    source.slice(
      0,
      closeIndex
    )

  const after =
    source.slice(
      closeIndex
    )

  /*
   * Insert before wildcard if it is a direct route near the end.
   */
  const wildcardRegex =
    /([ \t]*<Route\s+path\s*=\s*["']\*["'][\s\S]*?\/>\s*)$/m

  const canonicalRoute = `
      <Route
        path="/admin/themes"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminThemesPage />
          </ProtectedRoute>
        }
      />

`

  const wildcard =
    before.match(
      wildcardRegex
    )

  if (wildcard) {
    const index =
      wildcard.index

    return (
      before.slice(0, index) +
      canonicalRoute +
      before.slice(index) +
      after
    )
  }

  return (
    before.trimEnd() +
    "\n" +
    canonicalRoute +
    after
  )
}

function validateResult(source) {
  const routeCount =
    (
      source.match(
        /path\s*=\s*["']\/admin\/themes["']/g
      ) || []
    ).length

  if (routeCount !== 1) {
    fail(
      `Se esperaba una sola /admin/themes; encontradas: ${routeCount}`
    )
  }

  const importCount =
    (
      source.match(
        /import\s+AdminThemesPage\s+from/g
      ) || []
    ).length

  if (importCount !== 1) {
    fail(
      `Se esperaba un solo import de AdminThemesPage; encontrados: ${importCount}`
    )
  }

  const routesStart =
    source.indexOf("<Routes")

  const routesEnd =
    source.lastIndexOf(
      "</Routes>"
    )

  const themeRoute =
    source.indexOf(
      'path="/admin/themes"'
    )

  if (
    routesStart < 0 ||
    routesEnd < 0 ||
    themeRoute < routesStart ||
    themeRoute > routesEnd
  ) {
    fail(
      "/admin/themes no quedó dentro de <Routes>."
    )
  }

  const canonicalBlock =
    `<ProtectedRoute allowedRoles={["admin"]}>`

  if (
    !source.includes(
      canonicalBlock
    )
  ) {
    fail(
      "La ruta no quedó protegida solo para admin."
    )
  }

  /*
   * Detect obvious orphan fragments produced by the previous broken script.
   */
  const orphanPatterns = [
    /^\s*<\/ProtectedRoute>\s*$/m,
  ]

  /*
   * Do not reject normal closing ProtectedRoute lines globally because
   * valid multi-line routes have them. Instead verify that dashboard
   * route still exists intact.
   */
  if (
    !source.includes(
      'path="/admin/dashboard"'
    ) ||
    !source.includes(
      "<AdminDashboardPage />"
    )
  ) {
    fail(
      "La ruta /admin/dashboard no quedó intacta."
    )
  }

  console.log(
    "✅ Estructura final validada."
  )
}

function read(file) {
  return fs.readFileSync(
    file,
    "utf8"
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
