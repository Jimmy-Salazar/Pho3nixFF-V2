const basePath = "/themes/year-end/images"

export const yearEndTheme = {
  themeKey: "year_end",
  name: "Fin de Año",
  source: "local-calendar",

  schedule: {
    type: "annual_range",
    startMonth: 12,
    startDay: 29,
    endMonth: 12,
    endDay: 31,
    label: "29–31 de diciembre",
  },

  colors: {
    primary: "#F4C542",
    primaryDark: "#C49415",
    secondary: "#FFFFFF",
    accent: "#FF8C00",
    background: "#05070B",
    surface: "#0F1319",
    surfaceSoft: "#171C23",
    border: "rgba(244, 197, 66, 0.30)",
    text: "#FFFFFF",
    textMuted: "rgba(245, 245, 245, 0.74)",
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
    homeMonumentUrl: "/themes/year-end/decorations/year-end-fireworks.svg",
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

export default yearEndTheme
