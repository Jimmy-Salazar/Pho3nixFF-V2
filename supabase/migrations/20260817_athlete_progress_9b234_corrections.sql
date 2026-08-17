-- ============================================================================
-- PHO3NIX V2 · 9B.2 + 9B.3 + 9B.4 · JOINT CORRECTIONS
-- Server-authoritative AI claim, score-version metadata and modality semantics.
-- Apply AFTER 20260816_athlete_progress_9b1_foundation.sql.
-- ============================================================================

begin;

alter table public.nutricion_analisis
  add column if not exists modalidad_frecuente text null;

alter table public.nutricion_analisis
  add column if not exists score_formula_version text null;

update public.nutricion_analisis
set modalidad_frecuente = mejor_modalidad
where modalidad_frecuente is null
  and mejor_modalidad is not null;

update public.nutricion_analisis
set score_formula_version = 'activity-v1'
where score_formula_version is null
  and score_pho3nix is not null;

create table if not exists public.nutricion_analisis_jobs (
  usuario_id uuid primary key references public.usuarios(id) on delete cascade,
  claim_token uuid not null default gen_random_uuid(),
  locked_until timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.nutricion_analisis_jobs enable row level security;

revoke all on table public.nutricion_analisis_jobs from anon, authenticated;

create or replace function public.claim_nutrition_analysis_job(
  p_usuario_id uuid
)
returns table (
  claim_token uuid,
  local_today date,
  next_available date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := timezone('America/Guayaquil', now())::date;
  v_latest date;
  v_remaining integer;
  v_existing_until timestamptz;
  v_token uuid := gen_random_uuid();
begin
  if p_usuario_id is null then
    raise exception 'NO_AUTH_USER';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_usuario_id::text));

  select max(a.fecha_analisis)
  into v_latest
  from public.nutricion_analisis a
  where a.usuario_id = p_usuario_id;

  if v_latest is not null and (v_today - v_latest) < 30 then
    v_remaining := 30 - (v_today - v_latest);
    raise exception 'ANALYSIS_LOCKED:%', v_remaining;
  end if;

  select j.locked_until
  into v_existing_until
  from public.nutricion_analisis_jobs j
  where j.usuario_id = p_usuario_id;

  if v_existing_until is not null and v_existing_until > now() then
    raise exception 'ANALYSIS_IN_PROGRESS';
  end if;

  insert into public.nutricion_analisis_jobs (
    usuario_id,
    claim_token,
    locked_until,
    created_at,
    updated_at
  )
  values (
    p_usuario_id,
    v_token,
    now() + interval '10 minutes',
    now(),
    now()
  )
  on conflict (usuario_id)
  do update set
    claim_token = excluded.claim_token,
    locked_until = excluded.locked_until,
    updated_at = now();

  return query
  select
    v_token,
    v_today,
    case when v_latest is null then v_today else v_latest + 30 end;
end;
$$;

revoke all on function public.claim_nutrition_analysis_job(uuid)
  from public, anon, authenticated;

grant execute on function public.claim_nutrition_analysis_job(uuid)
  to service_role;

commit;
