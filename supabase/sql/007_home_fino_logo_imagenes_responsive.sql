-- PHO3NIX V2 - Afinar Home: logo global, imágenes del tema y fondos responsive.
-- Ejecutar en Supabase SQL Editor.

alter table public.app_themes
  add column if not exists logo_url text null,
  add column if not exists partner_logo_url text null,
  add column if not exists home_background_url text null,
  add column if not exists home_background_mobile_url text null,
  add column if not exists home_monument_url text null,
  add column if not exists home_brand_word_url text null,
  add column if not exists home_partner_logo_url text null;

update public.app_themes
set
  is_active = true,
  priority = 100,
  logo_url = '/brand/pho3nix-logo.png',
  partner_logo_url = '/brand/lycan.png',
  home_background_url = '/themes/phoenix-guayaquil/images/home-guayaquil-wide-01.png',
  home_background_mobile_url = '/themes/phoenix-guayaquil/images/home-guayaquil-vertical-01.png',
  home_image_url = '/themes/phoenix-guayaquil/images/home-guayaquil-wide-01.png',
  login_image_url = '/themes/phoenix-guayaquil/images/home-guayaquil-wide-01.png',
  dashboard_image_url = '/themes/phoenix-guayaquil/images/home-guayaquil-wide-01.png',
  home_monument_url = '/themes/phoenix-guayaquil/guayaquil-monument.svg',
  home_brand_word_url = '/themes/phoenix-guayaquil/phoenix-wordmark-bg.svg',
  home_partner_logo_url = '/brand/lycan.png',
  updated_at = now()
where theme_key = 'phoenix-guayaquil';

update public.app_themes
set is_active = false,
    updated_at = now()
where theme_key <> 'phoenix-guayaquil';
