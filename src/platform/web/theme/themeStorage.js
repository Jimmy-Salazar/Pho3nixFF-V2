/*
 * PHO3NIX V2 — WEB THEME STORAGE ADAPTER
 *
 * Browser-only persistence.
 *
 * Future React Native implementation:
 *   AsyncStorage / SecureStore / filesystem cache.
 *
 * Domain/calendar logic must NOT be added here.
 */

const RUNTIME_CACHE_KEY =
  "phoenix:v2:theme-runtime-snapshot"

const THEME_VISUAL_CACHE_PREFIX =
  "phoenix:v2:theme-visual:"

export function readThemeRuntimeSnapshotCache() {
  const storage = getBrowserStorage()
  if (!storage) return null

  try {
    const raw =
      storage.getItem(RUNTIME_CACHE_KEY)

    if (!raw) return null

    const parsed = JSON.parse(raw)

    if (
      !parsed ||
      !Array.isArray(parsed.calendarEntries)
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function writeThemeRuntimeSnapshotCache(
  snapshot
) {
  const storage = getBrowserStorage()
  if (!storage || !snapshot) return

  try {
    storage.setItem(
      RUNTIME_CACHE_KEY,
      JSON.stringify(snapshot)
    )
  } catch {}
}

export function clearThemeRuntimeSnapshotCache() {
  const storage = getBrowserStorage()
  if (!storage) return

  try {
    storage.removeItem(RUNTIME_CACHE_KEY)
  } catch {}
}

export function readThemeVisualCache(themeKey) {
  const storage = getBrowserStorage()
  if (!storage) return null

  const key = normalizeThemeKey(themeKey)
  if (!key) return null

  try {
    const raw = storage.getItem(
      visualCacheKey(key)
    )

    if (!raw) return null

    const parsed = JSON.parse(raw)

    return normalizeThemeKey(
      parsed?.themeKey
    ) === key
      ? parsed
      : null
  } catch {
    return null
  }
}

export function writeThemeVisualCache(theme) {
  const storage = getBrowserStorage()
  if (!storage) return

  const key = normalizeThemeKey(
    theme?.themeKey
  )

  if (!key) return

  try {
    storage.setItem(
      visualCacheKey(key),
      JSON.stringify(theme)
    )
  } catch {}
}

export function clearThemeVisualCache(themeKey) {
  const storage = getBrowserStorage()
  if (!storage) return

  const key = normalizeThemeKey(themeKey)
  if (!key) return

  try {
    storage.removeItem(
      visualCacheKey(key)
    )
  } catch {}
}

function visualCacheKey(themeKey) {
  return `${THEME_VISUAL_CACHE_PREFIX}${themeKey}`
}

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return null
  }

  try {
    return window.localStorage || null
  } catch {
    return null
  }
}

function normalizeThemeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
}
