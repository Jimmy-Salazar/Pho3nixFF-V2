export const DEFAULT_THEME_KEY = "phoenix-guayaquil"

export const defaultTheme = {
  themeKey: DEFAULT_THEME_KEY,
  name: "PHO3NIX Guayaquil",
  source: "local",
  colors: {
    primary: "#21c7ff",
    primaryDark: "#0284c7",
    secondary: "#f0d37a",
    accent: "#1d7cff",
    background: "#020817",
    surface: "#07111f",
    surfaceSoft: "#0b1b2f",
    border: "rgba(33, 199, 255, 0.36)",
    text: "#ffffff",
    textMuted: "rgba(255, 255, 255, 0.68)",
  },
  radius: {
    card: "24px",
    button: "16px",
  },
  assets: {
    // Logo global reutilizable. No pertenece a un tema específico.
    logoUrl: "/brand/pho3nix-logo.png",
    partnerLogoUrl: "/brand/lycan.png",

    // Imágenes generales del tema actual.
    loginImageUrl: "/themes/phoenix-guayaquil/images/home-guayaquil-wide-01.png",
    homeImageUrl: "/themes/phoenix-guayaquil/images/home-guayaquil-wide-01.png",
    dashboardImageUrl: "/themes/phoenix-guayaquil/images/home-guayaquil-wide-01.png",

    // Home del Box.
    homeBackgroundUrl: "/themes/phoenix-guayaquil/images/home-guayaquil-wide-01.png",
    homeBackgroundMobileUrl: "/themes/phoenix-guayaquil/images/home-guayaquil-vertical-01.png",

    // Decoración específica del tema Guayaquil.
    homeMonumentUrl: "/themes/phoenix-guayaquil/guayaquil-monument.svg",
    homeBrandWordUrl: "/themes/phoenix-guayaquil/phoenix-wordmark-bg.svg",
    homePartnerLogoUrl: "/brand/lycan.png",
  },
}
