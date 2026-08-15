const fs = require("fs")
const path = require("path")

const ROOT = process.cwd()

const BACKUP_ROOT = path.join(
  ROOT,
  ".pho3nix-backups"
)

const ROUTER = path.join(
  ROOT,
  "src",
  "app",
  "routes",
  "AppRoutes.jsx"
)

main()

function main() {
  if (!fs.existsSync(BACKUP_ROOT)) {
    fail("No existe .pho3nix-backups")
  }

  const backups = fs
    .readdirSync(
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
    .map((entry) => entry.name)
    .sort()
    .reverse()

  if (!backups.length) {
    fail(
      "No encontré backup de admin-themes-route-fix."
    )
  }

  const backupDir = path.join(
    BACKUP_ROOT,
    backups[0]
  )

  const backupFile = path.join(
    backupDir,
    "AppRoutes.jsx"
  )

  if (!fs.existsSync(backupFile)) {
    fail(
      "El backup no contiene AppRoutes.jsx."
    )
  }

  fs.copyFileSync(
    backupFile,
    ROUTER
  )

  console.log("")
  console.log("✅ AppRoutes.jsx restaurado")
  console.log("")
}

function fail(message) {
  console.error(`❌ ${message}`)
  process.exit(1)
}
