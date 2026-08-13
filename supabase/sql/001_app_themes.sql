create table if not exists public.app_themes (
  id uuid primary key default gen_random_uuid(),
  theme_key text not null unique,
  name text not null,
  is_active boolean not null default false,
  priority integer not null default 0,
  start_date date null,
  end_date date null,
  primary_color text not null default '#f97316',
  primary_dark_color text not null default '#c2410c',
  secondary_color text not null default '#fb923c',
  accent_color text not null default '#ef4444',
  background_color text not null default '#050505',
  surface_color text not null default '#0b0b0f',
  surface_soft_color text not null default '#14141a',
  border_color text not null default 'rgba(249, 115, 22, 0.22)',
  text_color text not null default '#ffffff',
  text_muted_color text not null default 'rgba(255, 255, 255, 0.62)',
  card_radius text not null default '28px',
  button_radius text not null default '16px',
  logo_url text null,
  login_image_url text null,
  home_image_url text null,
  dashboard_image_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_themes enable row level security;

drop policy if exists "Public can read active themes" on public.app_themes;
create policy "Public can read active themes" on public.app_themes for select to anon, authenticated using (
  is_active = true and (start_date is null or start_date <= current_date) and (end_date is null or end_date >= current_date)
);

insert into public.app_themes (theme_key,name,is_active,priority)
values ('phoenix-base','PHO3NIX Base',true,100)
on conflict (theme_key) do update set is_active = excluded.is_active, priority = excluded.priority, updated_at = now();
