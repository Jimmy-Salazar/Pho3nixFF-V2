import { defaultTheme } from "./themeDefaults.js"

export function applyThemeVariables(theme) {
  if (typeof document === "undefined") return

  const safeTheme = mergeWithDefaultTheme(theme)
  const root = document.documentElement
  const colors = safeTheme.colors || {}
  const radius = safeTheme.radius || {}
  const assets = safeTheme.assets || {}

  setCssVar(root, "--phx-color-primary", colors.primary)
  setCssVar(root, "--phx-color-primary-dark", colors.primaryDark)
  setCssVar(root, "--phx-color-secondary", colors.secondary)
  setCssVar(root, "--phx-color-accent", colors.accent)
  setCssVar(root, "--phx-color-background", colors.background)
  setCssVar(root, "--phx-color-surface", colors.surface)
  setCssVar(root, "--phx-color-surface-soft", colors.surfaceSoft)
  setCssVar(root, "--phx-color-border", colors.border)
  setCssVar(root, "--phx-color-text", colors.text)
  setCssVar(root, "--phx-color-text-muted", colors.textMuted)

  setCssVar(root, "--phx-radius-card", radius.card)
  setCssVar(root, "--phx-radius-button", radius.button)

  // Global brand.
  setImageVar(root, "--phx-logo-url", assets.logoUrl)
  setImageVar(root, "--phx-partner-logo-url", assets.partnerLogoUrl)

  // Resolve section-specific theme assets.
  const homeHero = firstDefined(
    assets.homeHeroUrl,
    assets.homeBackgroundUrl,
    assets.homeImageUrl
  )
  const homeHeroMobile = firstDefined(
    assets.homeHeroMobileUrl,
    assets.homeBackgroundMobileUrl,
    homeHero
  )
  const loginHero = firstDefined(
    assets.loginHeroUrl,
    assets.loginImageUrl,
    homeHero
  )
  const dashboardHero = firstDefined(
    assets.dashboardHeroUrl,
    assets.dashboardImageUrl,
    homeHero
  )
  const dashboardWod = firstDefined(
    assets.dashboardWodUrl,
    assets.wodsHeroUrl,
    dashboardHero
  )
  const wodsHero = firstDefined(
    assets.wodsHeroUrl,
    dashboardHero
  )
  const prHero = firstDefined(
    assets.prHeroUrl,
    dashboardHero
  )
  const nutritionHero = firstDefined(
    assets.nutritionHeroUrl,
    dashboardHero
  )
  const challengeHero = firstDefined(
    assets.challengeHeroUrl,
    dashboardHero
  )

  // New V2 variables: every relevant screen gets its own image channel.
  setImageVar(root, "--phx-home-hero-url", homeHero)
  setImageVar(root, "--phx-home-hero-mobile-url", homeHeroMobile)
  setImageVar(root, "--phx-login-hero-url", loginHero)
  setImageVar(root, "--phx-dashboard-hero-url", dashboardHero)
  setImageVar(root, "--phx-dashboard-wod-url", dashboardWod)
  setImageVar(root, "--phx-wods-hero-url", wodsHero)
  setImageVar(root, "--phx-pr-hero-url", prHero)
  setImageVar(root, "--phx-nutrition-hero-url", nutritionHero)
  setImageVar(root, "--phx-challenge-hero-url", challengeHero)

  // Legacy variables: preserve current V2 compatibility.
  setImageVar(root, "--phx-login-image-url", loginHero)
  setImageVar(root, "--phx-home-image-url", homeHero)
  setImageVar(root, "--phx-dashboard-image-url", dashboardHero)
  setImageVar(root, "--phx-home-background-url", homeHero)
  setImageVar(root, "--phx-home-background-mobile-url", homeHeroMobile)

  setImageVar(root, "--phx-home-monument-url", assets.homeMonumentUrl)
  setImageVar(root, "--phx-home-brand-word-url", assets.homeBrandWordUrl)
  setImageVar(
    root,
    "--phx-home-partner-logo-url",
    firstDefined(assets.homePartnerLogoUrl, assets.partnerLogoUrl)
  )

  root.dataset.themeKey = safeTheme.themeKey || defaultTheme.themeKey
}

function mergeWithDefaultTheme(theme) {
  return {
    ...defaultTheme,
    ...compactVisualObject(theme || {}),
    colors: {
      ...defaultTheme.colors,
      ...compactVisualObject(theme?.colors || {}),
    },
    radius: {
      ...defaultTheme.radius,
      ...compactVisualObject(theme?.radius || {}),
    },
    // For assets, null is meaningful: it explicitly means "none".
    assets: mergeAssets(defaultTheme.assets, theme?.assets),
  }
}

function compactVisualObject(object) {
  return Object.fromEntries(
    Object.entries(object).filter(
      ([, value]) => value !== null && value !== undefined && value !== ""
    )
  )
}

function mergeAssets(baseAssets = {}, nextAssets = {}) {
  const result = { ...baseAssets }

  for (const [key, value] of Object.entries(nextAssets || {})) {
    if (value !== undefined) {
      result[key] = value
    }
  }

  return result
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value
    }
  }
  return null
}

function setCssVar(root, name, value) {
  if (value === null || value === undefined || value === "") return
  root.style.setProperty(name, value)
}

function setImageVar(root, name, value) {
  if (value === null || value === undefined || value === "") {
    root.style.setProperty(name, "none")
    return
  }

  root.style.setProperty(name, `url("${String(value).replaceAll('"', '\\"')}")`)
}
