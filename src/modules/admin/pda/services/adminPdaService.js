import { supabase } from "../../../../config/supabase.js"

const EDITION_SELECT = [
  "id",
  "anio",
  "nombre",
  "descripcion",
  "fecha_inicio",
  "fecha_fin",
  "estado",
  "publicada",
  "created_by",
  "created_at",
  "updated_at",
].join(",")

const WOD_SELECT = [
  "id",
  "pda_edicion_id",
  "numero",
  "nombre",
  "descripcion",
  "tipo_wod",
  "tipo_resultado",
  "modo_ranking",
  "modalidad",
  "fecha",
  "time_cap_segundos",
  "publicado",
  "activo",
  "fecha_publicacion",
  "calorias_min",
  "calorias_max",
  "intensidad_estimada",
  "duracion_estimada",
  "calorias_nota",
  "created_at",
  "updated_at",
].join(",")

const RESULT_SELECT = [
  "id",
  "pda_wod_id",
  "usuario_id",
  "estado_resultado",
  "completado",
  "tiempo_segundos",
  "tiempo_texto",
  "repeticiones",
  "carga_libras",
  "tie_break_segundos",
  "notas",
  "posicion",
  "puntos",
  "created_at",
  "updated_at",
].join(",")

export async function fetchCurrentPdaAdminProfile(user, fallback = {}) {
  if (!user?.id) {
    return {
      id: null,
      nombre: fallback.nombre || user?.email || "PHO3NIX",
      email: user?.email || "",
      role: fallback.rol || "admin",
      foto_url: "",
    }
  }

  const { data, error } = await supabase
    .from("usuarios")
    .select("id,nombre,email,role,foto_url")
    .eq("id", user.id)
    .maybeSingle()

  if (error) throw error

  return data || {
    id: user.id,
    nombre: fallback.nombre || user.email || "PHO3NIX",
    email: user.email || "",
    role: fallback.rol || "admin",
    foto_url: "",
  }
}

export async function fetchPdaEditions() {
  const { data, error } = await supabase
    .from("pda_ediciones")
    .select(EDITION_SELECT)
    .order("anio", { ascending: false })

  if (error) throw error
  return data || []
}

export async function fetchPdaEditionData(editionId) {
  if (!editionId) {
    return {
      categories: [],
      wods: [],
      athletes: [],
      results: [],
      pointsTable: [],
    }
  }

  const [categoriesResponse, wodsResponse, athletesResponse, pointsResponse] =
    await Promise.all([
      supabase
        .from("pda_categorias")
        .select("id,pda_edicion_id,nombre,sexo,nivel,activa,created_at,updated_at")
        .eq("pda_edicion_id", editionId)
        .order("nombre", { ascending: true }),
      supabase
        .from("pda_wods")
        .select(WOD_SELECT)
        .eq("pda_edicion_id", editionId)
        .order("numero", { ascending: true }),
      supabase.rpc("pda_admin_atletas_activos"),
      supabase
        .from("pda_tabla_puntos")
        .select("id,pda_edicion_id,posicion,puntos")
        .eq("pda_edicion_id", editionId)
        .order("posicion", { ascending: true }),
    ])

  const responses = [categoriesResponse, wodsResponse, athletesResponse, pointsResponse]
  const firstError = responses.find((response) => response.error)?.error
  if (firstError) throw firstError

  const wods = wodsResponse.data || []
  const results = await fetchEditionResults(wods.map((row) => row.id))
  const athletes = (athletesResponse.data || []).map((row) => ({
    id: row.usuario_id,
    nombre: row.atleta_nombre,
    email: row.atleta_email,
    foto_url: row.atleta_foto_url,
    sexo: row.atleta_sexo,
    mensualidad_id: row.mensualidad_id,
    fecha_inicio: row.fecha_inicio,
    fecha_fin: row.fecha_fin,
    estado_mensualidad: row.estado_mensualidad,
  }))

  return {
    categories: categoriesResponse.data || [],
    wods,
    athletes,
    results,
    pointsTable: pointsResponse.data || [],
  }
}

async function fetchEditionResults(wodIds) {
  if (!Array.isArray(wodIds) || wodIds.length === 0) return []

  const { data, error } = await supabase
    .from("pda_resultados")
    .select(RESULT_SELECT)
    .in("pda_wod_id", wodIds)

  if (error) throw error
  return data || []
}

export async function createPdaEdition(payload) {
  const { data: authData } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from("pda_ediciones")
    .insert({
      ...payload,
      estado: "borrador",
      publicada: false,
      created_by: authData?.user?.id || null,
    })
    .select(EDITION_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function updatePdaEdition(editionId, payload) {
  const { data, error } = await supabase
    .from("pda_ediciones")
    .update(payload)
    .eq("id", editionId)
    .select(EDITION_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function setPdaEditionState(editionId, statePayload) {
  return updatePdaEdition(editionId, statePayload)
}

export async function createPdaWod(payload) {
  const { data, error } = await supabase
    .from("pda_wods")
    .insert(payload)
    .select(WOD_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function updatePdaWod(wodId, payload) {
  const { data, error } = await supabase
    .from("pda_wods")
    .update(payload)
    .eq("id", wodId)
    .select(WOD_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function setPdaWodPublished(wodId, published) {
  const { data, error } = await supabase
    .from("pda_wods")
    .update({
      publicado: published,
      activo: published,
      fecha_publicacion: published ? new Date().toISOString() : null,
    })
    .eq("id", wodId)
    .select(WOD_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function deletePdaWod(wodId) {
  const { error } = await supabase.from("pda_wods").delete().eq("id", wodId)
  if (error) throw error
}

export async function savePdaResult(payload) {
  const { data, error } = await supabase
    .from("pda_resultados")
    .upsert(payload, { onConflict: "pda_wod_id,usuario_id" })
    .select(RESULT_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function deletePdaResult(resultId) {
  const { error } = await supabase.from("pda_resultados").delete().eq("id", resultId)
  if (error) throw error
}

export async function fetchPdaWodRanking(wodId) {
  if (!wodId) return []

  const { data, error } = await supabase.rpc("pda_ranking_wod", {
    p_wod_id: wodId,
    p_categoria_id: null,
  })

  if (error) throw error
  return data || []
}

export async function fetchPdaGeneralRanking(editionId) {
  if (!editionId) return []

  const { data, error } = await supabase.rpc("pda_ranking_general", {
    p_edicion_id: editionId,
    p_categoria_id: null,
  })

  if (error) throw error
  return data || []
}
