const basePath = "/themes/good-friday/images"

export const goodFridayTheme = {
  themeKey: "good_friday",
  name: "Viernes Santo",
  source: "local-calendar",

  schedule: {
    type: "easter_offset",
    offsetDays: -2,
    label: "Viernes Santo",
  },

  colors: {
    primary: "#7C2D12",
    primaryDark: "#431407",
    secondary: "#D97706",
    accent: "#F59E0B",
    background: "#120B07",
    surface: "#21140D",
    surfaceSoft: "#302017",
    border: "rgba(217, 119, 6, 0.28)",
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
    homeMonumentUrl: "/themes/good-friday/decorations/good-friday-cross.svg",
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

export default goodFridayTheme
