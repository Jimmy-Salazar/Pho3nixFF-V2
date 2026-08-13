-- ============================================================
-- PHO3NIX V2 · PDA DEL ATLETA
-- Permite al atleta registrar/modificar SOLO su resultado PDA.
-- La edición, inscripción, WOD, posición y puntos siguen bajo
-- control del administrador y de las funciones de ranking.
-- Zona horaria operativa: America/Guayaquil.
-- ============================================================

begin;

grant select, insert, update on table public.pda_resultados to authenticated;

-- ------------------------------------------------------------
-- Guard adicional: un atleta nunca puede escribir manualmente
-- posición, puntos ni campos legados de carga/tie-break.
-- El administrador conserva el comportamiento actual.
-- ------------------------------------------------------------

create or replace function public.pda_guard_athlete_result_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.pda_is_admin() then
    new.posicion := null;
    new.puntos := 0;
    new.carga_libras := null;
    new.tie_break_segundos := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_pda_guard_athlete_result_fields on public.pda_resultados;

create trigger trg_pda_guard_athlete_result_fields
before insert or update on public.pda_resultados
for each row
execute function public.pda_guard_athlete_result_fields();

-- ------------------------------------------------------------
-- INSERT: únicamente la propia inscripción activa y el día
-- calendario del WOD.
-- ------------------------------------------------------------

drop policy if exists pda_resultados_athlete_insert on public.pda_resultados;

create policy pda_resultados_athlete_insert
on public.pda_resultados
for insert
to authenticated
with check (
  public.pda_is_admin()
  or exists (
    select 1
    from public.pda_inscripciones i
    join public.pda_wods w
      on w.id = pda_resultados.pda_wod_id
     and w.pda_edicion_id = i.pda_edicion_id
    join public.pda_ediciones e
      on e.id = i.pda_edicion_id
    where i.id = pda_resultados.pda_inscripcion_id
      and i.usuario_id = auth.uid()
      and i.estado = 'activa'
      and e.estado = 'activa'
      and e.publicada = true
      and w.publicado = true
      and w.activo = true
      and (w.fecha_publicacion is null or w.fecha_publicacion <= now())
      and w.fecha = (timezone('America/Guayaquil', now()))::date
  )
);

-- ------------------------------------------------------------
-- UPDATE: solamente el resultado perteneciente al propio atleta
-- y únicamente el día del WOD.
-- ------------------------------------------------------------

drop policy if exists pda_resultados_athlete_update on public.pda_resultados;

create policy pda_resultados_athlete_update
on public.pda_resultados
for update
to authenticated
using (
  public.pda_is_admin()
  or exists (
    select 1
    from public.pda_inscripciones i
    join public.pda_wods w
      on w.id = pda_resultados.pda_wod_id
     and w.pda_edicion_id = i.pda_edicion_id
    join public.pda_ediciones e
      on e.id = i.pda_edicion_id
    where i.id = pda_resultados.pda_inscripcion_id
      and i.usuario_id = auth.uid()
      and i.estado = 'activa'
      and e.estado = 'activa'
      and e.publicada = true
      and w.publicado = true
      and w.activo = true
      and (w.fecha_publicacion is null or w.fecha_publicacion <= now())
      and w.fecha = (timezone('America/Guayaquil', now()))::date
  )
)
with check (
  public.pda_is_admin()
  or exists (
    select 1
    from public.pda_inscripciones i
    join public.pda_wods w
      on w.id = pda_resultados.pda_wod_id
     and w.pda_edicion_id = i.pda_edicion_id
    join public.pda_ediciones e
      on e.id = i.pda_edicion_id
    where i.id = pda_resultados.pda_inscripcion_id
      and i.usuario_id = auth.uid()
      and i.estado = 'activa'
      and e.estado = 'activa'
      and e.publicada = true
      and w.publicado = true
      and w.activo = true
      and (w.fecha_publicacion is null or w.fecha_publicacion <= now())
      and w.fecha = (timezone('America/Guayaquil', now()))::date
  )
);

commit;
