export const valentinesDayTheme = {
  themeKey: "valentines_day",
  name: "PHO3NIX Valentine's",
  source: "local",

  colors: {
    primary: "#FF4F87",
    primaryDark: "#D81B60",
    secondary: "#FF6B6B",
    accent: "#F7C6D9",
    background: "#080B16",
    surface: "#171122",
    surfaceSoft: "#22152D",
    border: "rgba(255, 79, 135, 0.35)",
    text: "#FFFFFF",
    textMuted: "rgba(255, 255, 255, 0.70)",
  },

  radius: {
    card: "24px",
    button: "16px",
  },

  assets: {
    // Brand stays global.
    logoUrl: "/brand/pho3nix-logo.png",
    partnerLogoUrl: "/brand/lycan.png",

    // Approved Valentine images.
    homeHeroUrl: "/themes/valentines-day/images/home-wide-01.webp",
    homeHeroMobileUrl: "/themes/valentines-day/images/home-mobile-01.webp",
    loginHeroUrl: "/themes/valentines-day/images/home-wide-02.webp",

    // Each functional section can change independently with the theme.
    dashboardHeroUrl: "/themes/valentines-day/images/home-wide-01.webp",
    dashboardWodUrl: "/themes/valentines-day/images/home-wide-02.webp",
    wodsHeroUrl: "/themes/valentines-day/images/home-wide-02.webp",
    prHeroUrl: "/themes/valentines-day/images/home-wide-01.webp",
    nutritionHeroUrl: "/themes/valentines-day/images/home-wide-02.webp",
    challengeHeroUrl: "/themes/valentines-day/images/home-wide-02.webp",

    // Legacy aliases.
    loginImageUrl: "/themes/valentines-day/images/home-wide-02.webp",
    homeImageUrl: "/themes/valentines-day/images/home-wide-01.webp",
    dashboardImageUrl: "/themes/valentines-day/images/home-wide-01.webp",
    homeBackgroundUrl: "/themes/valentines-day/images/home-wide-01.webp",
    homeBackgroundMobileUrl: "/themes/valentines-day/images/home-mobile-01.webp",

    // Explicitly remove Guayaquil/Julianas decorative assets.
    homeMonumentUrl: null,
    homeBrandWordUrl: null,
    homePartnerLogoUrl: "/brand/lycan.png",
  },
}

export default valentinesDayTheme
