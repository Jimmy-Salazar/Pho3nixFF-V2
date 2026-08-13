import { supabase } from "../config/supabase.js"

export async function fetchActiveRemoteTheme() {
  if (!supabase) return null

  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from("app_themes")
    .select("*")
    .eq("is_active", true)
    .or(`start_date.is.null,start_date.lte.${today}`)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.warn("No se pudo cargar tema remoto. Se usará tema local:", error)
    return null
  }

  return data ? mapRemoteTheme(data) : null
}

function mapRemoteTheme(row) {
  return {
    themeKey: row.theme_key,
    name: row.name,
    source: "remote",
    colors: {
      primary: row.primary_color,
      primaryDark: row.primary_dark_color,
      secondary: row.secondary_color,
      accent: row.accent_color,
      background: row.background_color,
      surface: row.surface_color,
      surfaceSoft: row.surface_soft_color,
      border: row.border_color,
      text: row.text_color,
      textMuted: row.text_muted_color,
    },
    radius: {
      card: row.card_radius,
      button: row.button_radius,
    },
    assets: {
      // Marca global
      logoUrl: row.logo_url,
      partnerLogoUrl: row.partner_logo_url,

      // Imágenes generales
      loginImageUrl: row.login_image_url,
      homeImageUrl: row.home_image_url,
      dashboardImageUrl: row.dashboard_image_url,

      // Home del Box
      homeBackgroundUrl: row.home_background_url,
      homeBackgroundMobileUrl: row.home_background_mobile_url,
      homeMonumentUrl: row.home_monument_url,
      homeBrandWordUrl: row.home_brand_word_url,
      homePartnerLogoUrl: row.home_partner_logo_url || row.partner_logo_url,
    },
  }
}
