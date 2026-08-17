import { hasSupabaseConfig, supabase } from "../../../config/supabase.js"

function requireSupabase() {
  if (!hasSupabaseConfig || !supabase) {
    throw new Error("Supabase is not configured.")
  }

  return supabase
}

export async function requestPasswordRecovery(email) {
  const client = requireSupabase()
  const normalizedEmail = String(email || "").trim().toLowerCase()

  if (!normalizedEmail) {
    throw new Error("Email is required.")
  }

  const options =
    typeof window !== "undefined"
      ? {
          redirectTo: `${window.location.origin}/restablecer-contrasena`,
        }
      : undefined

  const { error } = await client.auth.resetPasswordForEmail(
    normalizedEmail,
    options
  )

  if (error) {
    throw error
  }

  return {
    email: normalizedEmail,
  }
}

export async function readPasswordRecoverySession() {
  const client = requireSupabase()

  const { data, error } = await client.auth.getSession()

  if (error) {
    throw error
  }

  return data?.session || null
}

export function subscribePasswordRecoverySession(onChange) {
  const client = requireSupabase()

  const { data } = client.auth.onAuthStateChange(
    (event, session) => {
      if (
        event === "PASSWORD_RECOVERY" ||
        event === "SIGNED_IN" ||
        event === "INITIAL_SESSION"
      ) {
        onChange?.(session || null, event)
      }

      if (event === "SIGNED_OUT") {
        onChange?.(null, event)
      }
    }
  )

  return () => {
    data?.subscription?.unsubscribe()
  }
}

export async function updateRecoveredPassword(password) {
  const client = requireSupabase()

  const nextPassword = String(password || "")

  if (!nextPassword) {
    throw new Error("Password is required.")
  }

  const { data, error } = await client.auth.updateUser({
    password: nextPassword,
  })

  if (error) {
    throw error
  }

  return data?.user || null
}

export async function finishPasswordRecovery() {
  const client = requireSupabase()

  const { error } = await client.auth.signOut()

  if (error) {
    throw error
  }
}