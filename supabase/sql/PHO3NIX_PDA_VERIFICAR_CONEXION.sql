-- Ejecuta esto si después de aplicar la corrección quieres comprobar la conexión.

-- 1. Ediciones
select id, anio, nombre, estado, publicada, fecha_inicio, fecha_fin
from public.pda_ediciones
order by anio desc;

-- 2. WODs de cada edición
select
  e.anio,
  w.numero,
  w.nombre,
  w.fecha,
  w.publicado,
  w.activo,
  w.fecha_publicacion
from public.pda_wods w
join public.pda_ediciones e on e.id = w.pda_edicion_id
order by e.anio desc, w.numero;

-- 3. Inscripciones
select
  e.anio,
  i.usuario_id,
  u.nombre as atleta,
  c.nombre as categoria,
  i.estado
from public.pda_inscripciones i
join public.pda_ediciones e on e.id = i.pda_edicion_id
join public.usuarios u on u.id = i.usuario_id
join public.pda_categorias c on c.id = i.categoria_id
order by e.anio desc, u.nombre;

-- 4. Políticas PDA instaladas
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename like 'pda_%'
order by tablename, policyname;
