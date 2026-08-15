const basePath = "/themes/guayaquil-foundation/images"

export const guayaquilFoundationTheme = {
  themeKey: "guayaquil_foundation",
  name: "Fundación de Guayaquil",
  source: "local-calendar",

  schedule: {
    type: "annual_date",
    month: 7,
    day: 25,
    label: "25 de julio",
  },

  colors: {
    primary: "#22C1F1",
    primaryDark: "#0B79AA",
    secondary: "#F4C542",
    accent: "#FFFFFF",
    background: "#08111B",
    surface: "#102033",
    surfaceSoft: "#16304A",
    border: "rgba(34,193,241,0.28)",
    text: "#FFFFFF",
    textMuted: "rgba(237,246,255,0.76)",
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
    homeMonumentUrl: "/themes/guayaquil-foundation/decorations/malecon.svg",
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

export default guayaquilFoundationTheme
