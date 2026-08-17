
-- ============================================================================
-- PHO3NIX V2 · 9B.5 · FINAL HARDENING
-- Security grants, bounded AI retries, scalable group-WOD reads,
-- atomic translation caching and production Edge configuration support.
-- Apply AFTER 20260817_athlete_progress_9b2341_server_authority.sql.
-- ============================================================================

begin;

-- 1. Least-privilege grants for Athlete Progress nutrition tables.

revoke all privileges on table public.nutricion_analisis
  from public, anon, authenticated;
grant select on table public.nutricion_analisis
  to authenticated;
grant all privileges on table public.nutricion_analisis
  to service_role;

revoke all privileges on table public.nutricion_mediciones
  from public, anon, authenticated;
grant select on table public.nutricion_mediciones
  to authenticated;
grant all privileges on table public.nutricion_mediciones
  to service_role;

revoke all privileges on table public.nutricion_perfil
  from public, anon, authenticated;
grant select, insert, update on table public.nutricion_perfil
  to authenticated;
grant all privileges on table public.nutricion_perfil
  to service_role;

revoke execute on function public.enforce_nutrition_analysis_cadence()
  from public, anon, authenticated;
revoke execute on function public.sync_nutrition_measurement_from_profile()
  from public, anon, authenticated;
grant execute on function public.enforce_nutrition_analysis_cadence()
  to service_role;
grant execute on function public.sync_nutrition_measurement_from_profile()
  to service_role;

-- 2. AI attempt rate limit: five acquired attempts per rolling one-hour window.

create table if not exists public.nutricion_analisis_rate_limits (
  usuario_id uuid primary key references public.usuarios(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  attempt_count integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint nutricion_analisis_rate_limits_attempt_count_check
    check (attempt_count >= 0)
);

alter table public.nutricion_analisis_rate_limits enable row level security;

revoke all privileges on table public.nutricion_analisis_rate_limits
  from public, anon, authenticated;
grant all privileges on table public.nutricion_analisis_rate_limits
  to service_role;

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
  v_rate_window timestamptz;
  v_rate_attempts integer;
  v_rate_minutes integer;
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

  select r.window_started_at, r.attempt_count
  into v_rate_window, v_rate_attempts
  from public.nutricion_analisis_rate_limits r
  where r.usuario_id = p_usuario_id;

  if v_rate_window is not null
     and v_rate_window > now() - interval '1 hour'
     and coalesce(v_rate_attempts, 0) >= 5 then
    v_rate_minutes := greatest(
      1,
      ceil(
        extract(epoch from ((v_rate_window + interval '1 hour') - now())) / 60.0
      )::integer
    );
    raise exception 'ANALYSIS_RATE_LIMITED:%', v_rate_minutes;
  end if;

  insert into public.nutricion_analisis_rate_limits (
    usuario_id,
    window_started_at,
    attempt_count,
    updated_at
  )
  values (
    p_usuario_id,
    now(),
    1,
    now()
  )
  on conflict (usuario_id)
  do update set
    window_started_at = case
      when public.nutricion_analisis_rate_limits.window_started_at <= now() - interval '1 hour'
        then now()
      else public.nutricion_analisis_rate_limits.window_started_at
    end,
    attempt_count = case
      when public.nutricion_analisis_rate_limits.window_started_at <= now() - interval '1 hour'
        then 1
      else public.nutricion_analisis_rate_limits.attempt_count + 1
    end,
    updated_at = now();

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

-- 3. Group-WOD lookup bounded by the requested date window.
-- SECURITY INVOKER keeps the caller's RLS in force.

create or replace function public.athlete_progress_group_wod_rows(
  p_from_date date,
  p_to_date date
)
returns table (
  row_data jsonb
)
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'id', r.id,
    'wod_id', r.wod_id,
    'resultado', r.resultado,
    'calorias_estimadas', r.calorias_estimadas,
    'fecha', r.fecha,
    'modalidad', r.modalidad,
    'tiempo_segundos', r.tiempo_segundos,
    'tiempo_texto', r.tiempo_texto,
    'repeticiones', r.repeticiones,
    'created_at', r.created_at
  ) as row_data
  from public.wod_resultado_participantes p
  join public.wod_resultados r
    on r.id = p.wod_resultado_id
  where p.usuario_id = auth.uid()
    and p_from_date is not null
    and p_to_date is not null
    and p_to_date >= p_from_date
    and (p_to_date - p_from_date) <= 31
    and r.fecha >= p_from_date
    and r.fecha <= p_to_date
  order by r.fecha desc, r.created_at desc, r.id desc;
$$;

revoke all on function public.athlete_progress_group_wod_rows(date, date)
  from public, anon, authenticated;
grant execute on function public.athlete_progress_group_wod_rows(date, date)
  to authenticated;

-- 4. Atomic translation-cache merge.
-- Called only by the translation Edge Function through service_role.

create or replace function public.merge_nutrition_analysis_translation(
  p_analysis_id uuid,
  p_usuario_id uuid,
  p_source_locale text,
  p_target_locale text,
  p_source jsonb,
  p_translation jsonb
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_analysis_id is null or p_usuario_id is null then
    raise exception 'INVALID_ANALYSIS_ID';
  end if;

  if p_source_locale not in ('es', 'en')
     or p_target_locale not in ('es', 'en') then
    raise exception 'INVALID_LOCALE';
  end if;

  if jsonb_typeof(p_source) is distinct from 'object'
     or jsonb_typeof(p_translation) is distinct from 'object' then
    raise exception 'INVALID_TRANSLATION_PAYLOAD';
  end if;

  update public.nutricion_analisis
  set respuesta_json = jsonb_set(
    coalesce(respuesta_json, '{}'::jsonb)
      || jsonb_build_object('source_locale', p_source_locale),
    '{translations}',
    coalesce(respuesta_json -> 'translations', '{}'::jsonb)
      || jsonb_build_object(
        p_source_locale, p_source,
        p_target_locale, p_translation
      ),
    true
  )
  where id = p_analysis_id
    and usuario_id = p_usuario_id;

  return found;
end;
$$;

revoke all on function public.merge_nutrition_analysis_translation(
  uuid, uuid, text, text, jsonb, jsonb
) from public, anon, authenticated;
grant execute on function public.merge_nutrition_analysis_translation(
  uuid, uuid, text, text, jsonb, jsonb
) to service_role;

commit;
