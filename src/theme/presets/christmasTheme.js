const basePath = "/themes/christmas/images"

export const christmasTheme = {
  themeKey: "christmas",
  name: "Navidad",
  source: "local-calendar",

  schedule: {
    type: "annual_range",
    startMonth: 12,
    startDay: 21,
    endMonth: 12,
    endDay: 28,
    label: "21–28 de diciembre",
  },

  colors: {
    primary: "#C62828",
    primaryDark: "#8E1D1D",
    secondary: "#2E7D32",
    accent: "#FF9800",
    background: "#1A0E08",
    surface: "#25140D",
    surfaceSoft: "#322017",
    border: "rgba(255, 193, 7, 0.26)",
    text: "#FFFFFF",
    textMuted: "rgba(255, 245, 232, 0.74)",
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
    homeMonumentUrl: "/themes/christmas/decorations/christmas-gift.svg",
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

export default christmasTheme
