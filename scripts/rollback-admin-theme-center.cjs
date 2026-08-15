const fs = require("fs")
const path = require("path")

const ROOT = process.cwd()
const SRC = path.join(ROOT, "src")

const BACKUP_ROOT =
  path.join(ROOT, ".pho3nix-backups")

const ADMIN_ROOT =
  path.join(
    SRC,
    "modules",
    "admin"
  )

const PLATFORM_WEB_THEME =
  path.join(
    SRC,
    "platform",
    "web",
    "theme"
  )

const SHARED_THEME =
  path.join(
    SRC,
    "shared",
    "theme"
  )

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
            "admin-theme-center-"
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
      "No encontré backups de Admin Theme Center."
    )
  }

  const backupDir =
    path.join(
      BACKUP_ROOT,
      backups[0]
    )

  const meta =
    JSON.parse(
      fs.readFileSync(
        path.join(
          backupDir,
          "backup-meta.json"
        ),
        "utf8"
      )
    )

  console.log("")
  console.log(
    "PHO3NIX V2 — ROLLBACK ADMIN THEME CENTER"
  )
  console.log(
    "========================================="
  )
  console.log("")
  console.log(
    `Restaurando: ${backups[0]}`
  )

  restoreDirectory(
    path.join(
      backupDir,
      "admin"
    ),
    ADMIN_ROOT
  )

  restoreDirectory(
    path.join(
      backupDir,
      "platform-web-theme"
    ),
    PLATFORM_WEB_THEME
  )

  restoreDirectory(
    path.join(
      backupDir,
      "shared-theme"
    ),
    SHARED_THEME
  )

  if (meta.routerFile) {
    const routerTarget =
      path.join(
        ROOT,
        meta.routerFile
      )

    const original =
      findRouterBackup(
        backupDir
      )

    if (original) {
      fs.copyFileSync(
        original,
        routerTarget
      )
    }
  }

  console.log("")
  console.log(
    "✅ ROLLBACK COMPLETADO"
  )
  console.log("")
  console.log(
    "Reinicia Vite:"
  )
  console.log(
    "  npm run dev -- --host 0.0.0.0"
  )
  console.log("")
}

function restoreDirectory(
  backup,
  target
) {
  if (!fs.existsSync(backup)) {
    return
  }

  fs.rmSync(
    target,
    {
      recursive: true,
      force: true,
    }
  )

  fs.cpSync(
    backup,
    target,
    { recursive: true }
  )
}

function findRouterBackup(
  backupDir
) {
  const files =
    fs.readdirSync(
      backupDir
    )

  const name =
    files.find(
      (file) =>
        file.startsWith(
          "router-original."
        )
    )

  return name
    ? path.join(
        backupDir,
        name
      )
    : null
}

function fail(message) {
  console.error("")
  console.error(
    `❌ ${message}`
  )
  console.error("")
  process.exit(1)
}
