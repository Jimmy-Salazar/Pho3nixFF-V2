const fs = require("fs")
const path = require("path")

const ROOT = process.cwd()
const BACKUP_ROOT =
  path.join(ROOT, ".pho3nix-backups")

const SRC_THEME =
  path.join(ROOT, "src", "theme")

const PLATFORM_ROOT =
  path.join(ROOT, "src", "platform")

main()

function main() {
  if (!fs.existsSync(BACKUP_ROOT)) {
    fail(
      "No existe .pho3nix-backups"
    )
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
            "theme-platform-"
          )
      )
      .map(
        (entry) =>
          entry.name
      )
      .sort()
      .reverse()

  if (!backups.length) {
    fail(
      "No encontré backups de theme-platform."
    )
  }

  const backupDir =
    path.join(
      BACKUP_ROOT,
      backups[0]
    )

  const metaFile =
    path.join(
      backupDir,
      "backup-meta.json"
    )

  if (!fs.existsSync(metaFile)) {
    fail(
      "Backup sin backup-meta.json."
    )
  }

  const meta =
    JSON.parse(
      fs.readFileSync(
        metaFile,
        "utf8"
      )
    )

  const themeBackup =
    path.join(
      backupDir,
      "theme"
    )

  if (!fs.existsSync(themeBackup)) {
    fail(
      "Backup sin carpeta theme."
    )
  }

  console.log("")
  console.log(
    "PHO3NIX V2 — ROLLBACK THEME PLATFORM ADAPTERS"
  )
  console.log(
    "=============================================="
  )
  console.log("")
  console.log(
    `Restaurando: ${backups[0]}`
  )

  fs.rmSync(
    SRC_THEME,
    {
      recursive: true,
      force: true,
    }
  )

  fs.cpSync(
    themeBackup,
    SRC_THEME,
    {
      recursive: true,
    }
  )

  if (meta.platformExisted) {
    const platformBackup =
      path.join(
        backupDir,
        "platform"
      )

    fs.rmSync(
      PLATFORM_ROOT,
      {
        recursive: true,
        force: true,
      }
    )

    if (
      fs.existsSync(platformBackup)
    ) {
      fs.cpSync(
        platformBackup,
        PLATFORM_ROOT,
        {
          recursive: true,
        }
      )
    }
  } else {
    fs.rmSync(
      PLATFORM_ROOT,
      {
        recursive: true,
        force: true,
      }
    )
  }

  console.log("")
  console.log("✅ ROLLBACK COMPLETADO")
  console.log("")
  console.log(
    "Reinicia Vite:"
  )
  console.log(
    "  npm run dev -- --host 0.0.0.0"
  )
  console.log("")
}

function fail(message) {
  console.error("")
  console.error(
    `❌ ${message}`
  )
  console.error("")
  process.exit(1)
}
