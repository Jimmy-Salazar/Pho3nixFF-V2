const basePath = "/themes/labor-day/images"

export const laborDayTheme = {
  themeKey: "labor_day",
  name: "Día del Trabajo",
  source: "local-calendar",

  schedule: {
    type: "annual_date",
    month: 5,
    day: 1,
    label: "1 de mayo",
  },

  colors: {
    primary: "#DC2626",
    primaryDark: "#991B1B",
    secondary: "#F97316",
    accent: "#FBBF24",
    background: "#110A07",
    surface: "#1E120D",
    surfaceSoft: "#2B1A12",
    border: "rgba(249, 115, 22, 0.28)",
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
    homeMonumentUrl: "/themes/labor-day/decorations/labor-gear.svg",
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

export default laborDayTheme
