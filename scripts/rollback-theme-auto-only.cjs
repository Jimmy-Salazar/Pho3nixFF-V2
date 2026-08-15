const fs = require("fs")
const path = require("path")

const ROOT = process.cwd()

const SRC = path.join(ROOT, "src")

const BACKUP_ROOT = path.join(
  ROOT,
  ".pho3nix-backups"
)

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

main()

function main() {
  if (!fs.existsSync(BACKUP_ROOT)) {
    fail("No existe .pho3nix-backups")
  }

  const backups =
    fs.readdirSync(
      BACKUP_ROOT,
      { withFileTypes: true }
    )
      .filter(
        (entry) =>
          entry.isDirectory() &&
          entry.name.startsWith(
            "theme-auto-only-"
          )
      )
      .map(
        (entry) => entry.name
      )
      .sort()
      .reverse()

  if (!backups.length) {
    fail(
      "No encontré backups theme-auto-only."
    )
  }

  const backupDir =
    path.join(
      BACKUP_ROOT,
      backups[0]
    )

  console.log("")
  console.log("PHO3NIX V2 — ROLLBACK AUTO-ONLY")
  console.log("================================")
  console.log("")

  const adminBackup = path.join(
    backupDir,
    "admin-themes"
  )

  const pageBackup = path.join(
    backupDir,
    "AdminThemesPage.jsx"
  )

  const runtimeBackup = path.join(
    backupDir,
    "themeRuntimeService.js"
  )

  if (
    !fs.existsSync(adminBackup) ||
    !fs.existsSync(pageBackup) ||
    !fs.existsSync(runtimeBackup)
  ) {
    fail(
      "El backup está incompleto."
    )
  }

  fs.rmSync(
    ADMIN_THEME,
    {
      recursive: true,
      force: true,
    }
  )

  fs.cpSync(
    adminBackup,
    ADMIN_THEME,
    { recursive: true }
  )

  fs.copyFileSync(
    pageBackup,
    ADMIN_PAGE
  )

  fs.copyFileSync(
    runtimeBackup,
    RUNTIME_SERVICE
  )

  console.log(
    `✅ Restaurado: ${backups[0]}`
  )
  console.log("")
}

function fail(message) {
  console.error(`❌ ${message}`)
  process.exit(1)
}
