begin;

-- ============================================================
-- PHO3NIX V2
-- PERSONALIZED WOD CALORIE ESTIMATION
--
-- Repository persistence of the audited production state.
--
-- - Structured AI WOD analysis
-- - Historical athlete weight lookup
-- - Personalized calorie metadata
-- - For Time personalized calories
-- - Fixed-duration AMRAP / EMOM / max-reps calories
-- - Existing fallback behavior preserved
-- - No historical result rewrites
-- ============================================================


-- ============================================================
-- 1. WOD STRUCTURED ANALYSIS
-- ============================================================

alter table public.wod
    add column if not exists ai_intensity_score integer,
    add column if not exists ai_metabolic_load integer,
    add column if not exists ai_cardio_score integer,
    add column if not exists ai_strength_score integer,
    add column if not exists calorie_met_estimate numeric(4,1),
    add column if not exists ai_analysis_version text,
    add column if not exists scored_duration_seconds integer,
    add column if not exists scored_duration_source text;


do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'wod_scored_duration_positive'
          and conrelid = 'public.wod'::regclass
    ) then
        alter table public.wod
            add constraint wod_scored_duration_positive
            check (
                scored_duration_seconds is null
                or scored_duration_seconds > 0
            );
    end if;
end;
$$;


comment on column public.wod.scored_duration_seconds is
'Fixed elapsed duration in seconds of the scored WOD segment. Includes programmed rest belonging to that scored segment. Null when duration depends on the athlete, such as For Time.';

comment on column public.wod.scored_duration_source is
'Origin of scored_duration_seconds, for example admin, ai_analysis or controlled_migration.';



-- ============================================================
-- 2. PERSONALIZED RESULT METADATA
-- ============================================================

alter table public.wod_resultados
    add column if not exists calorie_is_personalized boolean not null default false,
    add column if not exists calorie_weight_kg numeric(6,2),
    add column if not exists calorie_weight_date date,
    add column if not exists calorie_calculation_version text,
    add column if not exists calorie_calculated_at timestamptz,
    add column if not exists calorie_calculation_data jsonb;


do $$
begin
    if not exists (
        select 1
        from pg_constraint c
        join pg_class t
          on t.oid = c.conrelid
        join pg_namespace n
          on n.oid = t.relnamespace
        where n.nspname = 'public'
          and t.relname = 'wod_resultados'
          and c.contype = 'c'
          and pg_get_constraintdef(c.oid)
              ilike '%calorie_weight_kg%'
    ) then
        alter table public.wod_resultados
            add constraint wod_resultados_calorie_weight_positive
            check (
                calorie_weight_kg is null
                or calorie_weight_kg > 0
            );
    end if;
end;
$$;



-- ============================================================
-- 3. HISTORICAL WEIGHT HELPER
-- ============================================================

create or replace function public.get_athlete_weight_for_date(
    p_user_id uuid,
    p_target_date date
)
returns table (
    weight_kg numeric,
    measurement_date date,
    weight_source text
)
language sql
stable
set search_path to 'public'
as $function$
    (
        select
            nm.peso_kg as weight_kg,
            nm.fecha_medicion as measurement_date,
            'nutrition_measurement'::text as weight_source
        from public.nutricion_mediciones nm
        where nm.usuario_id = p_user_id
          and nm.fecha_medicion <= p_target_date
        order by
            nm.fecha_medicion desc,
            nm.created_at desc
        limit 1
    )

    union all

    (
        select
            np.peso_kg as weight_kg,
            null::date as measurement_date,
            'nutrition_profile_fallback'::text as weight_source
        from public.nutricion_perfil np
        where np.usuario_id = p_user_id
          and not exists (
              select 1
              from public.nutricion_mediciones nm
              where nm.usuario_id = p_user_id
                and nm.fecha_medicion <= p_target_date
          )
        order by np.updated_at desc
        limit 1
    )

    limit 1;
$function$;



-- ============================================================
-- 4. CALORIE ENGINE 1.0
-- Retained for compatibility / audit reference.
-- ============================================================

create or replace function public.calculate_wod_submission_calories(
    p_wod_id uuid,
    p_user_id uuid,
    p_duration_seconds integer,
    p_target_date date
)
returns table (
    estimated_calories integer,
    personalized boolean,
    weight_kg numeric,
    weight_date date,
    weight_source text,
    weight_age_days integer,
    weight_confidence text,
    met_estimate numeric,
    reason text,
    calculation_version text,
    analysis_version text
)
language plpgsql
stable
set search_path to 'public'
as $function$
declare
    v_wod public.wod%rowtype;
    v_date date;

    v_weight numeric;
    v_weight_date date;
    v_weight_source text;
    v_weight_age_days integer;
    v_weight_confidence text;

    v_calories integer;
begin
    select w.*
    into v_wod
    from public.wod w
    where w.id = p_wod_id;

    if not found then
        return query
        select
            null::integer,
            false,
            null::numeric,
            null::date,
            null::text,
            null::integer,
            null::text,
            null::numeric,
            'WOD_NOT_FOUND'::text,
            'pho3nix-v2-calories-1.0'::text,
            null::text;
        return;
    end if;

    v_date := coalesce(p_target_date, v_wod.fecha, current_date);

    /*
      PHO3NIX V2 calories 1.0:
      initially only results whose score is time are calculated.
      RX / SC / PR do NOT modify MET.
    */
    if coalesce(v_wod.modo_ranking, '') <> 'menor_es_mejor' then
        return query
        select
            null::integer,
            false,
            null::numeric,
            null::date,
            null::text,
            null::integer,
            null::text,
            v_wod.calorie_met_estimate,
            'UNSUPPORTED_RESULT_MODE'::text,
            'pho3nix-v2-calories-1.0'::text,
            v_wod.ai_analysis_version;
        return;
    end if;

    if p_duration_seconds is null or p_duration_seconds <= 0 then
        return query
        select
            null::integer,
            false,
            null::numeric,
            null::date,
            null::text,
            null::integer,
            null::text,
            v_wod.calorie_met_estimate,
            'VALID_DURATION_NOT_AVAILABLE'::text,
            'pho3nix-v2-calories-1.0'::text,
            v_wod.ai_analysis_version;
        return;
    end if;

    if v_wod.calorie_met_estimate is null then
        return query
        select
            null::integer,
            false,
            null::numeric,
            null::date,
            null::text,
            null::integer,
            null::text,
            null::numeric,
            'MET_NOT_AVAILABLE'::text,
            'pho3nix-v2-calories-1.0'::text,
            v_wod.ai_analysis_version;
        return;
    end if;

    select
        gw.weight_kg,
        gw.measurement_date,
        gw.weight_source
    into
        v_weight,
        v_weight_date,
        v_weight_source
    from public.get_athlete_weight_for_date(
        p_user_id,
        v_date
    ) gw
    limit 1;

    if v_weight is null or v_weight <= 0 then
        return query
        select
            null::integer,
            false,
            null::numeric,
            null::date,
            null::text,
            null::integer,
            null::text,
            v_wod.calorie_met_estimate,
            'WEIGHT_NOT_AVAILABLE'::text,
            'pho3nix-v2-calories-1.0'::text,
            v_wod.ai_analysis_version;
        return;
    end if;

    if v_weight_date is not null then
        v_weight_age_days := v_date - v_weight_date;

        if v_weight_age_days <= 60 then
            v_weight_confidence := 'high';

        elsif v_weight_age_days <= 90 then
            v_weight_confidence := 'reduced';

        else
            return query
            select
                null::integer,
                false,
                v_weight,
                v_weight_date,
                v_weight_source,
                v_weight_age_days,
                'too_old'::text,
                v_wod.calorie_met_estimate,
                'WEIGHT_TOO_OLD'::text,
                'pho3nix-v2-calories-1.0'::text,
                v_wod.ai_analysis_version;
            return;
        end if;

    else
        v_weight_age_days := null;
        v_weight_confidence := 'profile_fallback';
    end if;

    v_calories := round(
        v_wod.calorie_met_estimate
        * v_weight
        * p_duration_seconds
        / 3600.0
    )::integer;

    return query
    select
        v_calories,
        true,
        v_weight,
        v_weight_date,
        v_weight_source,
        v_weight_age_days,
        v_weight_confidence,
        v_wod.calorie_met_estimate,
        'OK'::text,
        'pho3nix-v2-calories-1.0'::text,
        v_wod.ai_analysis_version;
end;
$function$;



-- ============================================================
-- 5. READ-ONLY FIXED-DURATION PREVIEW
-- ============================================================

create or replace function public.preview_wod_fixed_duration_calories(
    p_wod_id uuid,
    p_user_id uuid,
    p_target_date date
)
returns table (
    wod_id uuid,
    user_id uuid,
    wod_date date,
    ranking_mode text,

    scored_duration_seconds integer,
    scored_duration_source text,

    met_estimate numeric,

    weight_kg numeric,
    weight_date date,
    weight_source text,
    weight_age_days integer,
    weight_confidence text,

    estimated_calories integer,
    personalized boolean,

    calculation_version text,
    analysis_version text,
    reason text
)
language plpgsql
stable
set search_path = public
as $function$
declare
    v_wod public.wod%rowtype;
    v_date date;

    v_weight numeric;
    v_weight_date date;
    v_weight_source text;
    v_weight_age_days integer;
    v_weight_confidence text;

    v_calories integer;
begin

    select *
    into v_wod
    from public.wod
    where id = p_wod_id;

    if not found then
        return query
        select
            p_wod_id,
            p_user_id,
            null::date,
            null::text,
            null::integer,
            null::text,
            null::numeric,
            null::numeric,
            null::date,
            null::text,
            null::integer,
            null::text,
            null::integer,
            false,
            'pho3nix-v2-calories-1.1'::text,
            null::text,
            'WOD_NOT_FOUND'::text;
        return;
    end if;

    v_date := coalesce(
        p_target_date,
        v_wod.fecha,
        current_date
    );

    if coalesce(v_wod.modo_ranking, '') = 'menor_es_mejor' then
        return query
        select
            v_wod.id,
            p_user_id,
            v_wod.fecha,
            v_wod.modo_ranking,
            v_wod.scored_duration_seconds,
            v_wod.scored_duration_source,
            v_wod.calorie_met_estimate,
            null::numeric,
            null::date,
            null::text,
            null::integer,
            null::text,
            null::integer,
            false,
            'pho3nix-v2-calories-1.1'::text,
            v_wod.ai_analysis_version,
            'ATHLETE_DURATION_REQUIRED'::text;
        return;
    end if;

    if coalesce(v_wod.modo_ranking, '') not in (
        'mayor_es_mejor',
        'sin_ranking'
    ) then
        return query
        select
            v_wod.id,
            p_user_id,
            v_wod.fecha,
            v_wod.modo_ranking,
            v_wod.scored_duration_seconds,
            v_wod.scored_duration_source,
            v_wod.calorie_met_estimate,
            null::numeric,
            null::date,
            null::text,
            null::integer,
            null::text,
            null::integer,
            false,
            'pho3nix-v2-calories-1.1'::text,
            v_wod.ai_analysis_version,
            'UNSUPPORTED_RESULT_MODE'::text;
        return;
    end if;

    if coalesce(v_wod.scored_duration_seconds, 0) <= 0 then
        return query
        select
            v_wod.id,
            p_user_id,
            v_wod.fecha,
            v_wod.modo_ranking,
            v_wod.scored_duration_seconds,
            v_wod.scored_duration_source,
            v_wod.calorie_met_estimate,
            null::numeric,
            null::date,
            null::text,
            null::integer,
            null::text,
            null::integer,
            false,
            'pho3nix-v2-calories-1.1'::text,
            v_wod.ai_analysis_version,
            'SCORED_DURATION_NOT_AVAILABLE'::text;
        return;
    end if;

    if v_wod.calorie_met_estimate is null then
        return query
        select
            v_wod.id,
            p_user_id,
            v_wod.fecha,
            v_wod.modo_ranking,
            v_wod.scored_duration_seconds,
            v_wod.scored_duration_source,
            null::numeric,
            null::numeric,
            null::date,
            null::text,
            null::integer,
            null::text,
            null::integer,
            false,
            'pho3nix-v2-calories-1.1'::text,
            v_wod.ai_analysis_version,
            'MET_NOT_AVAILABLE'::text;
        return;
    end if;

    select
        gw.weight_kg,
        gw.measurement_date,
        gw.weight_source
    into
        v_weight,
        v_weight_date,
        v_weight_source
    from public.get_athlete_weight_for_date(
        p_user_id,
        v_date
    ) gw
    limit 1;

    if v_weight is null or v_weight <= 0 then
        return query
        select
            v_wod.id,
            p_user_id,
            v_wod.fecha,
            v_wod.modo_ranking,
            v_wod.scored_duration_seconds,
            v_wod.scored_duration_source,
            v_wod.calorie_met_estimate,
            null::numeric,
            null::date,
            null::text,
            null::integer,
            null::text,
            null::integer,
            false,
            'pho3nix-v2-calories-1.1'::text,
            v_wod.ai_analysis_version,
            'WEIGHT_NOT_AVAILABLE'::text;
        return;
    end if;

    if v_weight_date is not null then

        v_weight_age_days :=
            v_date - v_weight_date;

        if v_weight_age_days <= 60 then
            v_weight_confidence := 'high';

        elsif v_weight_age_days <= 90 then
            v_weight_confidence := 'reduced';

        else
            return query
            select
                v_wod.id,
                p_user_id,
                v_wod.fecha,
                v_wod.modo_ranking,
                v_wod.scored_duration_seconds,
                v_wod.scored_duration_source,
                v_wod.calorie_met_estimate,
                v_weight,
                v_weight_date,
                v_weight_source,
                v_weight_age_days,
                'too_old'::text,
                null::integer,
                false,
                'pho3nix-v2-calories-1.1'::text,
                v_wod.ai_analysis_version,
                'WEIGHT_TOO_OLD'::text;
            return;
        end if;

    else
        v_weight_age_days := null;
        v_weight_confidence := 'profile_fallback';
    end if;

    v_calories :=
        round(
            v_wod.calorie_met_estimate
            * v_weight
            * v_wod.scored_duration_seconds
            / 3600.0
        )::integer;

    return query
    select
        v_wod.id,
        p_user_id,
        v_wod.fecha,
        v_wod.modo_ranking,
        v_wod.scored_duration_seconds,
        v_wod.scored_duration_source,
        v_wod.calorie_met_estimate,
        v_weight,
        v_weight_date,
        v_weight_source,
        v_weight_age_days,
        v_weight_confidence,
        v_calories,
        true,
        'pho3nix-v2-calories-1.1'::text,
        v_wod.ai_analysis_version,
        'OK'::text;

end;
$function$;


comment on function public.preview_wod_fixed_duration_calories(
    uuid,
    uuid,
    date
)
is
'PHO3NIX V2 read-only preview for personalized calories on fixed-duration scored WOD segments such as AMRAP, EMOM and max-reps workouts.';



-- ============================================================
-- 6. UNIFIED CALORIE ENGINE 1.1
-- ============================================================

create or replace function public.calculate_wod_submission_calories_v2(
    p_wod_id uuid,
    p_user_id uuid,
    p_duration_seconds integer,
    p_target_date date
)
returns table (
    estimated_calories integer,
    personalized boolean,

    weight_kg numeric,
    weight_date date,
    weight_source text,
    weight_age_days integer,
    weight_confidence text,

    met_estimate numeric,

    duration_seconds integer,
    duration_source text,

    reason text,
    calculation_version text,
    analysis_version text
)
language plpgsql
stable
set search_path to 'public'
as $function$
declare
    v_wod public.wod%rowtype;
    v_date date;

    v_duration integer;
    v_duration_source text;

    v_weight numeric;
    v_weight_date date;
    v_weight_source text;
    v_weight_age_days integer;
    v_weight_confidence text;

    v_calories integer;

begin

    select w.*
    into v_wod
    from public.wod w
    where w.id = p_wod_id;

    if not found then
        return query
        select
            null::integer,
            false,
            null::numeric,
            null::date,
            null::text,
            null::integer,
            null::text,
            null::numeric,
            null::integer,
            null::text,
            'WOD_NOT_FOUND'::text,
            'pho3nix-v2-calories-1.1'::text,
            null::text;
        return;
    end if;

    v_date :=
        coalesce(
            p_target_date,
            v_wod.fecha,
            current_date
        );

    if coalesce(v_wod.modo_ranking, '') = 'menor_es_mejor' then

        if p_duration_seconds is null
           or p_duration_seconds <= 0 then

            return query
            select
                null::integer,
                false,
                null::numeric,
                null::date,
                null::text,
                null::integer,
                null::text,
                v_wod.calorie_met_estimate,
                null::integer,
                'athlete_result'::text,
                'VALID_DURATION_NOT_AVAILABLE'::text,
                'pho3nix-v2-calories-1.1'::text,
                v_wod.ai_analysis_version;
            return;
        end if;

        v_duration := p_duration_seconds;
        v_duration_source := 'athlete_result';


    elsif coalesce(v_wod.modo_ranking, '') in (
        'mayor_es_mejor',
        'sin_ranking'
    ) then

        if v_wod.scored_duration_seconds is null
           or v_wod.scored_duration_seconds <= 0 then

            return query
            select
                null::integer,
                false,
                null::numeric,
                null::date,
                null::text,
                null::integer,
                null::text,
                v_wod.calorie_met_estimate,
                v_wod.scored_duration_seconds,
                'scored_wod_segment'::text,
                'SCORED_DURATION_NOT_AVAILABLE'::text,
                'pho3nix-v2-calories-1.1'::text,
                v_wod.ai_analysis_version;
            return;
        end if;

        v_duration := v_wod.scored_duration_seconds;
        v_duration_source := 'scored_wod_segment';


    else

        return query
        select
            null::integer,
            false,
            null::numeric,
            null::date,
            null::text,
            null::integer,
            null::text,
            v_wod.calorie_met_estimate,
            null::integer,
            null::text,
            'UNSUPPORTED_RESULT_MODE'::text,
            'pho3nix-v2-calories-1.1'::text,
            v_wod.ai_analysis_version;
        return;

    end if;

    if v_wod.calorie_met_estimate is null then

        return query
        select
            null::integer,
            false,
            null::numeric,
            null::date,
            null::text,
            null::integer,
            null::text,
            null::numeric,
            v_duration,
            v_duration_source,
            'MET_NOT_AVAILABLE'::text,
            'pho3nix-v2-calories-1.1'::text,
            v_wod.ai_analysis_version;
        return;
    end if;

    select
        gw.weight_kg,
        gw.measurement_date,
        gw.weight_source
    into
        v_weight,
        v_weight_date,
        v_weight_source
    from public.get_athlete_weight_for_date(
        p_user_id,
        v_date
    ) gw
    limit 1;

    if v_weight is null
       or v_weight <= 0 then

        return query
        select
            null::integer,
            false,
            null::numeric,
            null::date,
            null::text,
            null::integer,
            null::text,
            v_wod.calorie_met_estimate,
            v_duration,
            v_duration_source,
            'WEIGHT_NOT_AVAILABLE'::text,
            'pho3nix-v2-calories-1.1'::text,
            v_wod.ai_analysis_version;
        return;
    end if;

    if v_weight_date is not null then

        v_weight_age_days :=
            v_date - v_weight_date;

        if v_weight_age_days <= 60 then
            v_weight_confidence := 'high';

        elsif v_weight_age_days <= 90 then
            v_weight_confidence := 'reduced';

        else
            return query
            select
                null::integer,
                false,
                v_weight,
                v_weight_date,
                v_weight_source,
                v_weight_age_days,
                'too_old'::text,
                v_wod.calorie_met_estimate,
                v_duration,
                v_duration_source,
                'WEIGHT_TOO_OLD'::text,
                'pho3nix-v2-calories-1.1'::text,
                v_wod.ai_analysis_version;
            return;
        end if;

    else
        v_weight_age_days := null;
        v_weight_confidence := 'profile_fallback';
    end if;

    v_calories :=
        round(
            v_wod.calorie_met_estimate
            * v_weight
            * v_duration
            / 3600.0
        )::integer;

    return query
    select
        v_calories,
        true,
        v_weight,
        v_weight_date,
        v_weight_source,
        v_weight_age_days,
        v_weight_confidence,
        v_wod.calorie_met_estimate,
        v_duration,
        v_duration_source,
        'OK'::text,
        'pho3nix-v2-calories-1.1'::text,
        v_wod.ai_analysis_version;

end;
$function$;


comment on function
public.calculate_wod_submission_calories_v2(
    uuid,
    uuid,
    integer,
    date
)
is
'PHO3NIX V2 calories 1.1. Read-only personalized calorie engine supporting athlete elapsed duration for menor_es_mejor and structured scored duration for mayor_es_mejor/sin_ranking. Does not modify results.';



-- ============================================================
-- 7. PRODUCTION RESULT VALIDATION TRIGGER FUNCTION
-- ============================================================

create or replace function public.wod_validate_athlete_result()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
declare
    v_wod public.wod%rowtype;
    v_calc record;

    v_fallback_reason text;
    v_fallback_source text;

begin

    -- Existing audited security/business rules preserved.

    if public.wod_is_manager() then
        return new;
    end if;

    if auth.uid() is null then
        raise exception 'WOD_AUTH_REQUIRED';
    end if;

    if new.usuario_id is distinct from auth.uid() then
        raise exception 'WOD_RESULT_USER_MISMATCH';
    end if;

    if tg_op = 'UPDATE' then

        if new.usuario_id is distinct from old.usuario_id then
            raise exception 'WOD_RESULT_USER_IMMUTABLE';
        end if;

        if new.wod_id is distinct from old.wod_id then
            raise exception 'WOD_RESULT_WOD_IMMUTABLE';
        end if;

    end if;

    if not public.wod_is_active_athlete(auth.uid()) then
        raise exception 'WOD_ACTIVE_ATHLETE_REQUIRED';
    end if;

    if not public.wod_is_submission_window_open(new.wod_id) then
        raise exception 'WOD_RESULT_WINDOW_CLOSED';
    end if;

    select *
    into v_wod
    from public.wod
    where id = new.wod_id;

    if not found then
        raise exception 'WOD_NOT_FOUND';
    end if;

    new.fecha := v_wod.fecha;

    select *
    into v_calc
    from public.calculate_wod_submission_calories_v2(
        new.wod_id,
        new.usuario_id,
        new.tiempo_segundos,
        v_wod.fecha
    )
    limit 1;

    if found
       and coalesce(v_calc.personalized, false)
       and coalesce(v_calc.estimated_calories, 0) > 0
    then

        new.calorias_estimadas :=
            v_calc.estimated_calories;

        new.calorie_is_personalized :=
            true;

        new.calorie_weight_kg :=
            v_calc.weight_kg;

        new.calorie_weight_date :=
            v_calc.weight_date;

        new.calorie_calculation_version :=
            v_calc.calculation_version;

        new.calorie_calculated_at :=
            now();

        new.calorie_calculation_data :=
            jsonb_build_object(

                'reason',
                v_calc.reason,

                'calculation_basis',
                'met_weight_duration',

                'met_estimate',
                v_calc.met_estimate,

                'duration_seconds',
                v_calc.duration_seconds,

                'duration_source',
                v_calc.duration_source,

                'weight_source',
                v_calc.weight_source,

                'weight_age_days',
                v_calc.weight_age_days,

                'weight_confidence',
                v_calc.weight_confidence,

                'result_mode',
                new.modalidad,

                'reference_calories_min',
                v_wod.calorias_min,

                'reference_calories_max',
                v_wod.calorias_max,

                'analysis_version',
                v_calc.analysis_version
            );

    else

        v_fallback_reason :=
            coalesce(
                v_calc.reason,
                'CALCULATION_NOT_AVAILABLE'
            );

        if coalesce(v_wod.calorias_max, 0) > 0 then

            new.calorias_estimadas :=
                v_wod.calorias_max;

            v_fallback_source :=
                'wod_reference_max';

        else

            v_fallback_source :=
                'submitted_or_existing_value';

        end if;

        new.calorie_is_personalized :=
            false;

        new.calorie_weight_kg :=
            null;

        new.calorie_weight_date :=
            null;

        new.calorie_calculation_version :=
            coalesce(
                v_calc.calculation_version,
                'pho3nix-v2-calories-1.1'
            );

        new.calorie_calculated_at :=
            now();

        new.calorie_calculation_data :=
            jsonb_build_object(

                'reason',
                v_fallback_reason,

                'fallback',
                v_fallback_source,

                'duration_seconds',
                v_calc.duration_seconds,

                'duration_source',
                v_calc.duration_source,

                'result_mode',
                new.modalidad,

                'reference_calories_min',
                v_wod.calorias_min,

                'reference_calories_max',
                v_wod.calorias_max,

                'analysis_version',
                v_wod.ai_analysis_version
            );

    end if;

    return new;

end;
$function$;



-- ============================================================
-- 8. ENSURE PHYSICAL TRIGGER EXISTS
-- Do not recreate it when already present.
-- ============================================================

do $$
begin
    if not exists (
        select 1
        from pg_trigger t
        join pg_class c
          on c.oid = t.tgrelid
        join pg_namespace n
          on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname = 'wod_resultados'
          and t.tgname = 'trg_wod_validate_athlete_result'
          and not t.tgisinternal
    ) then

        create trigger trg_wod_validate_athlete_result
        before insert or update
        on public.wod_resultados
        for each row
        execute function public.wod_validate_athlete_result();

    end if;
end;
$$;


commit;