const basePath = "/themes/first-cry-independence/images"

export const firstCryOfIndependenceTheme = {
  themeKey: "first_cry_of_independence",
  name: "10 de Agosto",
  source: "local-calendar",

  schedule: {
    type: "annual_date",
    month: 8,
    day: 10,
    label: "10 de agosto",
  },

  colors: {
    primary: "#F4C542",
    primaryDark: "#C78F17",
    secondary: "#0D3B8E",
    accent: "#C62828",
    background: "#110C08",
    surface: "#1C130D",
    surfaceSoft: "#261A12",
    border: "rgba(244,197,66,.28)",
    text: "#FFFFFF",
    textMuted: "rgba(255,245,232,.74)",
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
    homeMonumentUrl: "/themes/first-cry-independence/decorations/flag-ribbon.svg",
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

export default firstCryOfIndependenceTheme
