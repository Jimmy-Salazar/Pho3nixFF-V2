import {
  readThemeVisualCache,
  writeThemeVisualCache,
} from "../platform/web/theme/themeStorage.js"

import {
  fetchActiveThemeVisualRemote,
  fetchThemeVisualByKeyRemote,
} from "../platform/web/theme/themeSync.js"

import {
  getAppTimeZone,
  getDateKeyInTimeZone,
} from "./timezone.js"

/*
 * Application-facing visual theme service.
 *
 * Browser storage + Supabase transport are delegated to:
 *   src/platform/web/theme/
 */

export async function fetchRemoteThemeByKey(
  themeKey
) {
  const key = normalizeThemeKey(themeKey)
  if (!key) return null

  const row =
    await fetchThemeVisualByKeyRemote(key)

  const theme =
    row ? mapRemoteTheme(row) : null

  if (theme) {
    writeThemeVisualCache(theme)
  }

  return theme
}

export function readCachedRemoteTheme(
  themeKey
) {
  return readThemeVisualCache(
    themeKey
  )
}

/*
 * Legacy method kept for compatibility with any existing imports.
 */
export async function fetchActiveRemoteTheme({
  date = new Date(),
  timeZone = getAppTimeZone(),
} = {}) {
  const today =
    getDateKeyInTimeZone(
      date,
      timeZone
    )

  const row =
    await fetchActiveThemeVisualRemote(
      today
    )

  return row
    ? mapRemoteTheme(row)
    : null
}

function mapRemoteTheme(row) {
  const homeHeroUrl =
    row.home_hero_url ||
    row.home_background_url ||
    row.home_image_url ||
    null

  const homeHeroMobileUrl =
    row.home_hero_mobile_url ||
    row.home_background_mobile_url ||
    homeHeroUrl

  const loginHeroUrl =
    row.login_hero_url ||
    row.login_image_url ||
    homeHeroUrl

  const dashboardHeroUrl =
    row.dashboard_hero_url ||
    row.dashboard_image_url ||
    homeHeroUrl

  const wodsHeroUrl =
    row.wods_hero_url ||
    dashboardHeroUrl

  const prHeroUrl =
    row.pr_hero_url ||
    dashboardHeroUrl

  const nutritionHeroUrl =
    row.nutrition_hero_url ||
    dashboardHeroUrl

  const challengeHeroUrl =
    row.challenge_hero_url ||
    dashboardHeroUrl

  const dashboardWodUrl =
    row.dashboard_wod_url ||
    wodsHeroUrl ||
    dashboardHeroUrl

  return {
    themeKey: row.theme_key,
    name: row.name,
    source: "remote",

    colors: {
      primary: row.primary_color,
      primaryDark:
        row.primary_dark_color,
      secondary:
        row.secondary_color,
      accent:
        row.accent_color,
      background:
        row.background_color,
      surface:
        row.surface_color,
      surfaceSoft:
        row.surface_soft_color,
      border:
        row.border_color,
      text:
        row.text_color,
      textMuted:
        row.text_muted_color,
    },

    radius: {
      card: row.card_radius,
      button: row.button_radius,
    },

    assets: {
      logoUrl:
        row.logo_url,

      partnerLogoUrl:
        row.partner_logo_url,

      homeHeroUrl,
      homeHeroMobileUrl,
      loginHeroUrl,
      dashboardHeroUrl,
      dashboardWodUrl,
      wodsHeroUrl,
      prHeroUrl,
      nutritionHeroUrl,
      challengeHeroUrl,

      loginImageUrl:
        row.login_image_url ||
        loginHeroUrl,

      homeImageUrl:
        row.home_image_url ||
        homeHeroUrl,

      dashboardImageUrl:
        row.dashboard_image_url ||
        dashboardHeroUrl,

      homeBackgroundUrl:
        row.home_background_url ||
        homeHeroUrl,

      homeBackgroundMobileUrl:
        row.home_background_mobile_url ||
        homeHeroMobileUrl,

      homeMonumentUrl:
        row.home_monument_url,

      homeBrandWordUrl:
        row.home_brand_word_url,

      homePartnerLogoUrl:
        row.home_partner_logo_url ||
        row.partner_logo_url,
    },
  }
}

function normalizeThemeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
}
