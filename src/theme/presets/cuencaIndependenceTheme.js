const basePath = "/themes/cuenca-independence/images"

export const cuencaIndependenceTheme = {
  themeKey: "cuenca_independence",
  name: "Independencia de Cuenca",
  source: "local-calendar",

  schedule: {
    type: "annual_date",
    month: 11,
    day: 3,
    label: "3 de noviembre",
  },

  colors: {
    primary: "#C8102E",
    primaryDark: "#8E0B20",
    secondary: "#FFFFFF",
    accent: "#D4AF37",
    background: "#050505",
    surface: "#0D0D0D",
    surfaceSoft: "#171717",
    border: "rgba(200, 16, 46, 0.32)",
    text: "#FFFFFF",
    textMuted: "rgba(255, 255, 255, 0.68)",
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
    homeMonumentUrl: "/themes/cuenca-independence/decorations/cuenca-cathedral.svg",
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

export default cuencaIndependenceTheme
