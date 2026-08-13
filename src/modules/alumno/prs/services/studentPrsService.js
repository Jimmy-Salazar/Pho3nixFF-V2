import { supabase } from "../../../../config/supabase.js"

import { hydratePrRows, removeDuplicateExercises } from "../utils/studentPrsUtils.js"

function throwIfError(error) {
  if (error) throw new Error(error.message || "Error de Supabase")
}

export async function fetchStudentPrsBundle(userId) {
  if (!userId) throw new Error("No se recibió el usuario autenticado.")

  const [profileResponse, membershipResponse, exercisesResponse, personalResponse, globalResponse, usersResponse] =
    await Promise.all([
      supabase
        .from("usuarios")
        .select("id,nombre,email,role,foto_url")
        .eq("id", userId)
        .maybeSingle(),

      supabase
        .from("mensualidades")
        .select("id,usuario_id,fecha_inicio,fecha_fin,estado,created_at")
        .eq("usuario_id", userId)
        .order("fecha_fin", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1),

      supabase
        .from("ejercicios")
        .select("id,nombre")
        .order("nombre", { ascending: true }),

      supabase
        .from("rm")
        .select("id,usuario,ejercicio_id,peso_libras,fecha,registrado_por,created_at")
        .eq("usuario", userId)
        .order("fecha", { ascending: false })
        .order("created_at", { ascending: false }),

      supabase
        .from("rm")
        .select("id,usuario,ejercicio_id,peso_libras,fecha,registrado_por,created_at")
        .order("peso_libras", { ascending: false })
        .order("fecha", { ascending: false })
        .limit(500),

      supabase
        .from("usuarios")
        .select("id,nombre,foto_url"),
    ])

  throwIfError(profileResponse.error)
  throwIfError(membershipResponse.error)
  throwIfError(exercisesResponse.error)
  throwIfError(personalResponse.error)
  throwIfError(globalResponse.error)
  throwIfError(usersResponse.error)

  const exercises = removeDuplicateExercises(exercisesResponse.data || [])
  const users = usersResponse.data || []

  return {
    profile: profileResponse.data || null,
    membership: membershipResponse.data?.[0] || null,
    exercises,
    personalRows: hydratePrRows(personalResponse.data || [], exercises, users),
    globalRows: hydratePrRows(globalResponse.data || [], exercises, users),
    users,
  }
}

export async function saveStudentPr(userId, payload) {
  if (!userId) throw new Error("No se recibió el usuario autenticado.")

  const { data, error } = await supabase
    .from("rm")
    .insert({
      usuario: userId,
      ejercicio_id: payload.ejercicio_id,
      peso_libras: Number(payload.peso_libras || 0),
      fecha: payload.fecha,
      registrado_por: userId,
    })
    .select("id,usuario,ejercicio_id,peso_libras,fecha,registrado_por,created_at")
    .single()

  throwIfError(error)
  return data
}

export async function updateStudentPr(userId, prId, payload) {
  if (!userId || !prId) throw new Error("No se recibió el registro a actualizar.")

  const { data, error } = await supabase
    .from("rm")
    .update({
      ejercicio_id: payload.ejercicio_id,
      peso_libras: Number(payload.peso_libras || 0),
      fecha: payload.fecha,
    })
    .eq("id", prId)
    .eq("usuario", userId)
    .select("id,usuario,ejercicio_id,peso_libras,fecha,registrado_por,created_at")
    .maybeSingle()

  throwIfError(error)

  if (!data) {
    throw new Error(
      "No se pudo modificar el PR. Verifica que exista una política UPDATE en Supabase para que el usuario edite sus propios registros."
    )
  }

  return data
}

export async function deleteStudentPr(userId, prId) {
  if (!userId || !prId) throw new Error("No se recibió el registro a eliminar.")

  const { error } = await supabase
    .from("rm")
    .delete()
    .eq("id", prId)
    .eq("usuario", userId)

  throwIfError(error)
}
