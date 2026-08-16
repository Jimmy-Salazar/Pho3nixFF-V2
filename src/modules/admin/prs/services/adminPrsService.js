import { supabase } from "../../../../config/supabase.js"

const RECORD_SELECT = [
  "id",
  "usuario",
  "ejercicio_id",
  "peso_libras",
  "fecha",
  "created_at",
  "registrado_por",
  "usuarios:usuario(id,nombre,email,foto_url,sexo,role)",
  "ejercicios:ejercicio_id(id,nombre)",
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

export async function fetchAdminPrData() {
  const [exercisesResult, athletesResult, recordsResult] = await Promise.all([
    supabase.from("ejercicios").select("id,nombre,created_at").order("nombre", { ascending: true }),
    supabase
      .from("usuarios")
      .select("id,nombre,email,foto_url,sexo,role")
      .in("role", ["Alumno", "alumno", "Coach", "coach"])
      .order("nombre", { ascending: true }),
    fetchRecordsWithFallback(),
  ])

  if (exercisesResult.error) throw exercisesResult.error
  if (athletesResult.error) throw athletesResult.error

  return {
    exercises: exercisesResult.data || [],
    athletes: athletesResult.data || [],
    records: recordsResult,
  }
}

export async function createPrRecord({ athleteId, exerciseId, weightLb, date, registeredBy }) {
  const payload = {
    usuario: athleteId,
    ejercicio_id: exerciseId,
    peso_libras: weightLb,
    fecha: date,
  }

  if (registeredBy) payload.registrado_por = registeredBy

  const { data, error } = await supabase
    .from("rm")
    .insert(payload)
    .select("id,usuario,ejercicio_id,peso_libras,fecha,created_at,registrado_por")
    .single()

  if (error) throw error
  return data
}

export async function updatePrRecord({ prId, exerciseId, weightLb, date }) {
  const { data, error } = await supabase
    .from("rm")
    .update({
      ejercicio_id: exerciseId,
      peso_libras: weightLb,
      fecha: date,
    })
    .eq("id", prId)
    .select("id,usuario,ejercicio_id,peso_libras,fecha,created_at,registrado_por")
    .single()

  if (error) throw error
  return data
}

export async function deletePrRecord(prId) {
  const { error } = await supabase
    .from("rm")
    .delete()
    .eq("id", prId)

  if (error) throw error
}

export async function createExercise(name) {
  const { data, error } = await supabase
    .from("ejercicios")
    .insert({ nombre: name })
    .select("id,nombre,created_at")
    .single()

  if (error) throw error
  return data
}

export async function updateExercise(exerciseId, name) {
  const { data, error } = await supabase
    .from("ejercicios")
    .update({ nombre: name })
    .eq("id", exerciseId)
    .select("id,nombre,created_at")
    .single()

  if (error) throw error
  return data
}

export async function deleteExerciseComplete(exerciseId) {
  const { error } = await supabase
    .from("ejercicios")
    .delete()
    .eq("id", exerciseId)

  if (error) throw error
}

async function fetchRecordsWithFallback() {
  const joined = await supabase
    .from("rm")
    .select(RECORD_SELECT)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })

  if (!joined.error) return joined.data || []

  console.warn("ADMIN PRS JOIN FALLBACK:", joined.error.message)

  const [recordsResult, usersResult, exercisesResult] = await Promise.all([
    supabase
      .from("rm")
      .select("id,usuario,ejercicio_id,peso_libras,fecha,created_at,registrado_por")
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("usuarios").select("id,nombre,email,foto_url,sexo,role"),
    supabase.from("ejercicios").select("id,nombre"),
  ])

  if (recordsResult.error) throw recordsResult.error
  if (usersResult.error) throw usersResult.error
  if (exercisesResult.error) throw exercisesResult.error

  const users = new Map((usersResult.data || []).map((item) => [String(item.id), item]))
  const exercises = new Map((exercisesResult.data || []).map((item) => [String(item.id), item]))

  return (recordsResult.data || []).map((record) => ({
    ...record,
    usuarios: users.get(String(record.usuario)) || null,
    ejercicios: exercises.get(String(record.ejercicio_id)) || null,
  }))
}
