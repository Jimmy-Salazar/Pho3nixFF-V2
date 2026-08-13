import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useAuth } from "../../auth/context/AuthContext.jsx"
import { useI18n } from "../../../i18n/I18nProvider.jsx"

import AdminDashboardHeader from "../dashboard/components/AdminDashboardHeader.jsx"
import AdminDashboardSidebar from "../dashboard/components/AdminDashboardSidebar.jsx"
import AdminDashboardStats from "../dashboard/components/AdminDashboardStats.jsx"
import AdminMobileNav from "../dashboard/components/AdminMobileNav.jsx"
import AdminOperationsOverview from "../dashboard/components/AdminOperationsOverview.jsx"
import AdminQuickActions from "../dashboard/components/AdminQuickActions.jsx"
import AdminRecentActivity from "../dashboard/components/AdminRecentActivity.jsx"
import AdminUpcomingEvents from "../dashboard/components/AdminUpcomingEvents.jsx"
import {
  getAdminDashboardCopy,
} from "../dashboard/i18n/adminDashboardCopy.js"
import { loadAdminDashboardData } from "../dashboard/services/adminDashboardService.js"
import { EMPTY_ADMIN_DASHBOARD } from "../dashboard/utils/adminDashboardUtils.js"

import "../../../styles/adminDashboard.css"

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { locale, setLocale } = useI18n()
  const { logout } = useAuth()
  const copy = useMemo(() => getAdminDashboardCopy(locale), [locale])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [data, setData] = useState(EMPTY_ADMIN_DASHBOARD)

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const payload = await loadAdminDashboardData({ locale })
      setData(payload)
    } catch (loadError) {
      console.error("ADMIN DASHBOARD ERROR:", loadError)
      setError(loadError?.message || copy.error)
    } finally {
      setLoading(false)
    }
  }, [copy.error, locale])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  async function handleLogout() {
    try {
      await logout()
    } catch (logoutError) {
      console.error("ADMIN LOGOUT ERROR:", logoutError)
      window.location.href = "/"
    }
  }

  return (
    <div className="admin-dashboard-screen">
      <div className="admin-dashboard-orb admin-dashboard-orb-a" aria-hidden="true" />
      <div className="admin-dashboard-orb admin-dashboard-orb-b" aria-hidden="true" />

      <AdminDashboardSidebar
        copy={copy}
        profile={data.profile}
        locale={locale}
        setLocale={setLocale}
        navigate={navigate}
        onLogout={handleLogout}
      />

      <div className="admin-dashboard-main">
        <AdminDashboardHeader
          copy={copy}
          locale={locale}
          setLocale={setLocale}
          profile={data.profile}
          loading={loading}
          onLogout={handleLogout}
        />

        <main className="admin-dashboard-content">
          {error ? (
            <section className="admin-dashboard-error" role="alert">
              <div>
                <strong>{copy.error}</strong>
                <p>{error}</p>
              </div>
              <button type="button" onClick={loadDashboard}>{copy.retry}</button>
            </section>
          ) : null}

          <AdminDashboardStats
            copy={copy}
            metrics={data.metrics}
            loading={loading}
          />

          <section className="admin-dashboard-primary-grid">
            <AdminOperationsOverview
              copy={copy}
              growthSeries={data.growthSeries}
              hasGrowthData={data.hasGrowthData}
              roleSummary={data.roleSummary}
              metrics={data.metrics}
              loading={loading}
            />
          </section>

          <AdminQuickActions copy={copy} navigate={navigate} />

          <section className="admin-dashboard-secondary-grid">
            <AdminRecentActivity
              copy={copy}
              items={data.activities}
              loading={loading}
            />

            <AdminUpcomingEvents
              copy={copy}
              locale={locale}
              items={data.upcomingEvents}
              loading={loading}
              navigate={navigate}
            />
          </section>
        </main>
      </div>

      <AdminMobileNav copy={copy} navigate={navigate} />
    </div>
  )
}
