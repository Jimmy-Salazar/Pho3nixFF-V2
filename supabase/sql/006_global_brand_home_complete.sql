-- PHO3NIX V2 - Corrección completa: logo global + Home Guayaquil + responsive móvil
-- Ejecutar en Supabase SQL Editor. Es seguro ejecutarlo varias veces.

create table if not exists public.app_themes (
  id bigserial primary key,
  theme_key text not null unique,
  name text not null,
  is_active boolean not null default false,
  priority integer not null default 0,

  primary_color text null,
  primary_dark_color text null,
  secondary_color text null,
  accent_color text null,
  background_color text null,
  surface_color text null,
  surface_soft_color text null,
  border_color text null,
  text_color text null,
  text_muted_color text null,

  logo_url text null,
  partner_logo_url text null,
  login_image_url text null,
  home_image_url text null,
  dashboard_image_url text null,
  home_background_url text null,
  home_background_mobile_url text null,
  home_monument_url text null,
  home_brand_word_url text null,
  home_partner_logo_url text null,

  card_radius text null,
  button_radius text null,
  start_date date null,
  end_date date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_themes
  add column if not exists partner_logo_url text null,
  add column if not exists home_background_mobile_url text null,
  add column if not exists home_background_url text null,
  add column if not exists home_monument_url text null,
  add column if not exists home_brand_word_url text null,
  add column if not exists home_partner_logo_url text null,
  add column if not exists card_radius text null,
  add column if not exists button_radius text null,
  add column if not exists start_date date null,
  add column if not exists end_date date null;

insert into public.app_themes (
  theme_key,
  name,
  is_active,
  priority,
  primary_color,
  primary_dark_color,
  secondary_color,
  accent_color,
  background_color,
  surface_color,
  surface_soft_color,
  border_color,
  text_color,
  text_muted_color,
  logo_url,
  partner_logo_url,
  login_image_url,
  home_image_url,
  dashboard_image_url,
  home_background_url,
  home_background_mobile_url,
  home_monument_url,
  home_brand_word_url,
  home_partner_logo_url,
  card_radius,
  button_radius
)
values (
  'phoenix-guayaquil',
  'PHO3NIX Guayaquil',
  true,
  100,
  '#21c7ff',
  '#0284c7',
  '#f0d37a',
  '#1d7cff',
  '#020817',
  '#07111f',
  '#0b1b2f',
  'rgba(33, 199, 255, 0.36)',
  '#ffffff',
  'rgba(255, 255, 255, 0.68)',

  -- Marca global reutilizable.
  '/brand/pho3nix-logo.png',
  '/brand/lycan.png',

  -- Imágenes del tema Guayaquil.
  '/themes/phoenix-guayaquil/images/home-guayaquil-wide-01.png',
  '/themes/phoenix-guayaquil/images/home-guayaquil-wide-01.png',
  '/themes/phoenix-guayaquil/images/home-guayaquil-wide-01.png',
  '/themes/phoenix-guayaquil/images/home-guayaquil-wide-01.png',
  '/themes/phoenix-guayaquil/images/home-guayaquil-vertical-01.png',
  '/themes/phoenix-guayaquil/guayaquil-monument.svg',
  '/themes/phoenix-guayaquil/phoenix-wordmark-bg.svg',
  '/brand/lycan.png',
  '24px',
  '16px'
)
on conflict (theme_key)
do update set
  name = excluded.name,
  is_active = true,
  priority = excluded.priority,
  primary_color = excluded.primary_color,
  primary_dark_color = excluded.primary_dark_color,
  secondary_color = excluded.secondary_color,
  accent_color = excluded.accent_color,
  background_color = excluded.background_color,
  surface_color = excluded.surface_color,
  surface_soft_color = excluded.surface_soft_color,
  border_color = excluded.border_color,
  text_color = excluded.text_color,
  text_muted_color = excluded.text_muted_color,
  logo_url = excluded.logo_url,
  partner_logo_url = excluded.partner_logo_url,
  login_image_url = excluded.login_image_url,
  home_image_url = excluded.home_image_url,
  dashboard_image_url = excluded.dashboard_image_url,
  home_background_url = excluded.home_background_url,
  home_background_mobile_url = excluded.home_background_mobile_url,
  home_monument_url = excluded.home_monument_url,
  home_brand_word_url = excluded.home_brand_word_url,
  home_partner_logo_url = excluded.home_partner_logo_url,
  card_radius = excluded.card_radius,
  button_radius = excluded.button_radius,
  updated_at = now();

update public.app_themes
set is_active = false, updated_at = now()
where theme_key <> 'phoenix-guayaquil';
