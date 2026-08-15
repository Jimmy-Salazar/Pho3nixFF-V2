const basePath = "/themes/new-year/images"

export const newYearTheme = {
  themeKey: "new_year",
  name: "Año Nuevo",
  source: "local-calendar",

  schedule: {
    type: "annual_date",
    month: 1,
    day: 1,
    label: "1 de enero",
  },

  colors: {
    primary: "#F4B23F",
    primaryDark: "#B57A17",
    secondary: "#1D4ED8",
    accent: "#F59E0B",
    background: "#070C16",
    surface: "#101826",
    surfaceSoft: "#152135",
    border: "rgba(244,178,63,0.28)",
    text: "#FFFFFF",
    textMuted: "rgba(245,241,230,0.76)",
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
    homeMonumentUrl: "/themes/new-year/decorations/firework-burst.svg",
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

export default newYearTheme
