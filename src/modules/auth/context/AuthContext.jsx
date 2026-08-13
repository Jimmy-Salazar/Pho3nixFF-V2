import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"

import { hasSupabaseConfig, supabase } from "../../../config/supabase.js"
import StudentBirthdayPopup from "../components/StudentBirthdayPopup.jsx"

const AuthContext = createContext(null)

const normalizeRole = (value) => String(value || "").toLowerCase().trim()

const normalizeProfile = (authUser, profile) => {
  const metadata = authUser?.user_metadata || {}

  return {
    id: authUser?.id || null,
    email: authUser?.email || profile?.email || "",
    nombre: profile?.nombre || metadata.nombre || authUser?.email || "PHO3NIX",
    role: normalizeRole(profile?.role || metadata.role),
    fechaNacimiento: profile?.fecha_nacimiento || null,
    telefono: profile?.telefono || "",
    cedula: profile?.cedula || "",
    fotoUrl: profile?.foto_url || "",
    rawProfile: profile || null,
  }
}

const getRoleDestination = (role) => {
  const normalizedRole = normalizeRole(role)

  if (normalizedRole === "admin" || normalizedRole === "coach") return "/admin/dashboard"
  if (normalizedRole === "alumno") return "/atleta/dashboard"

  return "/login"
}


const getGuayaquilDateISO = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guayaquil",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  )

  return `${values.year}-${values.month}-${values.day}`
}

const isBirthdayToday = (birthDate, date = new Date()) => {
  const value = String(birthDate || "").slice(0, 10)
  const match = value.match(/^\d{4}-(\d{2})-(\d{2})$/)

  if (!match) return false

  const today = getGuayaquilDateISO(date)
  return today.slice(5) === `${match[1]}-${match[2]}`
}

const hasBirthdayNoticeAccess = async (userId, role) => {
  const normalizedRole = normalizeRole(role)

  if (normalizedRole === "admin" || normalizedRole === "administrador") {
    return true
  }

  if (normalizedRole !== "alumno" && normalizedRole !== "coach") {
    return false
  }

  const { data, error } = await supabase
    .from("mensualidades")
    .select("fecha_fin,estado,created_at")
    .eq("usuario_id", userId)
    .order("fecha_fin", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)

  if (error) {
    console.error("Error validating birthday notice access:", error)
    return false
  }

  const membership = data?.[0]
  const endDate = String(membership?.fecha_fin || "").slice(0, 10)
  const today = getGuayaquilDateISO()

  return (
    String(membership?.estado || "").toLowerCase() === "activo"
    && Boolean(endDate)
    && endDate >= today
  )
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [authError, setAuthError] = useState("")
  const [birthdayPopup, setBirthdayPopup] = useState(null)

  const aliveRef = useRef(true)
  const loadIdRef = useRef(0)

  const clearAuthState = () => {
    loadIdRef.current += 1
    setSession(null)
    setUser(null)
    setProfile(null)
    setRole(null)
    setProfileLoading(false)
    setBirthdayPopup(null)
  }

  const loadProfile = async (authSession, options = {}) => {
    const silent = Boolean(options.silent)
    const loadId = loadIdRef.current + 1
    loadIdRef.current = loadId

    const isCurrentLoad = () => aliveRef.current && loadIdRef.current === loadId

    try {
      if (!silent) setProfileLoading(true)
      setAuthError("")

      const authUser = authSession?.user

      if (!authUser?.id) {
        clearAuthState()
        setLoading(false)
        return null
      }

      const { data: userProfile, error } = await supabase
        .from("usuarios")
        .select("id,nombre,email,telefono,cedula,role,fecha_nacimiento,foto_url")
        .eq("id", authUser.id)
        .maybeSingle()

      if (!isCurrentLoad()) return null

      if (error) {
        throw error
      }

      const normalizedProfile = normalizeProfile(authUser, userProfile)

      if (!normalizedProfile.role) {
        await supabase.auth.signOut()
        clearAuthState()
        setAuthError("No se pudo determinar el rol de este usuario.")
        setLoading(false)
        return null
      }

      setSession(authSession)
      setUser(authUser)
      setProfile(normalizedProfile)
      setRole(normalizedProfile.role)

      if (!silent) {
        setProfileLoading(false)
        setLoading(false)
      }

      return normalizedProfile
    } catch (error) {
      if (!isCurrentLoad()) return null

      console.error("Error cargando perfil:", error)
      await supabase.auth.signOut()
      clearAuthState()
      setAuthError("No se pudo cargar tu perfil. Revisa tu conexión o permisos.")

      if (!silent) {
        setProfileLoading(false)
        setLoading(false)
      }

      return null
    }
  }

  useEffect(() => {
    aliveRef.current = true

    if (!hasSupabaseConfig || !supabase) {
      setAuthError("Falta configurar VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.")
      setLoading(false)
      return () => {
        aliveRef.current = false
      }
    }

    const bootstrap = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error("Error leyendo sesión:", error)
        clearAuthState()
        setLoading(false)
        return
      }

      if (!data?.session) {
        clearAuthState()
        setLoading(false)
        return
      }

      await loadProfile(data.session)
    }

    bootstrap()

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!aliveRef.current) return
      if (event === "TOKEN_REFRESHED") return

      if (!nextSession) {
        clearAuthState()
        setLoading(false)
        return
      }

      setTimeout(() => {
        loadProfile(nextSession, { silent: event === "USER_UPDATED" })
      }, 0)
    })

    return () => {
      aliveRef.current = false
      loadIdRef.current += 1
      listener?.subscription?.unsubscribe()
    }
  }, [])

  const signIn = async ({ email, password }) => {
    if (!hasSupabaseConfig || !supabase) {
      return {
        ok: false,
        error: "Falta configurar Supabase en las variables de entorno.",
      }
    }

    try {
      setLoading(true)
      setAuthError("")

      const { data, error } = await supabase.auth.signInWithPassword({
        email: String(email || "").trim(),
        password,
      })

      if (error) {
        setLoading(false)
        return {
          ok: false,
          error: "Correo o contraseña incorrectos.",
        }
      }

      const nextProfile = await loadProfile(data.session)

      if (!nextProfile?.role) {
        return {
          ok: false,
          error: "No se pudo determinar el rol del usuario.",
        }
      }

      if (isBirthdayToday(nextProfile.fechaNacimiento)) {
        const canShowBirthdayNotice = await hasBirthdayNoticeAccess(
          nextProfile.id,
          nextProfile.role
        )

        if (canShowBirthdayNotice) {
          setBirthdayPopup({
            id: nextProfile.id,
            nombre: nextProfile.nombre,
            role: nextProfile.role,
            fotoUrl: nextProfile.fotoUrl,
          })
        }
      }

      return {
        ok: true,
        role: nextProfile.role,
        redirectTo: getRoleDestination(nextProfile.role),
      }
    } catch (error) {
      console.error("Error iniciando sesión:", error)
      setLoading(false)

      return {
        ok: false,
        error: "No se pudo iniciar sesión. Inténtalo nuevamente.",
      }
    }
  }

  const refreshProfile = async () => {
    if (!supabase) return null

    const { data, error } = await supabase.auth.getSession()
    if (error || !data?.session) return null

    return loadProfile(data.session, { silent: true })
  }

  const dismissBirthdayPopup = () => setBirthdayPopup(null)

  const logout = async () => {
    setBirthdayPopup(null)

    if (supabase) {
      await supabase.auth.signOut()
    }

    clearAuthState()
    window.location.href = "/"
  }

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      role,
      rol: role,
      nombre: profile?.nombre || null,
      loading,
      profileLoading,
      authError,
      isAuthenticated: Boolean(user && role),
      getRoleDestination,
      signIn,
      refreshProfile,
      birthdayPopup,
      dismissBirthdayPopup,
      logout,
    }),
    [
      session,
      user,
      profile,
      role,
      loading,
      profileLoading,
      authError,
      refreshProfile,
      birthdayPopup,
    ]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}

      {birthdayPopup ? (
        <StudentBirthdayPopup
          profile={birthdayPopup}
          onClose={dismissBirthdayPopup}
        />
      ) : null}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider")
  }

  return context
}
