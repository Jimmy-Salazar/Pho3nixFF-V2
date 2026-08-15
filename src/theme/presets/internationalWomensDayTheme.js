const basePath = "/themes/international-womens-day/images"

export const internationalWomensDayTheme = {
  themeKey: "international_womens_day",
  name: "Día Internacional de la Mujer",
  source: "local-calendar",

  schedule: {
    type: "annual_date",
    month: 3,
    day: 8,
    label: "8 de marzo",
  },

  colors: {
    primary: "#C026D3",
    primaryDark: "#86198F",
    secondary: "#F472B6",
    accent: "#F9A8D4",
    background: "#120817",
    surface: "#1E0E26",
    surfaceSoft: "#2A1434",
    border: "rgba(244, 114, 182, 0.28)",
    text: "#FFFFFF",
    textMuted: "rgba(255, 245, 250, 0.74)",
  },
  radius: { card: "24px", button: "16px" },
  assets: {
    logoUrl: "/brand/pho3nix-logo.png",
    partnerLogoUrl: "/brand/lycan.png",
    loginImageUrl: `${basePath}/home-wide-02.webp`,
    homeImageUrl: `${basePath}/home-wide-01.webp`,
    dashboardImageUrl: `${basePath}/home-wide-02.webp`,
    homeBackgroundUrl: `${basePath}/home-wide-01.webp`,
    homeBackgroundMobileUrl: `${basePath}/home-mobile-01.webp`,
    homeMonumentUrl: "/themes/international-womens-day/decorations/womens-symbol.svg",
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

export default internationalWomensDayTheme
