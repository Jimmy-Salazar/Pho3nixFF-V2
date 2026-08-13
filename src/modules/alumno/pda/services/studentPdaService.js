import { supabase } from "../../../../config/supabase.js"
import {
  getPdaYear,
  isPdaDevelopmentUnlockEnabled,
} from "../utils/studentPdaUtils.js"

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

  // IMPORTANT:
  // PDA does not use athlete enrollment/registration.
  // We intentionally do not read or write pda_inscripciones here.
  // Results will be connected directly to the athlete in the next database refinement.
  return {
    ...EMPTY_STUDENT_PDA,
    profile,
    membership,
    edition,
    wods,
  }
}

export async function fetchPdaWodRanking(wodId) {
  if (!wodId) return []

  // Keep ranking non-blocking while the PDA result model is being migrated
  // away from pda_inscripciones. Existing published legacy results can still
  // be shown if the current RPC supports them.
  const { data, error } = await supabase.rpc("pda_ranking_wod", {
    p_wod_id: wodId,
    p_categoria_id: null,
  })

  if (error) {
    console.warn("PDA WOD ranking temporarily unavailable:", error)
    return []
  }

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
  const currentYear = getPdaYear()

  let query = supabase
    .from("pda_ediciones")
    .select(
      "id,anio,nombre,descripcion,fecha_inicio,fecha_fin,estado,publicada,created_at,updated_at"
    )
    .eq("anio", currentYear)

  if (!isPdaDevelopmentUnlockEnabled()) {
    query = query.eq("publicada", true).eq("estado", "activa")
  }

  const { data: current, error: currentError } = await query.maybeSingle()
  if (currentError) throw currentError
  if (current) return current

  if (!isPdaDevelopmentUnlockEnabled()) return null

  const { data: latest, error: latestError } = await supabase
    .from("pda_ediciones")
    .select(
      "id,anio,nombre,descripcion,fecha_inicio,fecha_fin,estado,publicada,created_at,updated_at"
    )
    .order("anio", { ascending: false })
    .limit(1)

  if (latestError) throw latestError
  return latest?.[0] || null
}

async function loadWods(editionId) {
  let query = supabase
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

  if (!isPdaDevelopmentUnlockEnabled()) {
    query = query.eq("publicado", true).eq("activo", true)
  }

  const { data, error } = await query
    .order("fecha", { ascending: true, nullsFirst: false })
    .order("numero", { ascending: true })

  if (error) throw error
  return data || []
}
