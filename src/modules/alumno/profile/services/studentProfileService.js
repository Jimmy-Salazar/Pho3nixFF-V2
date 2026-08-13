import { supabase } from "../../../../config/supabase.js"

import {
  hydrateProfilePrRows,
  isValidEmail,
  normalizeEmail,
  normalizeText,
} from "../utils/studentProfileUtils.js"

const PROFILE_FIELDS =
  "id,nombre,email,telefono,cedula,role,fecha_nacimiento,foto_url,created_at"

function throwIfError(error, fallback) {
  if (error) throw new Error(error.message || fallback)
}

export async function fetchStudentProfileBundle({ authUser, authProfile }) {
  if (!authUser?.id) throw new Error("No active session.")

  const [profileResponse, membershipResponse, recordsResponse, exercisesResponse] =
    await Promise.all([
      supabase
        .from("usuarios")
        .select(PROFILE_FIELDS)
        .eq("id", authUser.id)
        .maybeSingle(),
      supabase
        .from("mensualidades")
        .select("id,usuario_id,fecha_inicio,fecha_fin,estado,created_at")
        .eq("usuario_id", authUser.id)
        .order("fecha_fin", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("rm")
        .select("id,usuario,ejercicio_id,peso_libras,fecha,created_at")
        .eq("usuario", authUser.id)
        .order("fecha", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("ejercicios")
        .select("id,nombre")
        .order("nombre", { ascending: true }),
    ])

  throwIfError(profileResponse.error, "Could not load profile.")
  throwIfError(membershipResponse.error, "Could not load membership.")
  throwIfError(recordsResponse.error, "Could not load records.")
  throwIfError(exercisesResponse.error, "Could not load exercises.")

  let profile = profileResponse.data || authProfile || {
    id: authUser.id,
    nombre: authUser.email || "PHO3NIX",
    email: authUser.email || "",
    role: "alumno",
  }

  let emailSynced = false
  const confirmedAuthEmail = normalizeEmail(authUser.email)
  const storedEmail = normalizeEmail(profile?.email)

  if (confirmedAuthEmail && confirmedAuthEmail !== storedEmail) {
    const { data: syncedProfile, error: syncError } = await supabase
      .from("usuarios")
      .update({ email: confirmedAuthEmail })
      .eq("id", authUser.id)
      .select(PROFILE_FIELDS)
      .single()

    if (!syncError && syncedProfile) {
      profile = syncedProfile
      emailSynced = true
    } else if (syncError) {
      console.warn("Could not sync confirmed auth email with usuarios.email:", syncError)
    }
  }

  const exercises = exercisesResponse.data || []

  return {
    profile,
    membership: membershipResponse.data?.[0] || null,
    records: hydrateProfilePrRows(recordsResponse.data || [], exercises),
    exercises,
    emailSynced,
  }
}

export async function updateStudentProfile(userId, payload) {
  if (!userId) throw new Error("No authenticated user.")

  const cleanPayload = {
    nombre: normalizeText(payload?.nombre),
    telefono: normalizeText(payload?.telefono) || null,
    fecha_nacimiento: payload?.fecha_nacimiento || null,
  }

  const { data, error } = await supabase
    .from("usuarios")
    .update(cleanPayload)
    .eq("id", userId)
    .select(PROFILE_FIELDS)
    .single()

  throwIfError(error, "Could not update profile.")

  const { error: metadataError } = await supabase.auth.updateUser({
    data: { nombre: cleanPayload.nombre },
  })

  if (metadataError) {
    console.warn("Profile updated, but auth metadata could not be synchronized:", metadataError)
  }

  return data
}

export async function uploadStudentAvatar(userId, file) {
  if (!userId) throw new Error("No authenticated user.")
  if (!file) throw new Error("No image selected.")

  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg"])
  if (!allowedTypes.has(file.type)) throw new Error("INVALID_IMAGE_TYPE")
  if (file.size > 5 * 1024 * 1024) throw new Error("IMAGE_TOO_LARGE")

  const extension = getFileExtension(file)
  const filePath = `avatars/${userId}-${Date.now()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    })

  throwIfError(uploadError, "Could not upload image.")

  const { data: publicData } = supabase.storage.from("images").getPublicUrl(filePath)
  const publicUrl = publicData?.publicUrl
  if (!publicUrl) throw new Error("Could not get image URL.")

  const { data, error } = await supabase
    .from("usuarios")
    .update({ foto_url: publicUrl })
    .eq("id", userId)
    .select(PROFILE_FIELDS)
    .single()

  throwIfError(error, "Could not save profile image.")

  return data
}

export async function requestStudentEmailChange({ currentEmail, newEmail, password }) {
  const normalizedCurrentEmail = normalizeEmail(currentEmail)
  const normalizedNewEmail = normalizeEmail(newEmail)

  if (!isValidEmail(normalizedNewEmail)) throw new Error("INVALID_EMAIL")
  if (normalizedNewEmail === normalizedCurrentEmail) throw new Error("SAME_EMAIL")
  if (!password) throw new Error("PASSWORD_REQUIRED")

  const { error: passwordError } = await supabase.auth.signInWithPassword({
    email: normalizedCurrentEmail,
    password,
  })

  if (passwordError) throw new Error("INVALID_PASSWORD")

  const options =
    typeof window !== "undefined"
      ? { emailRedirectTo: `${window.location.origin}/atleta/perfil` }
      : undefined

  const { data, error } = await supabase.auth.updateUser(
    { email: normalizedNewEmail },
    options
  )

  throwIfError(error, "Could not request email change.")

  return {
    user: data?.user || null,
    pendingEmail: normalizedNewEmail,
  }
}

function getFileExtension(file) {
  const extension = String(file?.name || "").split(".").pop()?.toLowerCase()
  if (["jpg", "jpeg", "png", "webp"].includes(extension)) {
    return extension === "jpeg" ? "jpg" : extension
  }
  if (file?.type === "image/png") return "png"
  if (file?.type === "image/webp") return "webp"
  return "jpg"
}
