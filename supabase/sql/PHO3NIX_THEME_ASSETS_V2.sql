-- ============================================================
-- PHO3NIX V2 - THEME ASSETS PER SCREEN
-- Adds optional independent hero/image channels to app_themes.
-- Safe to run more than once.
-- ============================================================

begin;

alter table public.app_themes
  add column if not exists home_hero_url text,
  add column if not exists home_hero_mobile_url text,
  add column if not exists login_hero_url text,
  add column if not exists dashboard_hero_url text,
  add column if not exists dashboard_wod_url text,
  add column if not exists wods_hero_url text,
  add column if not exists pr_hero_url text,
  add column if not exists nutrition_hero_url text,
  add column if not exists challenge_hero_url text;

commit;

-- IMPORTANT:
-- The local "phoenix" theme is the application fallback and does not
-- require a database row.
--
-- If an old always-active theme such as "phoenix-guayaquil" remains
-- enabled in app_themes, it can still win as a REMOTE theme.
-- Review it before production and deactivate it if it should no longer
-- override the new PHO3NIX default.
