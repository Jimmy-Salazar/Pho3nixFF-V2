-- ============================================================
-- PHO3NIX V2 · PDA ATHLETE · TEMPORARY DEVELOPMENT UNLOCK
--
-- PURPOSE
-- - Develop the athlete PDA now, outside December.
-- - Read the current-year PDA even if not active/published.
-- - Read current-year PDA WODs even if draft/unpublished.
-- - Let an athlete with an ACTIVE inscription test his/her own result
--   without waiting for the official WOD date.
-- - Provide development ranking RPCs that do not require publication.
--
-- SAFETY
-- - Does NOT drop/replace production policies.
-- - Adds only policies/functions with *_dev_* names.
-- - Athlete can still write ONLY results attached to their own active
--   inscription and a WOD from the same current-year edition.
--
-- REMOVE AFTER DEVELOPMENT with PHO3NIX_PDA_DEV_LOCK_RESTORE.sql
-- ============================================================

begin;

grant select on table public.pda_ediciones to authenticated;
grant select on table public.pda_categorias to authenticated;
grant select on table public.pda_wods to authenticated;
grant select on table public.pda_inscripciones to authenticated;
grant select, insert, update on table public.pda_resultados to authenticated;

-- Current PDA year in the operational timezone.
-- This stays generic and does not hardcode 2026.

drop policy if exists pda_ediciones_dev_select on public.pda_ediciones;
create policy pda_ediciones_dev_select
on public.pda_ediciones
for select to authenticated
using (
  anio = extract(year from timezone('America/Guayaquil', now()))::integer
);

drop policy if exists pda_categorias_dev_select on public.pda_categorias;
create policy pda_categorias_dev_select
on public.pda_categorias
for select to authenticated
using (
  exists (
    select 1
    from public.pda_ediciones e
    where e.id = pda_categorias.pda_edicion_id
      and e.anio = extract(year from timezone('America/Guayaquil', now()))::integer
  )
);

drop policy if exists pda_wods_dev_select on public.pda_wods;
create policy pda_wods_dev_select
on public.pda_wods
for select to authenticated
using (
  exists (
    select 1
    from public.pda_ediciones e
    where e.id = pda_wods.pda_edicion_id
      and e.anio = extract(year from timezone('America/Guayaquil', now()))::integer
  )
);

drop policy if exists pda_inscripciones_dev_select on public.pda_inscripciones;
create policy pda_inscripciones_dev_select
on public.pda_inscripciones
for select to authenticated
using (
  usuario_id = auth.uid()
  and exists (
    select 1
    from public.pda_ediciones e
    where e.id = pda_inscripciones.pda_edicion_id
      and e.anio = extract(year from timezone('America/Guayaquil', now()))::integer
  )
);

drop policy if exists pda_resultados_dev_select on public.pda_resultados;
create policy pda_resultados_dev_select
on public.pda_resultados
for select to authenticated
using (
  exists (
    select 1
    from public.pda_inscripciones i
    join public.pda_ediciones e on e.id = i.pda_edicion_id
    where i.id = pda_resultados.pda_inscripcion_id
      and i.usuario_id = auth.uid()
      and e.anio = extract(year from timezone('America/Guayaquil', now()))::integer
  )
);

drop policy if exists pda_resultados_dev_insert on public.pda_resultados;
create policy pda_resultados_dev_insert
on public.pda_resultados
for insert to authenticated
with check (
  exists (
    select 1
    from public.pda_inscripciones i
    join public.pda_wods w
      on w.id = pda_resultados.pda_wod_id
     and w.pda_edicion_id = i.pda_edicion_id
    join public.pda_ediciones e on e.id = i.pda_edicion_id
    where i.id = pda_resultados.pda_inscripcion_id
      and i.usuario_id = auth.uid()
      and i.estado = 'activa'
      and e.anio = extract(year from timezone('America/Guayaquil', now()))::integer
  )
);

drop policy if exists pda_resultados_dev_update on public.pda_resultados;
create policy pda_resultados_dev_update
on public.pda_resultados
for update to authenticated
using (
  exists (
    select 1
    from public.pda_inscripciones i
    join public.pda_wods w
      on w.id = pda_resultados.pda_wod_id
     and w.pda_edicion_id = i.pda_edicion_id
    join public.pda_ediciones e on e.id = i.pda_edicion_id
    where i.id = pda_resultados.pda_inscripcion_id
      and i.usuario_id = auth.uid()
      and i.estado = 'activa'
      and e.anio = extract(year from timezone('America/Guayaquil', now()))::integer
  )
)
with check (
  exists (
    select 1
    from public.pda_inscripciones i
    join public.pda_wods w
      on w.id = pda_resultados.pda_wod_id
     and w.pda_edicion_id = i.pda_edicion_id
    join public.pda_ediciones e on e.id = i.pda_edicion_id
    where i.id = pda_resultados.pda_inscripcion_id
      and i.usuario_id = auth.uid()
      and i.estado = 'activa'
      and e.anio = extract(year from timezone('America/Guayaquil', now()))::integer
  )
);

-- Development WOD ranking: same output as production, without publication/activation gating.
create or replace function public.pda_ranking_wod_dev(
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
    c.id,
    c.nombre
  from public.pda_resultados r
  join public.pda_inscripciones i on i.id = r.pda_inscripcion_id
  join public.usuarios u on u.id = i.usuario_id
  join public.pda_categorias c on c.id = i.categoria_id
  join public.pda_wods w on w.id = r.pda_wod_id
  join public.pda_ediciones e on e.id = w.pda_edicion_id
  where r.pda_wod_id = p_wod_id
    and (p_categoria_id is null or i.categoria_id = p_categoria_id)
    and e.anio = extract(year from timezone('America/Guayaquil', now()))::integer
  order by r.posicion nulls last, r.puntos desc, u.nombre;
$$;

create or replace function public.pda_ranking_general_dev(
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
  with athlete_results as (
    select
      i.usuario_id,
      i.categoria_id,
      r.puntos,
      r.posicion,
      r.completado,
      r.estado_resultado,
      w.numero
    from public.pda_inscripciones i
    join public.pda_ediciones e on e.id = i.pda_edicion_id
    left join public.pda_resultados r on r.pda_inscripcion_id = i.id
    left join public.pda_wods w on w.id = r.pda_wod_id
    where i.pda_edicion_id = p_edicion_id
      and i.estado = 'activa'
      and (p_categoria_id is null or i.categoria_id = p_categoria_id)
      and e.anio = extract(year from timezone('America/Guayaquil', now()))::integer
  ), aggregated as (
    select
      ar.usuario_id,
      ar.categoria_id,
      coalesce(sum(ar.puntos), 0)::numeric as puntos_totales,
      count(ar.posicion) as wods_con_resultado,
      count(*) filter (where ar.estado_resultado = 'valido' and ar.completado = true) as wods_completados,
      count(*) filter (where ar.posicion = 1 and ar.puntos > 0) as primeros_lugares,
      count(*) filter (where ar.posicion = 2 and ar.puntos > 0) as segundos_lugares,
      count(*) filter (where ar.posicion = 3 and ar.puntos > 0) as terceros_lugares,
      (
        array_agg(ar.posicion order by ar.numero desc nulls last)
        filter (where ar.posicion is not null)
      )[1] as ultima_posicion
    from athlete_results ar
    group by ar.usuario_id, ar.categoria_id
  ), detailed as (
    select
      a.*,
      u.nombre as atleta_nombre,
      u.foto_url as atleta_foto_url,
      u.sexo as atleta_sexo,
      c.nombre as categoria_nombre
    from aggregated a
    join public.usuarios u on u.id = a.usuario_id
    join public.pda_categorias c on c.id = a.categoria_id
  )
  select
    rank() over (
      partition by d.categoria_id
      order by
        d.puntos_totales desc,
        d.primeros_lugares desc,
        d.segundos_lugares desc,
        d.terceros_lugares desc,
        d.ultima_posicion asc nulls last
    ) as posicion_general,
    d.usuario_id,
    d.atleta_nombre,
    d.atleta_foto_url,
    d.atleta_sexo,
    d.categoria_id,
    d.categoria_nombre,
    d.puntos_totales,
    d.wods_con_resultado,
    d.wods_completados,
    d.primeros_lugares,
    d.segundos_lugares,
    d.terceros_lugares,
    d.ultima_posicion
  from detailed d
  order by d.categoria_nombre, posicion_general, d.atleta_nombre;
$$;

revoke all on function public.pda_ranking_wod_dev(uuid, uuid) from public;
revoke all on function public.pda_ranking_general_dev(uuid, uuid) from public;
grant execute on function public.pda_ranking_wod_dev(uuid, uuid) to authenticated;
grant execute on function public.pda_ranking_general_dev(uuid, uuid) to authenticated;

commit;
