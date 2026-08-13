import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { supabase } from "../../../config/supabase.js"
import { useI18n } from "../../../i18n/I18nProvider.jsx"
import { useAuth } from "../../auth/context/AuthContext.jsx"

import StudentSidebar from "../dashboard/components/StudentSidebar.jsx"
import StudentMobileNav from "../dashboard/components/StudentMobileNav.jsx"
import StudentDashboardHeader from "../dashboard/components/StudentDashboardHeader.jsx"
import { getStudentDashboardCopy } from "../dashboard/i18n/studentDashboardCopy.js"
import { getMembershipInfo, getMembershipLabel } from "../dashboard/utils/studentDashboardUtils.js"

import StudentPdaGeneralRanking from "../pda/components/StudentPdaGeneralRanking.jsx"
import StudentPdaHero from "../pda/components/StudentPdaHero.jsx"
import StudentPdaWodDetailModal from "../pda/components/StudentPdaWodDetailModal.jsx"
import StudentPdaWodRankingModal from "../pda/components/StudentPdaWodRankingModal.jsx"
import StudentPdaWods from "../pda/components/StudentPdaWods.jsx"

import { getStudentPdaCopy } from "../pda/i18n/studentPdaCopy.js"
import {
  EMPTY_STUDENT_PDA,
  fetchPdaWodRanking,
  loadStudentPdaData,
} from "../pda/services/studentPdaService.js"
import {
  getInitials,
  isPdaSeasonVisible,
} from "../pda/utils/studentPdaUtils.js"

import "../../../styles/studentDashboard.css"
import "../../../styles/studentPda.css"

export default function StudentPdaPage() {
  const navigate = useNavigate()
  const { locale } = useI18n()
  const { user, profile: authProfile, logout } = useAuth()

  const copy = useMemo(() => getStudentPdaCopy(locale), [locale])
  const dashboardCopy = useMemo(() => getStudentDashboardCopy(locale), [locale])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [data, setData] = useState(EMPTY_STUDENT_PDA)
  const [detailWod, setDetailWod] = useState(null)
  const [rankingModal, setRankingModal] = useState(null)
  const [rankingRows, setRankingRows] = useState([])
  const [rankingLoading, setRankingLoading] = useState(false)

  const seasonVisible = isPdaSeasonVisible()

  const loadData = useCallback(async ({ showLoading = true } = {}) => {
    try {
      if (showLoading) setLoading(true)
      setError("")

      const authUser = user || (await supabase.auth.getUser())?.data?.user
      const payload = await loadStudentPdaData({ authUser, authProfile })
      setData({ ...EMPTY_STUDENT_PDA, ...payload })
    } catch (loadError) {
      console.error("Error loading athlete PDA V2:", loadError)
      setError(loadError?.message || copy.error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [authProfile, copy.error, user])

  useEffect(() => {
    if (!seasonVisible) {
      navigate("/atleta/dashboard", { replace: true })
      return
    }

    loadData()
  }, [loadData, navigate, seasonVisible])

  const profileName = data.profile?.nombre || authProfile?.nombre || user?.email || copy.athleteFallback
  const initials = getInitials(profileName)
  const currentUserId = data.profile?.id || user?.id

  const membership = useMemo(() => {
    const info = getMembershipInfo(data.membership, new Date())
    return getMembershipLabel(data.membership, info, dashboardCopy)
  }, [dashboardCopy, data.membership])

  async function openRanking(wod) {
    try {
      setRankingModal(wod)
      setRankingRows([])
      setRankingLoading(true)
      const rows = await fetchPdaWodRanking(wod.id)
      setRankingRows(rows)
    } catch (rankingError) {
      console.error("Error loading PDA WOD ranking:", rankingError)
      setRankingRows([])
    } finally {
      setRankingLoading(false)
    }
  }

  if (!seasonVisible) return null

  return (
    <main className="student-dashboard student-pda-page">
      <StudentSidebar copy={dashboardCopy} membership={membership} navigate={navigate} onLogout={logout} />

      <section className="student-dashboard-main student-pda-main">
        <div className="student-dashboard-orb student-dashboard-orb-a" />
        <div className="student-dashboard-orb student-dashboard-orb-b" />

        <div className="student-pda-inner">
          <StudentDashboardHeader
            copy={dashboardCopy}
            profileName={profileName}
            initials={initials}
            photoUrl={data.profile?.foto_url || authProfile?.foto_url || null}
            onLogout={logout}
          />

          <section className="student-pda-heading">
            <div>
              <p className="student-pda-kicker">{copy.kicker}</p>
              <h1>{copy.title}</h1>
              <p>{copy.subtitle}</p>
            </div>
          </section>

          {error ? <div className="student-pda-error">{error}</div> : null}

          {loading ? (
            <div className="student-pda-inline-loading" aria-live="polite">
              <span />
              <strong>{copy.loading}</strong>
            </div>
          ) : (
            <>
              {data.edition ? <StudentPdaHero copy={copy} data={data} /> : null}

              <section className="student-pda-main-grid">
                <StudentPdaWods
                  copy={copy}
                  locale={locale}
                  wods={data.wods}
                  results={data.results}
                  onDetail={setDetailWod}
                  onRanking={openRanking}
                />

                {data.edition ? (
                  <StudentPdaGeneralRanking
                    copy={copy}
                    rows={data.generalRanking}
                    currentUserId={currentUserId}
                  />
                ) : null}
              </section>
            </>
          )}
        </div>
      </section>

      <StudentMobileNav copy={dashboardCopy} navigate={navigate} />

      {detailWod ? (
        <StudentPdaWodDetailModal
          copy={copy}
          locale={locale}
          wod={detailWod}
          onClose={() => setDetailWod(null)}
        />
      ) : null}

      {rankingModal ? (
        <StudentPdaWodRankingModal
          copy={copy}
          wod={rankingModal}
          rows={rankingRows}
          loading={rankingLoading}
          currentUserId={currentUserId}
          onClose={() => setRankingModal(null)}
        />
      ) : null}
    </main>
  )
}
