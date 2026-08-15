import { supabase } from "../../../../config/supabase.js"
import { getPdaYear } from "../utils/studentPdaUtils.js"

export const EMPTY_STUDENT_PDA = {
  profile: null,
  membership: null,
  edition: null,
  category: null,
  wods: [],
  results: [],
  generalRanking: [],
  athleteRank: null,
}

export async function loadStudentPdaData({ authUser, authProfile } = {}) {
  if (!authUser?.id) throw new Error("No active athlete session.")

  const [profile, membership] = await Promise.all([
    loadProfile(authUser, authProfile),
    loadMembership(authUser.id),
  ])

  const edition = await loadEdition()

  if (!edition?.id) {
    return {
      ...EMPTY_STUDENT_PDA,
      profile,
      membership,
    }
  }

  const wods = await loadWods(edition.id)

  const [results, generalRanking] = await Promise.all([
    loadAthleteResults(authUser.id, wods),
    loadGeneralRanking(edition.id),
  ])

  const athleteRank =
    generalRanking.find((row) => row?.usuario_id === authUser.id) || null

  return {
    ...EMPTY_STUDENT_PDA,
    profile,
    membership,
    edition,
    wods,
    results,
    generalRanking,
    athleteRank,
  }
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

async function loadProfile(authUser, authProfile) {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id,nombre,email,role,fecha_nacimiento,sexo,foto_url")
    .eq("id", authUser.id)
    .maybeSingle()

  if (error) throw error

  return (
    data ||
    authProfile || {
      id: authUser.id,
      nombre: authUser.email || "Atleta PHO3NIX",
      email: authUser.email,
      foto_url: null,
    }
  )
}

async function loadMembership(userId) {
  const { data, error } = await supabase
    .from("mensualidades")
    .select("id,usuario_id,estado,fecha_inicio,fecha_fin,created_at")
    .eq("usuario_id", userId)
    .order("fecha_fin", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)

  if (error) throw error
  return data?.[0] || null
}

async function loadEdition() {
  const seasonYear = getPdaYear()

  const { data, error } = await supabase
    .from("pda_ediciones")
    .select(
      "id,anio,nombre,descripcion,fecha_inicio,fecha_fin,estado,publicada,created_at,updated_at"
    )
    .eq("anio", seasonYear)
    .eq("publicada", true)
    .order("updated_at", { ascending: false })
    .limit(1)

  if (error) throw error
  return data?.[0] || null
}

async function loadWods(editionId) {
  const { data, error } = await supabase
    .from("pda_wods")
    .select(`
      id,
      pda_edicion_id,
      numero,
      nombre,
      descripcion,
      tipo_wod,
      tipo_resultado,
      modo_ranking,
      modalidad,
      fecha,
      publicado,
      activo,
      fecha_publicacion
    `)
    .eq("pda_edicion_id", editionId)
    .eq("publicado", true)
    .eq("activo", true)
    .order("fecha", { ascending: true, nullsFirst: false })
    .order("numero", { ascending: true })

  if (error) throw error
  return data || []
}

async function loadAthleteResults(userId, wods) {
  const wodIds = (wods || [])
    .map((wod) => wod?.id)
    .filter(Boolean)

  if (!userId || wodIds.length === 0) return []

  const { data, error } = await supabase
    .from("pda_resultados")
    .select(`
      id,
      pda_wod_id,
      usuario_id,
      estado_resultado,
      completado,
      tiempo_segundos,
      tiempo_texto,
      repeticiones,
      carga_libras,
      tie_break_segundos,
      posicion,
      puntos,
      created_at,
      updated_at
    `)
    .eq("usuario_id", userId)
    .in("pda_wod_id", wodIds)

  if (error) throw error
  return data || []
}

async function loadGeneralRanking(editionId) {
  if (!editionId) return []

  const { data, error } = await supabase.rpc("pda_ranking_general", {
    p_edicion_id: editionId,
    p_categoria_id: null,
  })

  if (error) throw error
  return data || []
}
