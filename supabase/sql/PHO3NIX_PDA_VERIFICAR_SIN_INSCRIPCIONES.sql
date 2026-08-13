-- PHO3NIX V2 · VERIFICACIÓN PDA SIN INSCRIPCIONES

-- 1) pda_resultados debe tener usuario_id y NO pda_inscripcion_id.
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'pda_resultados'
order by ordinal_position;

-- 2) Todos los resultados deben tener atleta directo y no duplicarse por PDA/WOD.
select
  count(*) as total_resultados,
  count(*) filter (where usuario_id is null) as sin_usuario
from public.pda_resultados;

select pda_wod_id, usuario_id, count(*) as duplicados
from public.pda_resultados
group by pda_wod_id, usuario_id
having count(*) > 1;

-- 3) Atletas activos que participan automáticamente.
select *
from public.pda_admin_atletas_activos();

-- 4) No deben existir políticas de escritura nuevas sobre pda_inscripciones.
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('pda_inscripciones', 'pda_resultados')
order by tablename, policyname;

-- 5) Funciones nuevas.
select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'pda_is_active_athlete',
    'pda_atletas_activos',
    'pda_admin_atletas_activos',
    'pda_ranking_wod',
    'pda_ranking_general',
    'recalcular_pda_wod'
  )
order by routine_name;
