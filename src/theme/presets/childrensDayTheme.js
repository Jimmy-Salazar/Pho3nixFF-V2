const basePath = "/themes/childrens-day/images"

export const childrensDayTheme = {
  themeKey: "childrens_day",
  name: "Día del Niño",
  source: "local-calendar",

  schedule: {
    type: "annual_date",
    month: 6,
    day: 1,
    label: "1 de junio",
  },

  colors: {
    primary: "#FBBF24",
    primaryDark: "#D97706",
    secondary: "#22C1F1",
    accent: "#FB7185",
    background: "#07111E",
    surface: "#101D2D",
    surfaceSoft: "#15263A",
    border: "rgba(34,193,241,0.28)",
    text: "#FFFFFF",
    textMuted: "rgba(240,248,255,0.76)",
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
    homeMonumentUrl: "/themes/childrens-day/decorations/balloons.svg",
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

export default childrensDayTheme
