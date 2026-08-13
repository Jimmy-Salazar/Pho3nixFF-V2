import { supabase } from "../../../../config/supabase.js"
import {
  buildPreviousDay1930,
  canEditWod,
  isPastDate,
} from "../utils/adminWodsUtils.js"

const WOD_SELECT = [
  "id",
  "nombre",
  "fecha",
  "descripcion",
  "modo_ranking",
  "modalidad",
  "activo",
  "publicado",
  "fecha_publicacion",
  "created_at",
  "calorias_min",
  "calorias_max",
  "intensidad_estimada",
  "duracion_estimada",
  "calorias_nota",
].join(",")

export async function fetchCurrentAdminProfile(user, fallback = {}) {
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

export async function fetchAdminWods() {
  const { data, error } = await supabase
    .from("wod")
    .select(WOD_SELECT)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createWodDraft(payload) {
  const { data, error } = await supabase
    .from("wod")
    .insert({
      ...payload,
      fecha: null,
      activo: false,
      publicado: false,
      fecha_publicacion: null,
    })
    .select(WOD_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function updatePendingWod(wodId, payload) {
  const current = await fetchWodById(wodId)
  if (!canEditWod(current)) {
    throw new Error("PENDING_WOD_REQUIRED")
  }

  const { data, error } = await supabase
    .from("wod")
    .update(payload)
    .eq("id", wodId)
    .select(WOD_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function schedulePendingWod(wodId, wodDate) {
  if (isPastDate(wodDate)) throw new Error("PAST_WOD_DATE")

  const current = await fetchWodById(wodId)
  if (!canEditWod(current)) {
    throw new Error("PENDING_WOD_REQUIRED")
  }

  const { data: sameDateRows, error: conflictError } = await supabase
    .from("wod")
    .select("id,nombre,fecha")
    .eq("fecha", wodDate)
    .eq("publicado", true)

  if (conflictError) throw conflictError

  const conflict = (sameDateRows || []).some((row) => String(row.id) !== String(wodId))
  if (conflict) throw new Error("DUPLICATE_WOD_DATE")

  const { data, error } = await supabase
    .from("wod")
    .update({
      fecha: wodDate,
      publicado: true,
      activo: true,
      fecha_publicacion: buildPreviousDay1930(wodDate),
    })
    .eq("id", wodId)
    .select(WOD_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function deleteWodComplete(wodId) {
  const { data: resultRows, error: resultSelectError } = await supabase
    .from("wod_resultados")
    .select("id")
    .eq("wod_id", wodId)

  if (resultSelectError) throw resultSelectError

  const resultIds = (resultRows || []).map((row) => row.id).filter(Boolean)

  if (resultIds.length > 0) {
    const { error: participantsError } = await supabase
      .from("wod_resultado_participantes")
      .delete()
      .in("wod_resultado_id", resultIds)

    if (participantsError) throw participantsError
  }

  const { error: resultsError } = await supabase
    .from("wod_resultados")
    .delete()
    .eq("wod_id", wodId)

  if (resultsError) throw resultsError

  const { error: wodError } = await supabase
    .from("wod")
    .delete()
    .eq("id", wodId)

  if (wodError) throw wodError
}

async function fetchWodById(wodId) {
  const { data, error } = await supabase
    .from("wod")
    .select(WOD_SELECT)
    .eq("id", wodId)
    .single()

  if (error) throw error
  return data
}
