-- ============================================================================
-- PHO3NIX V2 · 9B.1 · ATHLETE PROGRESS DATA FOUNDATION
-- Timezone-safe progress, measurement history, attendance read access,
-- group-WOD query support and server-side 30-day analysis cadence.
-- ============================================================================

begin;

create table if not exists public.nutricion_mediciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  fecha_medicion date not null default (timezone('America/Guayaquil', now())::date),
  peso_kg numeric not null,
  estatura_cm numeric not null,
  cintura_cm numeric null,
  horas_sueno numeric null,
  nivel_energia integer null,
  lesiones text null,
  observaciones text null,
  meta text null,
  source text not null default 'profile',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nutricion_mediciones_usuario_fecha_key unique (usuario_id, fecha_medicion),
  constraint nutricion_mediciones_peso_positive check (peso_kg > 0),
  constraint nutricion_mediciones_estatura_positive check (estatura_cm > 0)
);

create index if not exists nutricion_mediciones_usuario_fecha_idx
  on public.nutricion_mediciones (usuario_id, fecha_medicion desc);

alter table public.nutricion_mediciones enable row level security;
grant select on public.nutricion_mediciones to authenticated;

drop policy if exists nutricion_mediciones_select_own on public.nutricion_mediciones;
create policy nutricion_mediciones_select_own
on public.nutricion_mediciones
for select
to authenticated
using (usuario_id = auth.uid());

drop policy if exists nutricion_mediciones_select_staff on public.nutricion_mediciones;
create policy nutricion_mediciones_select_staff
on public.nutricion_mediciones
for select
to authenticated
using (
  exists (
    select 1
    from public.usuarios u
    where u.id = auth.uid()
      and lower(coalesce(u.role, '')) in ('admin', 'administrador', 'coach')
  )
);

insert into public.nutricion_mediciones (
  usuario_id, fecha_medicion, peso_kg, estatura_cm, meta,
  source, created_at, updated_at
)
select distinct on (a.usuario_id, a.fecha_analisis)
  a.usuario_id,
  a.fecha_analisis,
  a.peso_kg,
  a.estatura_cm,
  a.meta,
  'analysis_backfill',
  a.created_at,
  a.created_at
from public.nutricion_analisis a
where a.peso_kg > 0
  and a.estatura_cm > 0
order by a.usuario_id, a.fecha_analisis, a.created_at desc, a.id desc
on conflict (usuario_id, fecha_medicion) do nothing;

insert into public.nutricion_mediciones (
  usuario_id, fecha_medicion, peso_kg, estatura_cm,
  cintura_cm, horas_sueno, nivel_energia, lesiones, observaciones,
  meta, source, created_at, updated_at
)
select
  p.usuario_id,
  timezone('America/Guayaquil', p.updated_at)::date,
  p.peso_kg,
  p.estatura_cm,
  p.cintura_cm,
  p.horas_sueno,
  p.nivel_energia,
  p.lesiones,
  p.observaciones,
  p.meta,
  'profile_backfill',
  p.updated_at,
  p.updated_at
from public.nutricion_perfil p
where p.peso_kg > 0
  and p.estatura_cm > 0
on conflict (usuario_id, fecha_medicion) do update set
  peso_kg = excluded.peso_kg,
  estatura_cm = excluded.estatura_cm,
  cintura_cm = excluded.cintura_cm,
  horas_sueno = excluded.horas_sueno,
  nivel_energia = excluded.nivel_energia,
  lesiones = excluded.lesiones,
  observaciones = excluded.observaciones,
  meta = excluded.meta,
  source = excluded.source,
  updated_at = excluded.updated_at;

create or replace function public.sync_nutrition_measurement_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  local_date date := timezone('America/Guayaquil', now())::date;
begin
  insert into public.nutricion_mediciones (
    usuario_id, fecha_medicion, peso_kg, estatura_cm,
    cintura_cm, horas_sueno, nivel_energia, lesiones, observaciones,
    meta, source, created_at, updated_at
  )
  values (
    new.usuario_id,
    local_date,
    new.peso_kg,
    new.estatura_cm,
    new.cintura_cm,
    new.horas_sueno,
    new.nivel_energia,
    new.lesiones,
    new.observaciones,
    new.meta,
    'profile',
    now(),
    now()
  )
  on conflict (usuario_id, fecha_medicion) do update set
    peso_kg = excluded.peso_kg,
    estatura_cm = excluded.estatura_cm,
    cintura_cm = excluded.cintura_cm,
    horas_sueno = excluded.horas_sueno,
    nivel_energia = excluded.nivel_energia,
    lesiones = excluded.lesiones,
    observaciones = excluded.observaciones,
    meta = excluded.meta,
    source = excluded.source,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists nutrition_profile_measurement_history
  on public.nutricion_perfil;

create trigger nutrition_profile_measurement_history
after insert or update of
  peso_kg,
  estatura_cm,
  cintura_cm,
  horas_sueno,
  nivel_energia,
  lesiones,
  observaciones,
  meta
on public.nutricion_perfil
for each row
execute function public.sync_nutrition_measurement_from_profile();

create unique index if not exists nutricion_analisis_usuario_fecha_uidx
  on public.nutricion_analisis (usuario_id, fecha_analisis);

alter table public.nutricion_analisis
  alter column fecha_analisis
  set default (timezone('America/Guayaquil', now())::date);

alter table public.nutricion_analisis
  alter column proximo_analisis
  set default ((timezone('America/Guayaquil', now())::date) + 30);

create or replace function public.enforce_nutrition_analysis_cadence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  local_today date := timezone('America/Guayaquil', now())::date;
  latest_date date;
  elapsed_days integer;
  remaining_days integer;
begin
  if new.usuario_id is null then
    raise exception 'NO_AUTH_USER';
  end if;

  perform pg_advisory_xact_lock(hashtext(new.usuario_id::text));

  select max(a.fecha_analisis)
  into latest_date
  from public.nutricion_analisis a
  where a.usuario_id = new.usuario_id;

  if latest_date is not null then
    elapsed_days := local_today - latest_date;

    if elapsed_days < 30 then
      remaining_days := 30 - elapsed_days;
      raise exception 'ANALYSIS_LOCKED:%', remaining_days;
    end if;
  end if;

  new.fecha_analisis := local_today;
  new.proximo_analisis := local_today + 30;

  return new;
end;
$$;

drop trigger if exists nutrition_analysis_cadence_guard
  on public.nutricion_analisis;

create trigger nutrition_analysis_cadence_guard
before insert
on public.nutricion_analisis
for each row
execute function public.enforce_nutrition_analysis_cadence();

alter table public.asistencia enable row level security;
grant select on public.asistencia to authenticated;

drop policy if exists athlete_progress_attendance_select on public.asistencia;
create policy athlete_progress_attendance_select
on public.asistencia
for select
to authenticated
using (
  usuario_id = auth.uid()
  or exists (
    select 1
    from public.usuarios u
    where u.id = auth.uid()
      and lower(coalesce(u.role, '')) in ('admin', 'administrador', 'coach')
  )
);

alter table public.asistencia
  alter column fecha
  set default (timezone('America/Guayaquil', now())::date);

create index if not exists asistencia_usuario_fecha_idx
  on public.asistencia (usuario_id, fecha desc)
  where presente = true;

create index if not exists wod_resultado_participantes_usuario_resultado_idx
  on public.wod_resultado_participantes (usuario_id, wod_resultado_id);

commit;
