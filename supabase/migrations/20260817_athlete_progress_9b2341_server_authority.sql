-- ============================================================================
-- PHO3NIX V2 · 9B.234.1 · SERVER AUTHORITY MICROHARDENING
-- Prevent authenticated clients from persisting nutrition analyses directly.
-- The deployed Edge Function persists through service_role after auth + claim.
-- ============================================================================

begin;

drop policy if exists "Alumno crea sus analisis nutricionales"
  on public.nutricion_analisis;

revoke insert on table public.nutricion_analisis
  from public, anon, authenticated;

commit;
