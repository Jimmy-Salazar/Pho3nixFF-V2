import { supabase } from "../../../config/supabase.js"

/*
 * PHO3NIX V2 — WEB THEME SYNC ADAPTER
 *
 * Network/Realtime implementation used by the Web client.
 *
 * Future mobile adapter must expose the same conceptual operations,
 * while the shared Theme Engine remains unchanged.
 */

export async function fetchThemeRuntimeSnapshotRemote() {
  requireSupabase()

  const [runtimeResult, calendarResult] =
    await Promise.all([
      supabase
        .from("app_theme_runtime")
        .select(
          "config_key, mode, manual_theme_key, timezone, revision, updated_at"
        )
        .eq("config_key", "global")
        .maybeSingle(),

      supabase
        .from("app_theme_calendar")
        .select(
          "theme_key, enabled, priority, rule, updated_at"
        )
        .eq("enabled", true)
        .order("priority", {
          ascending: false,
        })
        .order("theme_key", {
          ascending: true,
        }),
    ])

  if (runtimeResult.error) {
    throw runtimeResult.error
  }

  if (calendarResult.error) {
    throw calendarResult.error
  }

  return {
    runtimeRow: runtimeResult.data || null,
    calendarRows: calendarResult.data || [],
    fetchedAt: new Date().toISOString(),
    source: "remote",
  }
}

export async function fetchThemeVisualByKeyRemote(
  themeKey
) {
  if (!supabase) return null

  const key = normalizeThemeKey(themeKey)
  if (!key) return null

  const { data, error } = await supabase
    .from("app_themes")
    .select("*")
    .eq("theme_key", key)
    .order("is_active", {
      ascending: false,
    })
    .order("priority", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle()

  if (error) throw error

  return data || null
}

export async function fetchActiveThemeVisualRemote(
  dateKey
) {
  if (!supabase) return null

  const day = String(dateKey || "").trim()
  if (!day) return null

  const { data, error } = await supabase
    .from("app_themes")
    .select("*")
    .eq("is_active", true)
    .or(
      `start_date.is.null,start_date.lte.${day}`
    )
    .or(
      `end_date.is.null,end_date.gte.${day}`
    )
    .order("priority", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle()

  if (error) throw error

  return data || null
}

export function subscribeThemeRuntimeRemote(
  onChange
) {
  if (
    !supabase?.channel ||
    typeof onChange !== "function"
  ) {
    return () => {}
  }

  const channel = supabase
    .channel("pho3nix-v2-theme-runtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "app_theme_runtime",
      },
      () => onChange("runtime")
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "app_theme_calendar",
      },
      () => onChange("calendar")
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "app_themes",
      },
      () => onChange("theme")
    )
    .subscribe()

  return () => {
    try {
      supabase.removeChannel(channel)
    } catch {}
  }
}

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase no está disponible."
    )
  }
}

function normalizeThemeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
}
