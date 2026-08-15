const basePath = "/themes/battle-of-pichincha/images"

export const battleOfPichinchaTheme = {
  themeKey: "battle_of_pichincha",
  name: "Batalla de Pichincha",
  source: "local-calendar",

  schedule: {
    type: "annual_date",
    month: 5,
    day: 24,
    label: "24 de mayo",
  },

  colors: {
    primary: "#F4C542",
    primaryDark: "#C68A16",
    secondary: "#0D3B8E",
    accent: "#C62828",
    background: "#100D08",
    surface: "#1D170E",
    surfaceSoft: "#292014",
    border: "rgba(244, 197, 66, 0.28)",
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
    homeMonumentUrl: "/themes/battle-of-pichincha/decorations/pichincha-mountain.svg",
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

export default battleOfPichinchaTheme
