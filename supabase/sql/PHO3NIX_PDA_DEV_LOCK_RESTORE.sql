-- ============================================================
-- PHO3NIX V2 · REMOVE TEMPORARY PDA DEVELOPMENT UNLOCK
-- Run this when athlete PDA development is complete.
-- Production policies are NOT recreated because they were never removed.
-- ============================================================

begin;

drop policy if exists pda_ediciones_dev_select on public.pda_ediciones;
drop policy if exists pda_categorias_dev_select on public.pda_categorias;
drop policy if exists pda_wods_dev_select on public.pda_wods;
drop policy if exists pda_inscripciones_dev_select on public.pda_inscripciones;
drop policy if exists pda_resultados_dev_select on public.pda_resultados;
drop policy if exists pda_resultados_dev_insert on public.pda_resultados;
drop policy if exists pda_resultados_dev_update on public.pda_resultados;

drop function if exists public.pda_ranking_wod_dev(uuid, uuid);
drop function if exists public.pda_ranking_general_dev(uuid, uuid);

commit;
