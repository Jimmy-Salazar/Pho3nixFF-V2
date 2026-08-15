const basePath = "/themes/guayaquil-independence/images"

export const guayaquilIndependenceTheme = {
  themeKey: "guayaquil_independence",
  name: "Independencia de Guayaquil",
  source: "local-calendar",

  schedule: {
    type: "annual_date",
    month: 10,
    day: 9,
    label: "9 de octubre",
  },

  colors: {
    primary: "#39BCEB",
    primaryDark: "#0B6D9C",
    secondary: "#F8FCFF",
    accent: "#F2C14E",
    background: "#020814",
    surface: "#07111F",
    surfaceSoft: "#0B1B2E",
    border: "rgba(57, 188, 235, 0.30)",
    text: "#FFFFFF",
    textMuted: "rgba(232, 247, 255, 0.74)",
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
    homeMonumentUrl:
      "/themes/guayaquil-independence/decorations/guayaquil-stars.svg",
    homeBrandWordUrl: null,
    homePartnerLogoUrl: "/brand/lycan.png",

    // V2 screen-specific channels.
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

export default guayaquilIndependenceTheme
