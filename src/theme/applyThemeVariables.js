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

  setImageVar(root, "--phx-logo-url", assets.logoUrl)
  setImageVar(root, "--phx-partner-logo-url", assets.partnerLogoUrl)
  setImageVar(root, "--phx-login-image-url", assets.loginImageUrl)
  setImageVar(root, "--phx-home-image-url", assets.homeImageUrl)
  setImageVar(root, "--phx-dashboard-image-url", assets.dashboardImageUrl)

  setImageVar(root, "--phx-home-background-url", assets.homeBackgroundUrl)
  setImageVar(root, "--phx-home-background-mobile-url", assets.homeBackgroundMobileUrl)
  setImageVar(root, "--phx-home-monument-url", assets.homeMonumentUrl)
  setImageVar(root, "--phx-home-brand-word-url", assets.homeBrandWordUrl)
  setImageVar(root, "--phx-home-partner-logo-url", assets.homePartnerLogoUrl || assets.partnerLogoUrl)

  root.dataset.themeKey = safeTheme.themeKey || defaultTheme.themeKey
}

function mergeWithDefaultTheme(theme) {
  return {
    ...defaultTheme,
    ...compactObject(theme || {}),
    colors: {
      ...defaultTheme.colors,
      ...compactObject(theme?.colors || {}),
    },
    radius: {
      ...defaultTheme.radius,
      ...compactObject(theme?.radius || {}),
    },
    assets: {
      ...defaultTheme.assets,
      ...compactObject(theme?.assets || {}),
    },
  }
}

function compactObject(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== null && value !== undefined && value !== "")
  )
}

function setCssVar(root, name, value) {
  if (!value) return
  root.style.setProperty(name, value)
}

function setImageVar(root, name, value) {
  const safeValue = value || ""
  root.style.setProperty(name, safeValue ? `url("${safeValue}")` : "none")
}
