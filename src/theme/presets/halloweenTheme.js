const basePath = "/themes/halloween/images"

export const halloweenTheme = {
  themeKey: "halloween",
  name: "Halloween",
  source: "local-calendar",

  schedule: {
    type: "annual_date",
    month: 10,
    day: 31,
    label: "31 de octubre",
  },

  colors: {
    primary: "#6C3CE6",
    primaryDark: "#43218E",
    secondary: "#FF8A00",
    accent: "#FF8A00",
    background: "#050308",
    surface: "#0D0912",
    surfaceSoft: "#171020",
    border: "rgba(108, 60, 230, 0.34)",
    text: "#FFFFFF",
    textMuted: "rgba(244, 238, 255, 0.70)",
  },

  radius: {
    card: "24px",
    button: "16px",
  },

  assets: {
    logoUrl: "/brand/pho3nix-logo.png",
    partnerLogoUrl: "/brand/lycan.png",

    // Legacy compatibility channels.
    loginImageUrl: `${basePath}/home-wide-02.webp`,
    homeImageUrl: `${basePath}/home-wide-01.webp`,
    dashboardImageUrl: `${basePath}/home-wide-02.webp`,
    homeBackgroundUrl: `${basePath}/home-wide-01.webp`,
    homeBackgroundMobileUrl: `${basePath}/home-mobile-01.webp`,
    homeMonumentUrl: "/themes/halloween/decorations/halloween-bats.svg",
    homeBrandWordUrl: null,
    homePartnerLogoUrl: "/brand/lycan.png",

    // PHO3NIX V2 screen-specific channels.
    homeHeroUrl: `${basePath}/home-wide-01.webp`,
    homeHeroMobileUrl: `${basePath}/home-mobile-01.webp`,
    loginHeroUrl: `${basePath}/home-wide-02.webp`,
    dashboardHeroUrl: `${basePath}/home-wide-02.webp`,
    dashboardWodUrl: `${basePath}/home-wide-02.webp`,
    wodsHeroUrl: `${basePath}/home-wide-02.webp`,
    prHeroUrl: `${basePath}/home-wide-02.webp`,
    nutritionHeroUrl: `${basePath}/home-wide-01.webp`,
    challengeHeroUrl: `${basePath}/home-wide-01.webp`,
  },
}

export default halloweenTheme
