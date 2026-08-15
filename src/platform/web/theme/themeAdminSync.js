import {
  supabase,
} from "../../../config/supabase.js"

/*
 * Admin-only write transport.
 *
 * Supabase RLS remains the authority.
 * This file does NOT bypass security.
 */

export async function updateThemeRuntimeModeRemote({
  mode,
  manualThemeKey = null,
  revision = 1,
} = {}) {
  requireSupabase()

  const safeMode =
    mode === "manual"
      ? "manual"
      : "auto"

  const safeThemeKey =
    safeMode === "manual"
      ? normalizeThemeKey(
          manualThemeKey
        )
      : null

  const nextRevision =
    Number(revision || 0) + 1

  const {
    data,
    error,
  } = await supabase
    .from("app_theme_runtime")
    .update({
      mode: safeMode,
      manual_theme_key:
        safeThemeKey,
      revision:
        nextRevision,
      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "config_key",
      "global"
    )
    .select(
      "config_key, mode, manual_theme_key, timezone, revision, updated_at"
    )
    .single()

  if (error) throw error

  return data
}

export async function updateThemeCalendarEnabledRemote({
  themeKey,
  enabled,
} = {}) {
  requireSupabase()

  const key =
    normalizeThemeKey(themeKey)

  if (!key) {
    throw new Error(
      "themeKey es requerido."
    )
  }

  const {
    data,
    error,
  } = await supabase
    .from("app_theme_calendar")
    .update({
      enabled:
        Boolean(enabled),
      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "theme_key",
      key
    )
    .select(
      "theme_key, enabled, priority, rule, updated_at"
    )
    .single()

  if (error) throw error

  return data
}

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase no está disponible."
    )
  }
}

function normalizeThemeKey(value) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase()
}
