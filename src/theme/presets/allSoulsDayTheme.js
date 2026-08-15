const basePath = "/themes/all-souls-day/images"

export const allSoulsDayTheme = {
  themeKey: "all_souls_day",
  name: "Día de los Difuntos",
  source: "local-calendar",

  schedule: {
    type: "annual_date",
    month: 11,
    day: 2,
    label: "2 de noviembre",
  },

  colors: {
    primary: "#00B2D9",
    primaryDark: "#087C95",
    secondary: "#7FDBFF",
    accent: "#FF9800",
    background: "#05080B",
    surface: "#0A1117",
    surfaceSoft: "#101B23",
    border: "rgba(0, 178, 217, 0.30)",
    text: "#FFFFFF",
    textMuted: "rgba(230, 246, 250, 0.72)",
  },

  radius: {
    card: "24px",
    button: "16px",
  },

  assets: {
    logoUrl: "/brand/pho3nix-logo.png",
    partnerLogoUrl: "/brand/lycan.png",

    loginImageUrl: `${basePath}/home-wide-02.webp`,
    homeImageUrl: `${basePath}/home-wide-01.webp`,
    dashboardImageUrl: `${basePath}/home-wide-02.webp`,
    homeBackgroundUrl: `${basePath}/home-wide-01.webp`,
    homeBackgroundMobileUrl: `${basePath}/home-mobile-01.webp`,
    homeMonumentUrl: "/themes/all-souls-day/decorations/all-souls-cross.svg",
    homeBrandWordUrl: null,
    homePartnerLogoUrl: "/brand/lycan.png",

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

export default allSoulsDayTheme
