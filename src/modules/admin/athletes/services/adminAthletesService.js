import { supabase } from "../../../../config/supabase.js"

const USER_SELECTIONS = [
  "id,nombre,email,telefono,cedula,role,fecha_nacimiento,sexo,foto_url,created_at",
  "id,nombre,email,telefono,cedula,role,fecha_nacimiento,sexo,foto_url",
  "id,nombre,email,role,fecha_nacimiento,sexo,foto_url,created_at",
  "id,nombre,email,role,fecha_nacimiento,sexo,foto_url",
]

function normalizeRoleForBackend(value) {
  const role = String(value || "").trim().toLowerCase()

  if (["admin", "administrador"].includes(role)) return "admin"
  if (["coach", "entrenador"].includes(role)) return "coach"
  if (["alumno", "atleta", "student", "athlete"].includes(role)) return "alumno"

  return role || "alumno"
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function cleanNullableText(value) {
  const text = String(value || "").trim()
  return text || null
}

function assertRequired(value, message) {
  if (!String(value || "").trim()) throw new Error(message)
}

async function loadUsersFromDatabase(limit) {
  let lastError = null

  for (const selection of USER_SELECTIONS) {
    const response = await supabase
      .from("usuarios")
      .select(selection)
      .order("nombre", { ascending: true })
      .limit(limit)

    if (!response.error) return response.data || []
    lastError = response.error
  }

  throw lastError || new Error("No se pudieron cargar los atletas.")
}

export async function fetchUsers({ search = "", role = "all", limit = 300 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 300, 1), 1000)
  const rows = await loadUsersFromDatabase(safeLimit)
  const searchValue = normalizeText(search)
  const roleValue = normalizeRoleForBackend(role)

  return rows.filter((item) => {
    const matchesRole =
      role === "all" || normalizeRoleForBackend(item?.role) === roleValue

    if (!matchesRole) return false
    if (!searchValue) return true

    const haystack = normalizeText(
      [item?.nombre, item?.email, item?.telefono, item?.cedula]
        .filter(Boolean)
        .join(" ")
    )

    return haystack.includes(searchValue)
  })
}

export async function fetchLatestMensualidadesByUserIds(userIds = []) {
  const ids = [...new Set((userIds || []).filter(Boolean))]
  const latestByUser = new Map()

  if (ids.length === 0) return latestByUser

  const chunkSize = 100

  for (let index = 0; index < ids.length; index += chunkSize) {
    const chunk = ids.slice(index, index + chunkSize)
    const { data, error } = await supabase
      .from("mensualidades")
      .select("id,usuario_id,fecha_inicio,fecha_fin,estado,created_at")
      .in("usuario_id", chunk)
      .order("fecha_fin", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) throw error

    for (const membership of data || []) {
      if (!membership?.usuario_id || latestByUser.has(membership.usuario_id)) continue
      latestByUser.set(membership.usuario_id, membership)
    }
  }

  return latestByUser
}

export async function createStudent(payload = {}) {
  assertRequired(payload.nombre, "El nombre del atleta es obligatorio.")
  assertRequired(payload.cedula, "La cédula del atleta es obligatoria.")
  assertRequired(payload.email, "El correo del atleta es obligatorio.")

  const body = {
    nombre: String(payload.nombre).trim(),
    cedula: String(payload.cedula).trim(),
    email: String(payload.email).trim().toLowerCase(),
    telefono: cleanNullableText(payload.telefono),
    fecha_nacimiento: payload.fecha_nacimiento || null,
    role: normalizeRoleForBackend(payload.role),
    sexo: cleanNullableText(payload.sexo),
  }

  const { data, error } = await supabase.functions.invoke("create-student", {
    body,
  })

  if (error) {
    throw new Error(error.message || "No se pudo crear el atleta.")
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data
}

export async function updateUserBasic(userId, payload = {}) {
  assertRequired(userId, "No se encontró el atleta que se desea editar.")

  const changes = {
    telefono: cleanNullableText(payload.telefono),
    fecha_nacimiento: payload.fecha_nacimiento || null,
    sexo: cleanNullableText(payload.sexo),
    role: normalizeRoleForBackend(payload.role),
  }

  const { data, error } = await supabase
    .from("usuarios")
    .update(changes)
    .eq("id", userId)
    .select("id,nombre,email,telefono,cedula,role,fecha_nacimiento,sexo,foto_url")
    .maybeSingle()

  if (error) throw error
  return data
}

export async function activateMensualidad({ usuario_id, fecha_inicio, fecha_fin } = {}) {
  assertRequired(usuario_id, "No se encontró el atleta de la mensualidad.")
  assertRequired(fecha_inicio, "La fecha de inicio es obligatoria.")
  assertRequired(fecha_fin, "La fecha de finalización es obligatoria.")

  if (String(fecha_fin) < String(fecha_inicio)) {
    throw new Error("La fecha de finalización no puede ser anterior a la fecha de inicio.")
  }

  const { data, error } = await supabase
    .from("mensualidades")
    .insert({
      usuario_id,
      fecha_inicio,
      fecha_fin,
      estado: "activo",
    })
    .select("id,usuario_id,fecha_inicio,fecha_fin,estado,created_at")
    .single()

  if (error) throw error
  return data
}

export async function deactivateLatestMensualidad({ mensualidad_id } = {}) {
  assertRequired(mensualidad_id, "No se encontró la mensualidad que se desea desactivar.")

  const { data, error } = await supabase
    .from("mensualidades")
    .update({ estado: "inactivo" })
    .eq("id", mensualidad_id)
    .select("id,usuario_id,fecha_inicio,fecha_fin,estado,created_at")
    .maybeSingle()

  if (error) throw error
  return data
}

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

  if (error) {
    console.warn("ADMIN ATHLETES PROFILE WARNING:", error)
  }

  return {
    id: data?.id || user.id,
    nombre: data?.nombre || fallback.nombre || user.email || "PHO3NIX",
    email: data?.email || user.email || "",
    role: data?.role || fallback.rol || "admin",
    foto_url: data?.foto_url || "",
  }
}

export async function deleteUserComplete(userId) {
  assertRequired(userId, "No se encontró el usuario que se desea eliminar.")

  const { data, error } = await supabase.rpc("admin_delete_user_complete", {
    target_user_id: userId,
  })

  if (error) {
    throw new Error(error.message || "No se pudo eliminar el usuario.")
  }

  const { data: stillExists, error: verifyError } = await supabase
    .from("usuarios")
    .select("id")
    .eq("id", userId)
    .maybeSingle()

  if (verifyError) {
    throw new Error(verifyError.message || "No se pudo verificar la eliminación.")
  }

  if (stillExists?.id) {
    throw new Error("El usuario sigue existiendo en la base de datos.")
  }

  return data
}
