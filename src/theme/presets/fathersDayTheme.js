const basePath = "/themes/fathers-day/images"

export const fathersDayTheme = {
  themeKey: "fathers_day",
  name: "Día del Padre",
  source: "local-calendar",

  schedule: {
    type: "nth_weekday_of_month",
    month: 6,
    weekday: 0,
    occurrence: 3,
    label: "Tercer domingo de junio",
  },

  colors: {
    primary: "#D99A51",
    primaryDark: "#8A5C25",
    secondary: "#23344A",
    accent: "#F4C77A",
    background: "#08111F",
    surface: "#111B2C",
    surfaceSoft: "#18243B",
    border: "rgba(217,154,81,0.28)",
    text: "#FFFFFF",
    textMuted: "rgba(245,239,232,0.75)",
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
    homeMonumentUrl: "/themes/fathers-day/decorations/father-son.svg",
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

export default fathersDayTheme
