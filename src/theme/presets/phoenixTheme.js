export const phoenixTheme = {
  themeKey: "phoenix",
  name: "PHO3NIX Normal",
  source: "local",

  colors: {
    primary: "#F97316",
    primaryDark: "#C2410C",
    secondary: "#FB923C",
    accent: "#EF4444",
    background: "#050505",
    surface: "#0B0B0F",
    surfaceSoft: "#14141A",
    border: "rgba(249, 115, 22, 0.22)",
    text: "#FFFFFF",
    textMuted: "rgba(255, 255, 255, 0.62)",
  },

  radius: {
    card: "24px",
    button: "16px",
  },

  assets: {
    // Global brand assets: shared by all themes unless explicitly overridden.
    logoUrl: "/brand/pho3nix-logo.png",
    partnerLogoUrl: "/brand/lycan.png",

    // PHO3NIX base theme heroes.
    homeHeroUrl: "/themes/phoenix/images/home-hero.png",
    homeHeroMobileUrl: "/themes/phoenix/images/home-hero.png",
    loginHeroUrl: "/themes/phoenix/images/login-hero.png",
    dashboardHeroUrl: "/themes/phoenix/images/training-hero.png",
    dashboardWodUrl: "/themes/phoenix/images/training-hero.png",
    wodsHeroUrl: "/themes/phoenix/images/training-hero.png",
    prHeroUrl: "/themes/phoenix/images/training-hero.png",
    nutritionHeroUrl: "/themes/phoenix/images/training-hero.png",
    challengeHeroUrl: "/themes/phoenix/images/challenge-hero.png",

    // Legacy aliases kept so the current V2 screens continue working.
    loginImageUrl: "/themes/phoenix/images/login-hero.png",
    homeImageUrl: "/themes/phoenix/images/home-hero.png",
    dashboardImageUrl: "/themes/phoenix/images/training-hero.png",
    homeBackgroundUrl: "/themes/phoenix/images/home-hero.png",
    homeBackgroundMobileUrl: "/themes/phoenix/images/home-hero.png",

    // No Guayaquil/Julianas decoration belongs to the default theme.
    homeMonumentUrl: null,
    homeBrandWordUrl: null,
    homePartnerLogoUrl: "/brand/lycan.png",
  },
}

export default phoenixTheme
