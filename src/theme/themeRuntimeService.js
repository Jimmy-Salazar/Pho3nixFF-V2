import {
  readThemeRuntimeSnapshotCache,
  writeThemeRuntimeSnapshotCache,
} from "../platform/web/theme/themeStorage.js"

import {
  fetchThemeRuntimeSnapshotRemote,
  subscribeThemeRuntimeRemote,
} from "../platform/web/theme/themeSync.js"

const DEFAULT_TIME_ZONE =
  "America/Guayaquil"

const AUTO_ONLY_MODE = "auto"

/*
 * PHO3NIX V2 — PRODUCTION AUTO-ONLY
 *
 * The holiday calendar is the production authority.
 * Remote runtime rows may still provide timezone/revision,
 * but a stale manual mode can never force a production theme.
 */

export function getDefaultThemeRuntimeConfig() {
  return {
    mode: AUTO_ONLY_MODE,
    manualThemeKey: null,
    timeZone: DEFAULT_TIME_ZONE,
    revision: 1,
  }
}

export async function fetchThemeRuntimeSnapshot() {
  try {
    const remote =
      await fetchThemeRuntimeSnapshotRemote()

    const snapshot = {
      runtimeConfig:
        mapAutoOnlyRuntimeConfig(
          remote.runtimeRow
        ),

      calendarEntries:
        (remote.calendarRows || [])
          .map(mapCalendarEntry),

      fetchedAt:
        remote.fetchedAt ||
        new Date().toISOString(),

      source: "remote",
    }

    writeThemeRuntimeSnapshotCache(
      snapshot
    )

    return snapshot
  } catch (error) {
    const cached =
      readCachedThemeRuntimeSnapshot()

    if (cached) {
      return cached
    }

    throw error
  }
}

export function readCachedThemeRuntimeSnapshot() {
  const parsed =
    readThemeRuntimeSnapshotCache()

  if (!parsed) return null

  return {
    ...parsed,

    runtimeConfig:
      normalizeAutoOnlyRuntimeConfig(
        parsed.runtimeConfig
      ),

    source: "cache",
  }
}

export function subscribeThemeRuntimeChanges(
  onChange
) {
  return subscribeThemeRuntimeRemote(
    onChange
  )
}

function mapAutoOnlyRuntimeConfig(row) {
  return {
    mode: AUTO_ONLY_MODE,

    manualThemeKey:
      null,

    timeZone:
      String(
        row?.timezone ||
        DEFAULT_TIME_ZONE
      ),

    revision:
      Number(
        row?.revision ||
        1
      ),

    updatedAt:
      row?.updated_at ||
      null,
  }
}

function normalizeAutoOnlyRuntimeConfig(
  runtime
) {
  return {
    ...getDefaultThemeRuntimeConfig(),
    ...(runtime || {}),

    mode:
      AUTO_ONLY_MODE,

    manualThemeKey:
      null,

    timeZone:
      String(
        runtime?.timeZone ||
        DEFAULT_TIME_ZONE
      ),
  }
}

function mapCalendarEntry(row) {
  return {
    themeKey:
      normalizeThemeKey(
        row.theme_key
      ),

    enabled:
      row.enabled !== false,

    priority:
      Number(
        row.priority || 0
      ),

    rule:
      row.rule &&
      typeof row.rule === "object"
        ? row.rule
        : {},

    updatedAt:
      row.updated_at || null,
  }
}

function normalizeThemeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
}
