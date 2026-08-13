-- ============================================================================
-- PHO3NIX V2 · PDA SIN INSCRIPCIONES
-- Todos los atletas ACTIVOS participan automáticamente.
-- Zona horaria operativa: America/Guayaquil
--
-- IMPORTANTE
-- - Migra pda_resultados de pda_inscripcion_id -> usuario_id.
-- - Conserva public.pda_inscripciones como tabla LEGACY temporal para auditoría.
-- - Ningún resultado, ranking o flujo nuevo depende de pda_inscripciones.
-- - NO restaura todavía la regla anual de fechas del frontend.
-- - NO elimina los permisos temporales de lectura de edición/WOD usados en desarrollo.
-- ============================================================================

begin;

-- --------------------------------------------------------------------------
-- 1. ADMIN REAL DE PHO3NIX V2
-- --------------------------------------------------------------------------
create or replace function public.pda_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios u
    where u.id = auth.uid()
      and lower(trim(coalesce(u.role, ''))) in ('admin', 'administrador')
  );
$$;

revoke all on function public.pda_is_admin() from public;
grant execute on function public.pda_is_admin() to authenticated;

-- --------------------------------------------------------------------------
-- 2. FUENTE DE VERDAD: ATLETA ACTIVO
-- Mismo criterio funcional usado por Personas/Dashboard:
-- role alumno + última mensualidad iniciada, no vencida y no marcada inactiva.
-- --------------------------------------------------------------------------
create or replace function public.pda_is_active_athlete(p_usuario_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with latest_membership as (
    select m.*
    from public.mensualidades m
    where m.usuario_id = p_usuario_id
    order by m.fecha_fin desc nulls last, m.created_at desc
    limit 1
  )
  select exists (
    select 1
    from public.usuarios u
    join latest_membership m on true
    where u.id = p_usuario_id
      and lower(trim(coalesce(u.role, ''))) in ('alumno', 'atleta', 'student', 'athlete', '´alumno´')
      and lower(trim(coalesce(m.estado, ''))) not in (
        'inactivo', 'inactiva', 'vencido', 'vencida',
        'cancelado', 'cancelada', 'anulado', 'anulada'
      )
      and (m.fecha_inicio is null or m.fecha_inicio <= timezone('America/Guayaquil', now())::date)
      and (m.fecha_fin is null or m.fecha_fin >= timezone('America/Guayaquil', now())::date)
  );
$$;

revoke all on function public.pda_is_active_athlete(uuid) from public;
grant execute on function public.pda_is_active_athlete(uuid) to authenticated;

create or replace function public.pda_atletas_activos()
returns table (
  usuario_id uuid,
  atleta_nombre text,
  atleta_email text,
  atleta_foto_url text,
  atleta_sexo text,
  mensualidad_id uuid,
  fecha_inicio date,
  fecha_fin date,
  estado_mensualidad text
)
language sql
stable
security definer
set search_path = public
as $$
  with latest_membership as (
    select distinct on (m.usuario_id)
      m.usuario_id,
      m.id,
      m.fecha_inicio,
      m.fecha_fin,
      m.estado,
      m.created_at
    from public.mensualidades m
    order by m.usuario_id, m.fecha_fin desc nulls last, m.created_at desc
  )
  select
    u.id,
    u.nombre,
    u.email,
    u.foto_url,
    u.sexo,
    m.id,
    m.fecha_inicio,
    m.fecha_fin,
    m.estado
  from public.usuarios u
  join latest_membership m on m.usuario_id = u.id
  where lower(trim(coalesce(u.role, ''))) in ('alumno', 'atleta', 'student', 'athlete', '´alumno´')
    and lower(trim(coalesce(m.estado, ''))) not in (
      'inactivo', 'inactiva', 'vencido', 'vencida',
      'cancelado', 'cancelada', 'anulado', 'anulada'
    )
    and (m.fecha_inicio is null or m.fecha_inicio <= timezone('America/Guayaquil', now())::date)
    and (m.fecha_fin is null or m.fecha_fin >= timezone('America/Guayaquil', now())::date)
  order by u.nombre;
$$;

revoke all on function public.pda_atletas_activos() from public;

create or replace function public.pda_admin_atletas_activos()
returns table (
  usuario_id uuid,
  atleta_nombre text,
  atleta_email text,
  atleta_foto_url text,
  atleta_sexo text,
  mensualidad_id uuid,
  fecha_inicio date,
  fecha_fin date,
  estado_mensualidad text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.pda_is_admin() then
    raise exception 'PDA_ADMIN_REQUIRED';
  end if;

  return query
  select * from public.pda_atletas_activos();
end;
$$;

revoke all on function public.pda_admin_atletas_activos() from public;
grant execute on function public.pda_admin_atletas_activos() to authenticated;

-- --------------------------------------------------------------------------
-- 3. PREPARAR RESULTADOS PARA LA MIGRACIÓN
-- Primero retiramos dependencias antiguas de pda_inscripcion_id.
-- --------------------------------------------------------------------------
do $$
declare
  p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'pda_resultados'
  loop
    execute format('drop policy if exists %I on public.pda_resultados', p.policyname);
  end loop;
end;
$$;

drop trigger if exists trg_pda_resultados_validate on public.pda_resultados;
drop trigger if exists trg_pda_resultados_recalculate_insert_delete on public.pda_resultados;
drop trigger if exists trg_pda_resultados_recalculate_update on public.pda_resultados;

drop function if exists public.pda_ranking_wod_dev(uuid, uuid);
drop function if exists public.pda_ranking_general_dev(uuid, uuid);
drop function if exists public.pda_ranking_wod(uuid, uuid);
drop function if exists public.pda_ranking_general(uuid, uuid);
drop function if exists public.pda_recalculate_after_result_change();
drop function if exists public.recalcular_pda_wod(uuid);
drop function if exists public.pda_validate_result();
drop function if exists public.pda_ensure_athlete_entry_dev(uuid);

alter table public.pda_resultados
  add column if not exists usuario_id uuid references public.usuarios(id) on delete cascade;

-- Rescata el dueño de cada resultado histórico desde la inscripción LEGACY.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'pda_resultados'
      and column_name = 'pda_inscripcion_id'
  ) then
    execute $q$
      update public.pda_resultados r
      set usuario_id = i.usuario_id
      from public.pda_inscripciones i
      where r.pda_inscripcion_id = i.id
        and r.usuario_id is null
    $q$;
  end if;
end;
$$;

-- No continuamos si algún resultado histórico no puede identificarse.
do $$
begin
  if exists (select 1 from public.pda_resultados where usuario_id is null) then
    raise exception 'PDA_MIGRATION_RESULT_WITHOUT_USER';
  end if;

  if exists (
    select 1
    from public.pda_resultados
    group by pda_wod_id, usuario_id
    having count(*) > 1
  ) then
    raise exception 'PDA_MIGRATION_DUPLICATE_WOD_USER_RESULT';
  end if;
end;
$$;

-- Quita cualquier UNIQUE antiguo que incluya la inscripción.
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.pda_resultados'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) ilike '%pda_inscripcion_id%'
  loop
    execute format('alter table public.pda_resultados drop constraint %I', c.conname);
  end loop;
end;
$$;

drop index if exists public.idx_pda_resultados_inscripcion;

-- El resultado deja de tener cualquier vínculo con una inscripción.
alter table public.pda_resultados
  drop column if exists pda_inscripcion_id;

alter table public.pda_resultados
  alter column usuario_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.pda_resultados'::regclass
      and conname = 'pda_resultados_wod_usuario_key'
  ) then
    alter table public.pda_resultados
      add constraint pda_resultados_wod_usuario_key unique (pda_wod_id, usuario_id);
  end if;
end;
$$;

create index if not exists idx_pda_resultados_usuario_wod
  on public.pda_resultados (usuario_id, pda_wod_id);

comment on column public.pda_resultados.usuario_id is
  'Atleta dueño del resultado. PDA no usa inscripciones.';

-- --------------------------------------------------------------------------
-- 4. INSCRIPCIONES = LEGACY, SOLO AUDITORÍA
-- Se conserva temporalmente para no destruir datos anteriores.
-- --------------------------------------------------------------------------
drop trigger if exists trg_pda_inscripciones_updated_at on public.pda_inscripciones;
drop trigger if exists trg_pda_inscripciones_validate_category on public.pda_inscripciones;
drop function if exists public.pda_validate_inscription_category();

do $$
declare
  p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'pda_inscripciones'
  loop
    execute format('drop policy if exists %I on public.pda_inscripciones', p.policyname);
  end loop;
end;
$$;

alter table public.pda_inscripciones enable row level security;

create policy pda_inscripciones_legacy_admin_select
on public.pda_inscripciones
for select to authenticated
using (public.pda_is_admin());

grant select on public.pda_inscripciones to authenticated;
revoke insert, update, delete on public.pda_inscripciones from authenticated;

comment on table public.pda_inscripciones is
  'LEGACY. PDA V2 ya no utiliza inscripciones. Todos los atletas activos participan automáticamente.';

-- La tabla de participantes anterior tampoco forma parte del flujo nuevo.
comment on table public.pda_resultado_participantes is
  'LEGACY. No se utiliza en el flujo PDA individual basado directamente en usuario_id.';

-- --------------------------------------------------------------------------
-- 5. VALIDACIÓN DE RESULTADOS SIN INSCRIPCIONES
-- --------------------------------------------------------------------------
create or replace function public.pda_validate_result()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wod public.pda_wods%rowtype;
  v_edicion public.pda_ediciones%rowtype;
  v_today date := timezone('America/Guayaquil', now())::date;
  v_is_admin boolean := public.pda_is_admin();
begin
  select * into v_wod
  from public.pda_wods
  where id = new.pda_wod_id;

  if not found then
    raise exception 'PDA_WOD_NOT_FOUND';
  end if;

  select * into v_edicion
  from public.pda_ediciones
  where id = v_wod.pda_edicion_id;

  if not found then
    raise exception 'PDA_EDITION_NOT_FOUND';
  end if;

  if new.usuario_id is null then
    raise exception 'PDA_ATHLETE_REQUIRED';
  end if;

  if not public.pda_is_active_athlete(new.usuario_id) then
    raise exception 'PDA_ATHLETE_NOT_ACTIVE';
  end if;

  if not v_is_admin then
    if auth.uid() is null or new.usuario_id <> auth.uid() then
      raise exception 'PDA_RESULT_NOT_OWNED';
    end if;

    if tg_op = 'UPDATE' and old.usuario_id is distinct from new.usuario_id then
      raise exception 'PDA_RESULT_OWNER_CANNOT_CHANGE';
    end if;

    if v_edicion.publicada is distinct from true
       or v_wod.publicado is distinct from true
       or v_wod.activo is distinct from true
       or (v_wod.fecha_publicacion is not null and v_wod.fecha_publicacion > now()) then
      raise exception 'PDA_WOD_NOT_AVAILABLE';
    end if;

    if v_wod.fecha is null or v_wod.fecha <> v_today then
      raise exception 'PDA_RESULT_ONLY_ON_WOD_DATE';
    end if;

    -- El atleta nunca controla puntos ni posición.
    if tg_op = 'UPDATE' then
      new.posicion := old.posicion;
      new.puntos := old.puntos;
    else
      new.posicion := null;
      new.puntos := 0;
    end if;
  end if;

  if new.estado_resultado <> 'valido' then
    new.completado := false;
    new.puntos := 0;
  end if;

  if new.estado_resultado = 'valido' and new.completado then
    if v_wod.tipo_resultado = 'tiempo' and coalesce(new.tiempo_segundos, 0) <= 0 then
      raise exception 'PDA_TIME_REQUIRED';
    elsif v_wod.tipo_resultado = 'repeticiones' and new.repeticiones is null then
      raise exception 'PDA_REPS_REQUIRED';
    elsif v_wod.tipo_resultado not in ('tiempo', 'repeticiones') then
      raise exception 'PDA_RESULT_TYPE_NOT_SUPPORTED';
    end if;
  end if;

  return new;
end;
$$;

-- --------------------------------------------------------------------------
-- 6. RECÁLCULO DEL PDA POR WOD: RANKING GENERAL DE ATLETAS ACTIVOS
-- --------------------------------------------------------------------------
create or replace function public.recalcular_pda_wod(p_wod_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_edicion_id uuid;
  v_tipo_resultado text;
  v_completed integer;
begin
  select pda_edicion_id, tipo_resultado
    into v_edicion_id, v_tipo_resultado
  from public.pda_wods
  where id = p_wod_id;

  if v_edicion_id is null then
    return;
  end if;

  update public.pda_resultados
  set posicion = null,
      puntos = 0,
      updated_at = now()
  where pda_wod_id = p_wod_id;

  if v_tipo_resultado = 'tiempo' then
    with base as (
      select
        r.id,
        rank() over (
          order by r.tiempo_segundos asc,
                   coalesce(r.tie_break_segundos, 2147483647) asc
        )::integer as rank_position,
        count(*) over (
          partition by r.tiempo_segundos,
                       coalesce(r.tie_break_segundos, 2147483647)
        )::integer as tie_count
      from public.pda_resultados r
      where r.pda_wod_id = p_wod_id
        and public.pda_is_active_athlete(r.usuario_id)
        and r.estado_resultado = 'valido'
        and r.completado = true
        and r.tiempo_segundos is not null
        and r.tiempo_segundos > 0
    ), scored as (
      select
        b.id,
        b.rank_position,
        (
          select avg(public.pda_points_for_position(v_edicion_id, pos))
          from generate_series(
            b.rank_position,
            b.rank_position + b.tie_count - 1
          ) pos
        ) as awarded_points
      from base b
    )
    update public.pda_resultados r
    set posicion = s.rank_position,
        puntos = s.awarded_points,
        updated_at = now()
    from scored s
    where r.id = s.id;

  elsif v_tipo_resultado = 'repeticiones' then
    with base as (
      select
        r.id,
        rank() over (
          order by r.repeticiones desc,
                   coalesce(r.tie_break_segundos, 2147483647) asc
        )::integer as rank_position,
        count(*) over (
          partition by r.repeticiones,
                       coalesce(r.tie_break_segundos, 2147483647)
        )::integer as tie_count
      from public.pda_resultados r
      where r.pda_wod_id = p_wod_id
        and public.pda_is_active_athlete(r.usuario_id)
        and r.estado_resultado = 'valido'
        and r.completado = true
        and r.repeticiones is not null
        and r.repeticiones >= 0
    ), scored as (
      select
        b.id,
        b.rank_position,
        (
          select avg(public.pda_points_for_position(v_edicion_id, pos))
          from generate_series(
            b.rank_position,
            b.rank_position + b.tie_count - 1
          ) pos
        ) as awarded_points
      from base b
    )
    update public.pda_resultados r
    set posicion = s.rank_position,
        puntos = s.awarded_points,
        updated_at = now()
    from scored s
    where r.id = s.id;
  else
    raise exception 'PDA_RESULT_TYPE_NOT_SUPPORTED';
  end if;

  select count(*)::integer into v_completed
  from public.pda_resultados r
  where r.pda_wod_id = p_wod_id
    and public.pda_is_active_athlete(r.usuario_id)
    and r.estado_resultado = 'valido'
    and r.completado = true
    and r.posicion is not null;

  with incomplete_positions as (
    select
      r.id,
      v_completed
      + row_number() over (
          order by
            coalesce(r.repeticiones, 0) desc,
            coalesce(r.tie_break_segundos, 2147483647) asc,
            r.created_at asc
        )::integer as final_position
    from public.pda_resultados r
    where r.pda_wod_id = p_wod_id
      and public.pda_is_active_athlete(r.usuario_id)
      and (
        r.estado_resultado in ('dnf', 'dns', 'dq', 'anulado')
        or (r.estado_resultado = 'valido' and r.completado = false)
      )
  )
  update public.pda_resultados r
  set posicion = p.final_position,
      puntos = 0,
      updated_at = now()
  from incomplete_positions p
  where r.id = p.id;
end;
$$;

revoke all on function public.recalcular_pda_wod(uuid) from public;
grant execute on function public.recalcular_pda_wod(uuid) to authenticated;

create or replace function public.pda_recalculate_after_result_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalcular_pda_wod(old.pda_wod_id);
    return old;
  end if;

  perform public.recalcular_pda_wod(new.pda_wod_id);

  if tg_op = 'UPDATE' and old.pda_wod_id is distinct from new.pda_wod_id then
    perform public.recalcular_pda_wod(old.pda_wod_id);
  end if;

  return new;
end;
$$;

-- --------------------------------------------------------------------------
-- 7. RPC RANKING POR PDA/WOD, SIN INSCRIPCIONES
-- Firma compatible con el frontend anterior; categoría se devuelve como GENERAL.
-- --------------------------------------------------------------------------
create or replace function public.pda_ranking_wod(
  p_wod_id uuid,
  p_categoria_id uuid default null
)
returns table (
  resultado_id uuid,
  posicion integer,
  puntos numeric,
  estado_resultado text,
  completado boolean,
  tiempo_segundos integer,
  tiempo_texto text,
  repeticiones integer,
  carga_libras numeric,
  tie_break_segundos integer,
  usuario_id uuid,
  atleta_nombre text,
  atleta_foto_url text,
  atleta_sexo text,
  categoria_id uuid,
  categoria_nombre text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    r.posicion,
    r.puntos,
    r.estado_resultado,
    r.completado,
    r.tiempo_segundos,
    r.tiempo_texto,
    r.repeticiones,
    r.carga_libras,
    r.tie_break_segundos,
    u.id,
    u.nombre,
    u.foto_url,
    u.sexo,
    null::uuid,
    'General'::text
  from public.pda_resultados r
  join public.usuarios u on u.id = r.usuario_id
  join public.pda_wods w on w.id = r.pda_wod_id
  join public.pda_ediciones e on e.id = w.pda_edicion_id
  where r.pda_wod_id = p_wod_id
    and public.pda_is_active_athlete(r.usuario_id)
    and (
      public.pda_is_admin()
      or (
        e.publicada = true
        and w.publicado = true
        and w.activo = true
        and (w.fecha_publicacion is null or w.fecha_publicacion <= now())
      )
    )
  order by r.posicion nulls last, r.puntos desc, u.nombre;
$$;

-- --------------------------------------------------------------------------
-- 8. RANKING GENERAL: TODOS LOS ATLETAS ACTIVOS, AUN SIN RESULTADO
-- --------------------------------------------------------------------------
create or replace function public.pda_ranking_general(
  p_edicion_id uuid,
  p_categoria_id uuid default null
)
returns table (
  posicion_general bigint,
  usuario_id uuid,
  atleta_nombre text,
  atleta_foto_url text,
  atleta_sexo text,
  categoria_id uuid,
  categoria_nombre text,
  puntos_totales numeric,
  wods_con_resultado bigint,
  wods_completados bigint,
  primeros_lugares bigint,
  segundos_lugares bigint,
  terceros_lugares bigint,
  ultima_posicion integer
)
language sql
stable
security definer
set search_path = public
as $$
  with edition_access as (
    select e.id
    from public.pda_ediciones e
    where e.id = p_edicion_id
      and (public.pda_is_admin() or e.publicada = true)
  ), active_athletes as (
    select * from public.pda_atletas_activos()
  ), visible_wods as (
    select w.*
    from public.pda_wods w
    join edition_access e on e.id = w.pda_edicion_id
    where public.pda_is_admin()
       or (
         w.publicado = true
         and w.activo = true
         and (w.fecha_publicacion is null or w.fecha_publicacion <= now())
       )
  ), athlete_results as (
    select
      a.usuario_id,
      a.atleta_nombre,
      a.atleta_foto_url,
      a.atleta_sexo,
      r.id as resultado_id,
      r.puntos,
      r.posicion,
      r.completado,
      r.estado_resultado,
      w.numero
    from edition_access e
    cross join active_athletes a
    left join visible_wods w on true
    left join public.pda_resultados r
      on r.pda_wod_id = w.id
     and r.usuario_id = a.usuario_id
  ), aggregated as (
    select
      ar.usuario_id,
      ar.atleta_nombre,
      ar.atleta_foto_url,
      ar.atleta_sexo,
      coalesce(sum(ar.puntos), 0)::numeric as puntos_totales,
      count(ar.resultado_id) as wods_con_resultado,
      count(ar.resultado_id) filter (
        where ar.estado_resultado = 'valido' and ar.completado = true
      ) as wods_completados,
      count(ar.resultado_id) filter (where ar.posicion = 1 and ar.puntos > 0) as primeros_lugares,
      count(ar.resultado_id) filter (where ar.posicion = 2 and ar.puntos > 0) as segundos_lugares,
      count(ar.resultado_id) filter (where ar.posicion = 3 and ar.puntos > 0) as terceros_lugares,
      (
        array_agg(ar.posicion order by ar.numero desc nulls last)
        filter (where ar.posicion is not null)
      )[1] as ultima_posicion
    from athlete_results ar
    group by ar.usuario_id, ar.atleta_nombre, ar.atleta_foto_url, ar.atleta_sexo
  )
  select
    rank() over (
      order by
        a.puntos_totales desc,
        a.primeros_lugares desc,
        a.segundos_lugares desc,
        a.terceros_lugares desc,
        a.ultima_posicion asc nulls last,
        a.atleta_nombre asc
    ) as posicion_general,
    a.usuario_id,
    a.atleta_nombre,
    a.atleta_foto_url,
    a.atleta_sexo,
    null::uuid as categoria_id,
    'General'::text as categoria_nombre,
    a.puntos_totales,
    a.wods_con_resultado,
    a.wods_completados,
    a.primeros_lugares,
    a.segundos_lugares,
    a.terceros_lugares,
    a.ultima_posicion
  from aggregated a
  order by posicion_general, a.atleta_nombre;
$$;

revoke all on function public.pda_ranking_wod(uuid, uuid) from public;
revoke all on function public.pda_ranking_general(uuid, uuid) from public;
grant execute on function public.pda_ranking_wod(uuid, uuid) to authenticated;
grant execute on function public.pda_ranking_general(uuid, uuid) to authenticated;

-- --------------------------------------------------------------------------
-- 9. TRIGGERS NUEVOS
-- --------------------------------------------------------------------------
drop trigger if exists trg_pda_resultados_updated_at on public.pda_resultados;
create trigger trg_pda_resultados_updated_at
before update on public.pda_resultados
for each row execute function public.pda_set_updated_at();

drop trigger if exists trg_pda_resultados_validate on public.pda_resultados;
create trigger trg_pda_resultados_validate
before insert or update on public.pda_resultados
for each row execute function public.pda_validate_result();

drop trigger if exists trg_pda_resultados_recalculate_insert_delete on public.pda_resultados;
create trigger trg_pda_resultados_recalculate_insert_delete
after insert or delete on public.pda_resultados
for each row execute function public.pda_recalculate_after_result_change();

drop trigger if exists trg_pda_resultados_recalculate_update on public.pda_resultados;
create trigger trg_pda_resultados_recalculate_update
after update of
  pda_wod_id,
  usuario_id,
  estado_resultado,
  completado,
  tiempo_segundos,
  repeticiones,
  tie_break_segundos
on public.pda_resultados
for each row execute function public.pda_recalculate_after_result_change();

-- --------------------------------------------------------------------------
-- 10. RLS RESULTADOS SIN INSCRIPCIONES
-- --------------------------------------------------------------------------
alter table public.pda_resultados enable row level security;
grant select, insert, update, delete on public.pda_resultados to authenticated;

create policy pda_resultados_select
on public.pda_resultados
for select to authenticated
using (
  public.pda_is_admin()
  or usuario_id = auth.uid()
  or exists (
    select 1
    from public.pda_wods w
    join public.pda_ediciones e on e.id = w.pda_edicion_id
    where w.id = pda_resultados.pda_wod_id
      and e.publicada = true
      and w.publicado = true
      and w.activo = true
      and (w.fecha_publicacion is null or w.fecha_publicacion <= now())
  )
);

create policy pda_resultados_insert
on public.pda_resultados
for insert to authenticated
with check (
  public.pda_is_admin()
  or (
    usuario_id = auth.uid()
    and public.pda_is_active_athlete(auth.uid())
    and exists (
      select 1
      from public.pda_wods w
      join public.pda_ediciones e on e.id = w.pda_edicion_id
      where w.id = pda_resultados.pda_wod_id
        and e.publicada = true
        and w.publicado = true
        and w.activo = true
        and w.fecha = timezone('America/Guayaquil', now())::date
        and (w.fecha_publicacion is null or w.fecha_publicacion <= now())
    )
  )
);

create policy pda_resultados_update
on public.pda_resultados
for update to authenticated
using (
  public.pda_is_admin()
  or (
    usuario_id = auth.uid()
    and public.pda_is_active_athlete(auth.uid())
    and exists (
      select 1
      from public.pda_wods w
      join public.pda_ediciones e on e.id = w.pda_edicion_id
      where w.id = pda_resultados.pda_wod_id
        and e.publicada = true
        and w.publicado = true
        and w.activo = true
        and w.fecha = timezone('America/Guayaquil', now())::date
        and (w.fecha_publicacion is null or w.fecha_publicacion <= now())
    )
  )
)
with check (
  public.pda_is_admin()
  or (
    usuario_id = auth.uid()
    and public.pda_is_active_athlete(auth.uid())
  )
);

create policy pda_resultados_delete
on public.pda_resultados
for delete to authenticated
using (public.pda_is_admin());

-- --------------------------------------------------------------------------
-- 11. RECALCULAR RESULTADOS EXISTENTES YA MIGRADOS
-- --------------------------------------------------------------------------
do $$
declare
  w record;
begin
  for w in select id from public.pda_wods loop
    perform public.recalcular_pda_wod(w.id);
  end loop;
end;
$$;

commit;
