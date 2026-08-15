const basePath = "/themes/carnival/images"

export const carnivalTheme = {
  themeKey: "carnival",
  name: "Carnaval",
  source: "local-calendar",

  schedule: {
    type: "easter_offset_range",
    startOffsetDays: -50,
    endOffsetDays: -47,
    label: "Carnaval — sábado a martes",
  },

  colors: {
    primary: "#FF4FB3",
    primaryDark: "#B32774",
    secondary: "#00C8C8",
    accent: "#FFB703",
    background: "#12061B",
    surface: "#1D0B29",
    surfaceSoft: "#2C1038",
    border: "rgba(255,79,179,.24)",
    text: "#FFFFFF",
    textMuted: "rgba(245,235,255,.76)",
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
    homeMonumentUrl: "/themes/carnival/decorations/carnival-mask.svg",
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

export default carnivalTheme
