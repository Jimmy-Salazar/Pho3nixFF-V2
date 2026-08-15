const basePath = "/themes/quito-foundation/images"

export const quito_foundationTheme = {
  themeKey: "quito_foundation",
  name: "Fundación de Quito",
  source: "local-calendar",

  schedule: {
    type: "annual_date",
    month: 12,
    day: 6,
    label: "6 de diciembre",
  },

  colors: {
    primary: "#D62839",
    primaryDark: "#9C1D2B",
    secondary: "#1D4ED8",
    accent: "#E7EAF2",
    background: "#0D1118",
    surface: "#141A24",
    surfaceSoft: "#1E2633",
    border: "rgba(214,40,57,.28)",
    text: "#FFFFFF",
    textMuted: "rgba(232,236,245,.74)",
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
    homeMonumentUrl: "/themes/quito-foundation/decorations/quito-arches.svg",
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

export default quito_foundationTheme
