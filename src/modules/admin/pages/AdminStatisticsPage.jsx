import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useAuth } from "../../auth/context/AuthContext.jsx"
import { useI18n } from "../../../i18n/I18nProvider.jsx"

import AdminDashboardSidebar from "../dashboard/components/AdminDashboardSidebar.jsx"
import AdminMobileNav from "../dashboard/components/AdminMobileNav.jsx"
import { getAdminDashboardCopy } from "../dashboard/i18n/adminDashboardCopy.js"

import AdminStatisticsHeader from "../statistics/components/AdminStatisticsHeader.jsx"
import AdminStatisticsFilters from "../statistics/components/AdminStatisticsFilters.jsx"
import AdminStatisticsSummary from "../statistics/components/AdminStatisticsSummary.jsx"
import AdminAthleteStatistics from "../statistics/components/AdminAthleteStatistics.jsx"
import AdminPrStatistics from "../statistics/components/AdminPrStatistics.jsx"
import AdminWodStatistics from "../statistics/components/AdminWodStatistics.jsx"
import {
  ActivityPanel,
  AlertsPanel,
  HighlightedAthletesPanel,
  MembershipPanel,
  PrPanel,
  WodPanel,
} from "../statistics/components/AdminStatisticsPanels.jsx"
import { getAdminStatisticsCopy } from "../statistics/i18n/adminStatisticsCopy.js"
import {
  loadAdminAthleteStatisticsDetail,
  loadAdminStatisticsData,
} from "../statistics/services/adminStatisticsService.js"
import {
  buildStatisticsCsv,
  EMPTY_ATHLETE_DETAIL,
  EMPTY_STATISTICS_DATA,
} from "../statistics/utils/adminStatisticsUtils.js"

import "../../../styles/adminDashboard.css"
import "../../../styles/adminStatistics.css"

export default function AdminStatisticsPage() {
  const navigate = useNavigate()
  const { locale, setLocale } = useI18n()
  const { logout, profile: authProfile } = useAuth()
  const dashboardCopy = useMemo(() => getAdminDashboardCopy(locale), [locale])
  const copy = useMemo(() => getAdminStatisticsCopy(locale), [locale])

  const [section, setSection] = useState("summary")
  const [period, setPeriod] = useState(30)
  const [prMode, setPrMode] = useState("general")
  const [selectedAthleteId, setSelectedAthleteId] = useState("")
  const [data, setData] = useState(EMPTY_STATISTICS_DATA)
  const [athleteDetail, setAthleteDetail] = useState(EMPTY_ATHLETE_DETAIL)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState("")
  const [detailError, setDetailError] = useState("")
  const [feedback, setFeedback] = useState("")
  const resolvedProfile = data.profile || authProfile || null

  const loadStatistics = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const payload = await loadAdminStatisticsData({ days: period, locale })
      setData(payload)
    } catch (loadError) {
      console.error("ADMIN STATISTICS LOAD ERROR:", loadError)
      setError(loadError?.code === "ADMIN_ONLY" ? copy.accessDenied : copy.loadError)
    } finally {
      setLoading(false)
    }
  }, [copy.loadError, locale, period])

  const loadAthleteDetail = useCallback(async () => {
    if (!selectedAthleteId) return

    try {
      setDetailLoading(true)
      setDetailError("")
      const payload = await loadAdminAthleteStatisticsDetail({
        athleteId: selectedAthleteId,
        days: period,
        locale,
      })
      setAthleteDetail(payload)
    } catch (loadError) {
      console.error("ADMIN ATHLETE STATISTICS DETAIL ERROR:", loadError)
      setDetailError(loadError?.code === "ADMIN_ONLY" ? copy.accessDenied : copy.detailLoadError)
    } finally {
      setDetailLoading(false)
    }
  }, [copy.detailLoadError, locale, period, selectedAthleteId])

  useEffect(() => { loadStatistics() }, [loadStatistics])

  useEffect(() => {
    const athletes = data.athletes || []
    if (!athletes.length) {
      setSelectedAthleteId("")
      return
    }

    const exists = athletes.some((athlete) => String(athlete.id) === String(selectedAthleteId))
    if (!exists) setSelectedAthleteId(String(athletes[0].id))
  }, [data.athletes, selectedAthleteId])

  const needsAthleteDetail = section === "prs" && prMode === "individual"

  useEffect(() => {
    if (!needsAthleteDetail || !selectedAthleteId) return
    loadAthleteDetail()
  }, [loadAthleteDetail, needsAthleteDetail, selectedAthleteId])

  useEffect(() => {
    if (!feedback) return undefined
    const timeoutId = window.setTimeout(() => setFeedback(""), 2600)
    return () => window.clearTimeout(timeoutId)
  }, [feedback])

  async function handleLogout() {
    try {
      await logout()
    } catch (logoutError) {
      console.error("ADMIN STATISTICS LOGOUT ERROR:", logoutError)
      window.location.href = "/"
    }
  }

  function handleSelectAthlete(value) {
    setSelectedAthleteId(String(value || ""))
    setAthleteDetail(EMPTY_ATHLETE_DETAIL)
    setDetailError("")
  }

  function handleExport() {
    try {
      setExporting(true)
      const csv = buildStatisticsCsv(data, copy, locale)
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `pho3nix-estadisticas-${data.range.startIso || "inicio"}-${data.range.endIso || "fin"}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setFeedback(copy.exportSuccess)
    } catch (exportError) {
      console.error("ADMIN STATISTICS EXPORT ERROR:", exportError)
      setError(copy.exportError)
    } finally {
      setExporting(false)
    }
  }

  const show = useMemo(() => ({
    activity: ["summary", "wods"].includes(section),
    memberships: ["summary", "memberships"].includes(section),
    wods: ["summary", "wods"].includes(section),
    prs: section === "summary",
    alerts: ["summary", "memberships"].includes(section),
    athletes: section === "summary",
  }), [section])

  const showStandardPanels = !["athletes", "prs", "wods"].includes(section)

  return (
    <div className="admin-dashboard-screen admin-statistics-screen">
      <div className="admin-dashboard-orb admin-dashboard-orb-a" aria-hidden="true" />
      <div className="admin-dashboard-orb admin-dashboard-orb-b" aria-hidden="true" />

      <AdminDashboardSidebar
        copy={dashboardCopy}
        profile={resolvedProfile}
        locale={locale}
        setLocale={setLocale}
        navigate={navigate}
        onLogout={handleLogout}
      />

      <div className="admin-dashboard-main">
        <AdminStatisticsHeader
          dashboardCopy={dashboardCopy}
          copy={copy}
          locale={locale}
          setLocale={setLocale}
          profile={resolvedProfile}
          loading={loading && !data.profile}
          exporting={exporting}
          onExport={handleExport}
          onLogout={handleLogout}
        />

        <main className="admin-dashboard-content admin-statistics-content">
          {error ? (
            <section className="admin-dashboard-error" role="alert">
              <div><strong>{copy.loadError}</strong><p>{error}</p></div>
              <button type="button" onClick={loadStatistics}>{copy.retry}</button>
            </section>
          ) : null}

          <AdminStatisticsFilters
            copy={copy}
            section={section}
            period={period}
            loading={loading}
            onSection={setSection}
            onPeriod={setPeriod}
          />

          {section === "athletes" ? (
            <AdminAthleteStatistics
              copy={copy}
              locale={locale}
              stats={data.athleteStats}
            />
          ) : null}

          {section === "prs" ? (
            <AdminPrStatistics
              copy={copy}
              locale={locale}
              stats={data.prStats}
              athletes={data.athletes}
              mode={prMode}
              onMode={setPrMode}
              selectedAthleteId={selectedAthleteId}
              onSelectAthlete={handleSelectAthlete}
              detail={athleteDetail}
              detailLoading={detailLoading}
              detailError={detailError}
              onRetryDetail={loadAthleteDetail}
            />
          ) : null}

          {section === "wods" ? (
            <AdminWodStatistics
              copy={copy}
              locale={locale}
              stats={data.wodStats}
            />
          ) : null}

          {showStandardPanels ? (
            <>
              <AdminStatisticsSummary copy={copy} summary={data.summary} loading={loading} />
              <section className="admin-statistics-panels">
                <ActivityPanel copy={copy} series={data.activitySeries} activeAthletes={data.summary.activeAthletes} visible={show.activity} />
                <MembershipPanel copy={copy} summary={data.membershipSummary} visible={show.memberships} />
                <WodPanel copy={copy} series={data.wodWeekSeries} participationRate={data.summary.wodParticipationRate} visible={show.wods} />
                <PrPanel copy={copy} series={data.prMovementSeries} visible={show.prs} />
                <AlertsPanel copy={copy} alerts={data.alerts} visible={show.alerts} navigate={navigate} />
                <HighlightedAthletesPanel copy={copy} athletes={data.highlightedAthletes} visible={show.athletes} />
              </section>
            </>
          ) : null}

          {data.diagnostics.length ? <p className="admin-statistics-diagnostics">{copy.optionalDataNotice}</p> : null}
        </main>
      </div>

      <AdminMobileNav copy={dashboardCopy} navigate={navigate} />

      {feedback ? <div className="admin-statistics-feedback" role="status" aria-live="polite"><span>✓</span><strong>{feedback}</strong></div> : null}
    </div>
  )
}
