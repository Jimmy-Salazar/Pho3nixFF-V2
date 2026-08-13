import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { supabase } from "../../../config/supabase.js"
import { useAuth } from "../../auth/context/AuthContext.jsx"
import { useI18n } from "../../../i18n/I18nProvider.jsx"
import { getStudentDashboardCopy } from "../dashboard/i18n/studentDashboardCopy.js"
import StudentDashboardLayout from "../dashboard/components/StudentDashboardLayout.jsx"
import StudentDashboardHeader from "../dashboard/components/StudentDashboardHeader.jsx"
import StudentDashboardHero from "../dashboard/components/StudentDashboardHero.jsx"
import QuickStatsGrid from "../dashboard/components/QuickStatsGrid.jsx"
import WodSection from "../dashboard/components/WodSection.jsx"
import WeekProgressSection from "../dashboard/components/WeekProgressSection.jsx"
import AnnouncementsSection from "../dashboard/components/AnnouncementsSection.jsx"
import BirthdaysSection from "../dashboard/components/BirthdaysSection.jsx"
import MotivationCard from "../dashboard/components/MotivationCard.jsx"
import LoadingState from "../dashboard/components/LoadingState.jsx"
import {
  EMPTY_STUDENT_DASHBOARD,
  loadStudentDashboardData,
} from "../dashboard/services/studentDashboardService.js"
import {
  getFirstName,
  getInitials,
  getMembershipLabel,
} from "../dashboard/utils/studentDashboardUtils.js"
import "../../../styles/studentDashboard.css"

export default function StudentDashboardPage() {
  const navigate = useNavigate()
  const { locale } = useI18n()
  const { user, profile: authProfile, logout } = useAuth()
  const copy = useMemo(() => getStudentDashboardCopy(locale), [locale])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dashboard, setDashboard] = useState(EMPTY_STUDENT_DASHBOARD)

  useEffect(() => {
    let alive = true

    async function loadDashboard() {
      try {
        setLoading(true)
        setError("")

        const authUser = user || (await supabase.auth.getUser())?.data?.user
        const nextDashboard = await loadStudentDashboardData({ authUser, authProfile })

        if (alive) {
          setDashboard(nextDashboard)
        }
      } catch (dashboardError) {
        console.error("Error cargando dashboard alumno V2:", dashboardError)

        if (alive) {
          setError(copy.error)
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadDashboard()

    return () => {
      alive = false
    }
  }, [copy.error, authProfile, user])

  const membership = useMemo(
    () => getMembershipLabel(dashboard.membership, dashboard.membershipInfo, copy),
    [dashboard.membership, dashboard.membershipInfo, copy]
  )

  const profileName = dashboard.profile?.nombre || authProfile?.nombre || "Alumno PHO3NIX"
  const firstName = getFirstName(profileName)
  const initials = getInitials(profileName)
  const weekPercent = dashboard.weekWodTarget
    ? Math.min(Math.round((dashboard.weekWodCount / dashboard.weekWodTarget) * 100), 100)
    : 0
  const caloriesPercent = dashboard.weekCaloriesTarget
    ? Math.min(Math.round((dashboard.weekCaloriesTotal / dashboard.weekCaloriesTarget) * 100), 100)
    : 0

  if (loading) {
    return <LoadingState copy={copy} />
  }

  return (
    <StudentDashboardLayout copy={copy} membership={membership} navigate={navigate} onLogout={logout}>
      <section className="student-dashboard-main">
        <div className="student-dashboard-orb student-dashboard-orb-a" />
        <div className="student-dashboard-orb student-dashboard-orb-b" />

        <StudentDashboardHeader
          copy={copy}
          profileName={profileName}
          initials={initials}
          photoUrl={dashboard.profile?.foto_url}
          onLogout={logout}
        />

        {error ? <div className="student-dashboard-error">{error}</div> : null}

        <StudentDashboardHero copy={copy} firstName={firstName} membership={membership} />

        <section className="student-dashboard-grid">
          <div className="student-dashboard-column student-dashboard-column-main">
            <QuickStatsGrid
              copy={copy}
              dashboard={dashboard}
              weekPercent={weekPercent}
              caloriesPercent={caloriesPercent}
            />

            <WodSection copy={copy} wod={dashboard.todayWod} navigate={navigate} />

            <WeekProgressSection copy={copy} dashboard={dashboard} />
          </div>

          <aside className="student-dashboard-column student-dashboard-column-side">
            <AnnouncementsSection copy={copy} items={dashboard.announcements} />
            <BirthdaysSection copy={copy} items={dashboard.birthdays} />
            <MotivationCard />
          </aside>
        </section>
      </section>
    </StudentDashboardLayout>
  )
}
