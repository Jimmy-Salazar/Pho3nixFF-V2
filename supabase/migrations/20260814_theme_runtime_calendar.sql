-- PHO3NIX V2 — shared Theme Runtime + Calendar
-- Web and future mobile app read the same rules from Supabase.

create table if not exists public.app_theme_runtime (
  config_key text primary key,
  mode text not null default 'auto'
    check (mode in ('auto', 'manual')),
  manual_theme_key text null,
  timezone text not null default 'America/Guayaquil',
  revision bigint not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.app_theme_calendar (
  theme_key text primary key,
  enabled boolean not null default true,
  priority integer not null default 100,
  rule jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_theme_runtime (
  config_key,
  mode,
  manual_theme_key,
  timezone,
  revision
)
values (
  'global',
  'auto',
  null,
  'America/Guayaquil',
  1
)
on conflict (config_key) do update set
  timezone = excluded.timezone,
  updated_at = now();

insert into public.app_theme_calendar (
  theme_key,
  enabled,
  priority,
  rule
)
values
  ('new_year', true, 100, '{"type":"annual_date","month":1,"day":1}'::jsonb),
  ('valentines_day', true, 120, '{"type":"annual_datetime_range","startMonth":2,"startDay":13,"startHour":23,"startMinute":0,"endMonth":2,"endDay":14,"endHour":23,"endMinute":59}'::jsonb),
  ('carnival', true, 95, '{"type":"easter_offset_range","startOffsetDays":-50,"endOffsetDays":-47}'::jsonb),
  ('international_womens_day', true, 100, '{"type":"annual_date","month":3,"day":8}'::jsonb),
  ('good_friday', true, 100, '{"type":"easter_offset","offsetDays":-2}'::jsonb),
  ('labor_day', true, 100, '{"type":"annual_date","month":5,"day":1}'::jsonb),
  ('mothers_day', true, 100, '{"type":"nth_weekday_of_month","month":5,"weekday":0,"occurrence":2}'::jsonb),
  ('battle_of_pichincha', true, 100, '{"type":"annual_date","month":5,"day":24}'::jsonb),
  ('childrens_day', true, 100, '{"type":"annual_date","month":6,"day":1}'::jsonb),
  ('fathers_day', true, 100, '{"type":"nth_weekday_of_month","month":6,"weekday":0,"occurrence":3}'::jsonb),
  ('guayaquil_foundation', true, 100, '{"type":"annual_date","month":7,"day":25}'::jsonb),
  ('first_cry_of_independence', true, 100, '{"type":"annual_date","month":8,"day":10}'::jsonb),
  ('flag_day', true, 100, '{"type":"annual_date","month":9,"day":26}'::jsonb),
  ('guayaquil_independence', true, 100, '{"type":"annual_date","month":10,"day":9}'::jsonb),
  ('halloween', true, 100, '{"type":"annual_date","month":10,"day":31}'::jsonb),
  ('all_souls_day', true, 100, '{"type":"annual_date","month":11,"day":2}'::jsonb),
  ('cuenca_independence', true, 100, '{"type":"annual_date","month":11,"day":3}'::jsonb),
  ('quito_foundation', true, 100, '{"type":"annual_date","month":12,"day":6}'::jsonb),
  ('christmas', true, 100, '{"type":"annual_range","startMonth":12,"startDay":21,"endMonth":12,"endDay":28}'::jsonb),
  ('year_end', true, 100, '{"type":"annual_range","startMonth":12,"startDay":29,"endMonth":12,"endDay":31}'::jsonb)
on conflict (theme_key) do update set
  enabled = excluded.enabled,
  priority = excluded.priority,
  rule = excluded.rule,
  updated_at = now();

-- Public read is required because the public PHO3NIX home/login also use themes.
alter table public.app_theme_runtime enable row level security;
alter table public.app_theme_calendar enable row level security;

drop policy if exists "theme runtime public read" on public.app_theme_runtime;
create policy "theme runtime public read"
on public.app_theme_runtime
for select
to anon, authenticated
using (true);

drop policy if exists "theme calendar public read" on public.app_theme_calendar;
create policy "theme calendar public read"
on public.app_theme_calendar
for select
to anon, authenticated
using (true);

-- Realtime: changes made/published from Administration are pushed to clients.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'app_theme_runtime'
  ) then
    alter publication supabase_realtime add table public.app_theme_runtime;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'app_theme_calendar'
  ) then
    alter publication supabase_realtime add table public.app_theme_calendar;
  end if;

  if to_regclass('public.app_themes') is not null and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'app_themes'
  ) then
    alter publication supabase_realtime add table public.app_themes;
  end if;
end $$;

-- Optional diagnostic view.
create or replace view public.app_theme_runtime_status as
select
  r.config_key,
  r.mode,
  r.manual_theme_key,
  r.timezone,
  r.revision,
  r.updated_at,
  (select count(*) from public.app_theme_calendar c where c.enabled) as enabled_calendar_entries
from public.app_theme_runtime r
where r.config_key = 'global';

grant select on public.app_theme_runtime_status to anon, authenticated;

-- IMPORTANT:
-- No public UPDATE policy is created here. A future Admin screen should update
-- runtime/calendar through an authenticated Admin-only policy or Edge Function.
