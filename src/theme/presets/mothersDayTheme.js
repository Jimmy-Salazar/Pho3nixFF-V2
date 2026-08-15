const basePath = "/themes/mothers-day/images"

export const mothersDayTheme = {
  themeKey: "mothers_day",
  name: "Día de la Madre",
  source: "local-calendar",

  schedule: {
    type: "nth_weekday_of_month",
    month: 5,
    weekday: 0,
    occurrence: 2,
    label: "Segundo domingo de mayo",
  },

  colors: {
    primary: "#DB2777",
    primaryDark: "#9D174D",
    secondary: "#FB7185",
    accent: "#FDA4AF",
    background: "#150A10",
    surface: "#241019",
    surfaceSoft: "#321722",
    border: "rgba(251, 113, 133, 0.28)",
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
    homeMonumentUrl: "/themes/mothers-day/decorations/mothers-heart.svg",
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

export default mothersDayTheme
