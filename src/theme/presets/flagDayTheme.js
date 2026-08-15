const basePath = "/themes/flag-day/images"

export const flagDayTheme = {
  themeKey: "flag_day",
  name: "Día de la Bandera del Ecuador",
  source: "local-calendar",

  schedule: {
    type: "annual_date",
    month: 9,
    day: 26,
    label: "26 de septiembre",
  },

  colors: {
    primary: "#F6C300",
    primaryDark: "#D19E00",
    secondary: "#0F49A8",
    accent: "#D82229",
    background: "#05070C",
    surface: "#0C1018",
    surfaceSoft: "#121926",
    border: "rgba(246, 195, 0, 0.30)",
    text: "#FFFFFF",
    textMuted: "rgba(255, 255, 255, 0.72)",
  },

  radius: {
    card: "24px",
    button: "16px",
  },

  assets: {
    logoUrl: "/brand/pho3nix-logo.png",
    partnerLogoUrl: "/brand/lycan.png",

    // Canales legacy.
    loginImageUrl: `${basePath}/home-wide-02.webp`,
    homeImageUrl: `${basePath}/home-wide-01.webp`,
    dashboardImageUrl: `${basePath}/home-wide-02.webp`,
    homeBackgroundUrl: `${basePath}/home-wide-01.webp`,
    homeBackgroundMobileUrl: `${basePath}/home-mobile-01.webp`,
    homeMonumentUrl: "/themes/flag-day/decorations/flag-ribbon.svg",
    homeBrandWordUrl: null,
    homePartnerLogoUrl: "/brand/lycan.png",

    // Canales del motor V2 por pantalla.
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

export default flagDayTheme
