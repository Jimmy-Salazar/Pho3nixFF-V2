import { supabase } from "../../../../config/supabase.js"

import {
  buildWeeklyWodStats,
  formatDateISO,
  getCurrentWeekRange,
  getMembershipInfo,
  getUpcomingBirthdays,
} from "../utils/studentDashboardUtils.js"

export const EMPTY_STUDENT_DASHBOARD = {
  profile: null,
  membership: null,
  membershipInfo: null,
  todayWod: null,
  prCount: 0,
  latestPr: null,
  weekWodCount: 0,
  weekWodTarget: 6,
  weekCaloriesTotal: 0,
  weekCaloriesTarget: 6000,
  weekCaloriesSeries: [0, 0, 0, 0, 0, 0, 0],
  activeChallengesCount: 0,
  announcements: [],
  birthdays: [],
}

export async function loadStudentDashboardData({ authUser, authProfile }) {
  if (!authUser?.id) {
    throw new Error("No active session.")
  }

  const now = new Date()
  const todayIso = formatDateISO(now)
  const { startIso, endIso } = getCurrentWeekRange(now)

  const [
    profileResult,
    membershipResult,
    wodResult,
    prResult,
    weekResult,
    challengeResult,
    announcementsResult,
    birthdaysResult,
  ] = await Promise.all([
    safeQuery(async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id,nombre,email,role,fecha_nacimiento,foto_url")
        .eq("id", authUser.id)
        .maybeSingle()

      if (error) throw error
      return data
    }, null),

    safeQuery(async () => {
      const { data, error } = await supabase
        .from("mensualidades")
        .select("id,usuario_id,fecha_inicio,fecha_fin,estado,created_at")
        .eq("usuario_id", authUser.id)
        .order("fecha_fin", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) throw error
      return data?.[0] || null
    }, null),

    safeQuery(async () => {
      const { data, error } = await supabase
        .from("wod")
        .select("id,nombre,descripcion,modo_ranking,modalidad,fecha,activo,publicado,fecha_publicacion,calorias_max")
        .eq("fecha", todayIso)
        .eq("activo", true)
        .limit(5)

      if (error) throw error

      return (data || []).find((item) => {
        if (item.publicado === true && item.fecha_publicacion) {
          return new Date(item.fecha_publicacion) <= now
        }

        return true
      }) || null
    }, null),

    safeQuery(async () => {
      const { data, error } = await supabase
        .from("rm")
        .select("id,usuario,ejercicio_id,peso_libras,fecha,created_at")
        .eq("usuario", authUser.id)
        .order("fecha", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) throw error

      const rows = data || []
      return {
        count: rows.length,
        latest: rows[0] || null,
      }
    }, { count: 0, latest: null }),

    safeQuery(async () => {
      const { data, error } = await supabase
        .from("wod_resultados")
        .select(`
          id,
          wod_id,
          usuario_id,
          fecha,
          created_at,
          calorias_estimadas,
          wod:wod_id (
            id,
            calorias_max
          )
        `)
        .eq("usuario_id", authUser.id)
        .gte("fecha", startIso)
        .lte("fecha", endIso)
        .order("fecha", { ascending: true })

      if (error) throw error

      return buildWeeklyWodStats(data || [])
    }, buildWeeklyWodStats([])),

    safeQuery(async () => {
      const { data, error } = await supabase
        .from("competencias")
        .select("id,titulo,descripcion,fecha_inicio_competencia,fecha_inicio,fecha_fin,estado,activo")
        .eq("activo", true)
        .in("estado", ["publicado", "activa"])
        .order("created_at", { ascending: false })
        .limit(3)

      if (error) throw error
      return data || []
    }, []),

    safeQuery(async () => {
      const { data, error } = await supabase
        .from("anuncios")
        .select("id,titulo,resumen,contenido,fecha_publicacion,activo,created_at,media_url,media_tipo,dirigido_a")
        .eq("activo", true)
        .order("created_at", { ascending: false })
        .limit(3)

      if (error) throw error
      return data || []
    }, []),

    safeQuery(async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id,nombre,fecha_nacimiento")
        .not("fecha_nacimiento", "is", null)

      if (error) throw error
      return getUpcomingBirthdays(data || [], now, 3)
    }, []),
  ])

  const profile = profileResult || authProfile || {
    id: authUser.id,
    nombre: authUser.email || "Alumno PHO3NIX",
    email: authUser.email,
    role: "alumno",
  }

  const membershipInfo = getMembershipInfo(membershipResult, now)

  return {
    profile,
    membership: membershipResult,
    membershipInfo,
    todayWod: wodResult,
    prCount: prResult.count,
    latestPr: prResult.latest,
    weekWodCount: weekResult.count,
    weekWodTarget: 6,
    weekCaloriesTotal: weekResult.caloriesTotal,
    weekCaloriesTarget: weekResult.caloriesTarget,
    weekCaloriesSeries: weekResult.caloriesSeries,
    activeChallengesCount: challengeResult.length,
    announcements: announcementsResult,
    birthdays: birthdaysResult,
  }
}

async function safeQuery(queryFn, fallback) {
  try {
    return await queryFn()
  } catch (error) {
    console.warn("Dashboard query skipped:", error)
    return fallback
  }
}
