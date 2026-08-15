const fs = require("fs")
const path = require("path")

const ROOT = process.cwd()
const BACKUP_ROOT = path.join(ROOT, ".pho3nix-backups")
const SRC_THEME = path.join(ROOT, "src", "theme")
const SHARED_THEME = path.join(ROOT, "src", "shared", "theme")

main()

function main() {
  if (!fs.existsSync(BACKUP_ROOT)) {
    fail("No existe .pho3nix-backups")
  }

  const backups = fs
    .readdirSync(BACKUP_ROOT, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        entry.name.startsWith("theme-engine-")
    )
    .map((entry) => entry.name)
    .sort()
    .reverse()

  if (!backups.length) {
    fail("No encontré backups de theme-engine.")
  }

  const backupDir = path.join(
    BACKUP_ROOT,
    backups[0]
  )

  const metaFile = path.join(
    backupDir,
    "backup-meta.json"
  )

  if (!fs.existsSync(metaFile)) {
    fail("El backup no contiene backup-meta.json.")
  }

  const meta = JSON.parse(
    fs.readFileSync(metaFile, "utf8")
  )

  const themeBackup = path.join(
    backupDir,
    "theme"
  )

  if (!fs.existsSync(themeBackup)) {
    fail("El backup no contiene src/theme.")
  }

  console.log("")
  console.log("PHO3NIX V2 — ROLLBACK SHARED THEME ENGINE")
  console.log("==========================================")
  console.log("")
  console.log(`Restaurando: ${backups[0]}`)

  fs.rmSync(SRC_THEME, {
    recursive: true,
    force: true,
  })

  fs.cpSync(
    themeBackup,
    SRC_THEME,
    { recursive: true }
  )

  if (meta.sharedThemeExisted) {
    const sharedBackup = path.join(
      backupDir,
      "shared-theme"
    )

    fs.rmSync(SHARED_THEME, {
      recursive: true,
      force: true,
    })

    if (fs.existsSync(sharedBackup)) {
      fs.cpSync(
        sharedBackup,
        SHARED_THEME,
        { recursive: true }
      )
    }
  } else {
    fs.rmSync(SHARED_THEME, {
      recursive: true,
      force: true,
    })
  }

  console.log("")
  console.log("✅ ROLLBACK COMPLETADO")
  console.log("")
  console.log("Reinicia Vite:")
  console.log("  npm run dev -- --host 0.0.0.0")
  console.log("")
}

function fail(message) {
  console.error("")
  console.error(`❌ ${message}`)
  console.error("")
  process.exit(1)
}
