-- ============================================================
-- PHO3NIX V2 · CONEXIÓN PDA ADMIN <-> ATLETA
-- Ejecutar UNA VEZ después de tener instalado el módulo PDA V2.
--
-- Objetivo:
-- 1) La fuente de verdad es pda_ediciones.estado = 'activa'.
-- 2) Al activar desde Admin, publicada se sincroniza automáticamente.
-- 3) RLS permite al atleta leer la edición ACTIVA del año.
-- 4) pda_is_admin usa la tabla real de V2: public.usuarios.role.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. ADMIN REAL DE PHO3NIX V2
-- ------------------------------------------------------------
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
      and lower(coalesce(u.role, '')) in ('admin', 'administrador')
  );
$$;

revoke all on function public.pda_is_admin() from public;
grant execute on function public.pda_is_admin() to authenticated;

-- ------------------------------------------------------------
-- 2. SINCRONIZAR ACTIVACIÓN DEL ADMIN CON PUBLICACIÓN
-- ------------------------------------------------------------
create or replace function public.pda_sync_admin_activation()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- En PHO3NIX V2, cuando Admin activa la edición, el atleta debe verla.
  if new.estado = 'activa' then
    new.publicada := true;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_pda_ediciones_sync_admin_activation on public.pda_ediciones;

create trigger trg_pda_ediciones_sync_admin_activation
before insert or update of estado, publicada
on public.pda_ediciones
for each row
execute function public.pda_sync_admin_activation();

-- Corrige una edición que ya haya sido activada anteriormente.
update public.pda_ediciones
set publicada = true
where estado = 'activa'
  and publicada is distinct from true;

-- ------------------------------------------------------------
-- 3. RLS: EDICIÓN Y CATEGORÍAS VISIBLES CUANDO EL PDA ESTÁ ACTIVO
-- ------------------------------------------------------------
drop policy if exists pda_ediciones_select on public.pda_ediciones;
create policy pda_ediciones_select
on public.pda_ediciones
for select
to authenticated
using (
  public.pda_is_admin()
  or estado = 'activa'
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
      and (e.estado = 'activa' or e.publicada = true)
  )
);

-- ------------------------------------------------------------
-- 4. RLS: WODs SOLO CUANDO EL PDA ESTÁ ACTIVO Y EL WOD PUBLICADO
-- ------------------------------------------------------------
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
        and e.estado = 'activa'
    )
  )
);

commit;

-- VERIFICACIÓN RÁPIDA: debe mostrar la edición activa del año actual.
select
  id,
  anio,
  nombre,
  estado,
  publicada,
  fecha_inicio,
  fecha_fin
from public.pda_ediciones
order by anio desc;
