-- ============================================================================
-- PHO3NIX V2 · PDA PRODUCTION CLOSE · NO ENROLLMENT
-- Production security closure after migrating PDA to usuario_id.
-- Does NOT recreate pda_inscripciones as an operational dependency.
-- ============================================================================

begin;

-- Required functions must already exist from PHO3NIX_PDA_SIN_INSCRIPCIONES.sql.
do $$
begin
  if to_regprocedure('public.pda_is_admin()') is null then
    raise exception 'PDA_PRODUCTION_CLOSE_MISSING_pda_is_admin';
  end if;

  if to_regprocedure('public.pda_is_active_athlete(uuid)') is null then
    raise exception 'PDA_PRODUCTION_CLOSE_MISSING_pda_is_active_athlete';
  end if;

  if to_regprocedure('public.pda_ranking_wod(uuid,uuid)') is null then
    raise exception 'PDA_PRODUCTION_CLOSE_MISSING_pda_ranking_wod';
  end if;

  if to_regprocedure('public.pda_ranking_general(uuid,uuid)') is null then
    raise exception 'PDA_PRODUCTION_CLOSE_MISSING_pda_ranking_general';
  end if;
end;
$$;

-- --------------------------------------------------------------------------
-- 1. REMOVE EVERY KNOWN TEMPORARY DEVELOPMENT BYPASS
-- --------------------------------------------------------------------------
drop policy if exists pda_ediciones_dev_select on public.pda_ediciones;
drop policy if exists pda_categorias_dev_select on public.pda_categorias;
drop policy if exists pda_wods_dev_select on public.pda_wods;
drop policy if exists pda_inscripciones_dev_select on public.pda_inscripciones;
drop policy if exists pda_participant_dev_insert on public.pda_inscripciones;
drop policy if exists pda_resultados_dev_select on public.pda_resultados;
drop policy if exists pda_resultados_dev_insert on public.pda_resultados;
drop policy if exists pda_resultados_dev_update on public.pda_resultados;

drop policy if exists pda_ediciones_dev_read on public.pda_ediciones;
drop policy if exists pda_categorias_dev_read on public.pda_categorias;
drop policy if exists pda_wods_dev_read on public.pda_wods;

drop function if exists public.pda_ranking_wod_dev(uuid, uuid);
drop function if exists public.pda_ranking_general_dev(uuid, uuid);
drop function if exists public.pda_ensure_athlete_entry_dev(uuid);

-- --------------------------------------------------------------------------
-- 2. EDITION/CATEGORY/WOD PRODUCTION READ
-- Admin can read all.
-- Athlete reads only published edition and published+active PDA/WOD.
-- --------------------------------------------------------------------------
alter table public.pda_ediciones enable row level security;
alter table public.pda_categorias enable row level security;
alter table public.pda_wods enable row level security;

grant select on public.pda_ediciones to authenticated;
grant select on public.pda_categorias to authenticated;
grant select on public.pda_wods to authenticated;

drop policy if exists pda_ediciones_select on public.pda_ediciones;
create policy pda_ediciones_select
on public.pda_ediciones
for select
to authenticated
using (
  public.pda_is_admin()
  or publicada = true
);

drop policy if exists pda_categorias_select on public.pda_categorias;
create policy pda_categorias_select
on public.pda_categorias
for select
to authenticated
using (
  public.pda_is_admin()
  or exists (
    select 1
    from public.pda_ediciones e
    where e.id = pda_categorias.pda_edicion_id
      and e.publicada = true
  )
);

drop policy if exists pda_wods_select on public.pda_wods;
create policy pda_wods_select
on public.pda_wods
for select
to authenticated
using (
  public.pda_is_admin()
  or (
    publicado = true
    and activo = true
    and (fecha_publicacion is null or fecha_publicacion <= now())
    and exists (
      select 1
      from public.pda_ediciones e
      where e.id = pda_wods.pda_edicion_id
        and e.publicada = true
    )
  )
);

-- --------------------------------------------------------------------------
-- 3. pda_inscripciones IS LEGACY ONLY
-- --------------------------------------------------------------------------
alter table public.pda_inscripciones enable row level security;

drop policy if exists pda_inscripciones_legacy_admin_select on public.pda_inscripciones;
create policy pda_inscripciones_legacy_admin_select
on public.pda_inscripciones
for select
to authenticated
using (public.pda_is_admin());

grant select on public.pda_inscripciones to authenticated;
revoke insert, update, delete on public.pda_inscripciones from authenticated;

comment on table public.pda_inscripciones is
  'LEGACY. PDA V2 does not use enrollments. Active athletes participate automatically.';

-- --------------------------------------------------------------------------
-- 4. RESULTS PRODUCTION RLS — DIRECT usuario_id OWNERSHIP
-- --------------------------------------------------------------------------
alter table public.pda_resultados enable row level security;
grant select, insert, update, delete on public.pda_resultados to authenticated;

drop policy if exists pda_resultados_select on public.pda_resultados;
create policy pda_resultados_select
on public.pda_resultados
for select
to authenticated
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

drop policy if exists pda_resultados_insert on public.pda_resultados;
create policy pda_resultados_insert
on public.pda_resultados
for insert
to authenticated
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

drop policy if exists pda_resultados_update on public.pda_resultados;
create policy pda_resultados_update
on public.pda_resultados
for update
to authenticated
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

drop policy if exists pda_resultados_delete on public.pda_resultados;
create policy pda_resultados_delete
on public.pda_resultados
for delete
to authenticated
using (public.pda_is_admin());

commit;
