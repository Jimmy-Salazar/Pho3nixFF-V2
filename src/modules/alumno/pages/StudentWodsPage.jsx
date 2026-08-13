import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { supabase } from "../../../config/supabase.js"
import { useAuth } from "../../auth/context/AuthContext.jsx"
import { useI18n } from "../../../i18n/I18nProvider.jsx"

import StudentSidebar from "../dashboard/components/StudentSidebar.jsx"
import StudentMobileNav from "../dashboard/components/StudentMobileNav.jsx"
import StudentDashboardHeader from "../dashboard/components/StudentDashboardHeader.jsx"
import { getStudentDashboardCopy } from "../dashboard/i18n/studentDashboardCopy.js"
import { getMembershipInfo, getMembershipLabel } from "../dashboard/utils/studentDashboardUtils.js"

import { getStudentWodsCopy } from "../wods/i18n/studentWodsCopy.js"
import {
  EMPTY_STUDENT_WODS,
  loadStudentWodsData,
  saveStudentWodResult,
  updateStudentWodResult,
} from "../wods/services/studentWodsService.js"
import { getInitials, getTodayUserResult } from "../wods/utils/studentWodsUtils.js"

import StudentWodsHero from "../wods/components/StudentWodsHero.jsx"
import StudentWodsCaloriesCard from "../wods/components/StudentWodsCaloriesCard.jsx"
import StudentWodsWeeklyCalories from "../wods/components/StudentWodsWeeklyCalories.jsx"
import StudentWodsListSection from "../wods/components/StudentWodsListSection.jsx"
import StudentWodsRanking from "../wods/components/StudentWodsRanking.jsx"
import StudentWodsRankingModal from "../wods/components/StudentWodsRankingModal.jsx"
import StudentWodsArchivedSection from "../wods/components/StudentWodsArchivedSection.jsx"
import StudentWodsResultForm from "../wods/components/StudentWodsResultForm.jsx"
import StudentWodsDetailModal from "../wods/components/StudentWodsDetailModal.jsx"
import StudentWodsLoading from "../wods/components/StudentWodsLoading.jsx"

import "../../../styles/studentDashboard.css"
import "../../../styles/studentWods.css"

export default function StudentWodsPage() {
  const navigate = useNavigate()
  const { locale } = useI18n()
  const { user, profile: authProfile, logout } = useAuth()

  const copy = useMemo(() => getStudentWodsCopy(locale), [locale])
  const dashboardCopy = useMemo(() => getStudentDashboardCopy(locale), [locale])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [data, setData] = useState(EMPTY_STUDENT_WODS)
  const [formMode, setFormMode] = useState(null)
  const [selectedWod, setSelectedWod] = useState(null)
  const [editResult, setEditResult] = useState(null)
  const [viewItem, setViewItem] = useState(null)
  const [rankingWod, setRankingWod] = useState(null)
  const [actionPopup, setActionPopup] = useState({
    open: false,
    message: "",
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const authUser = user || (await supabase.auth.getUser())?.data?.user
      const payload = await loadStudentWodsData({ authUser, authProfile })

      setData({ ...EMPTY_STUDENT_WODS, ...payload })
    } catch (loadError) {
      console.error("Error cargando WOD atleta V2:", loadError)
      setError(copy.error)
    } finally {
      setLoading(false)
    }
  }, [authProfile, copy.error, user])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!actionPopup.open) return undefined

    const timeoutId = window.setTimeout(() => {
      setActionPopup({ open: false, message: "" })
    }, 2400)

    return () => window.clearTimeout(timeoutId)
  }, [actionPopup.open])

  const profileName = data.profile?.nombre || authProfile?.nombre || copy.athleteFallback
  const initials = getInitials(profileName)
  const currentUserId = data.profile?.id || user?.id
  const todayUserResult = getTodayUserResult(data.dayHistory, currentUserId)
  const hasRegisteredToday = Boolean(todayUserResult?.id)

  const membership = useMemo(() => {
    const info = getMembershipInfo(data.membership, new Date())
    return getMembershipLabel(data.membership, info, dashboardCopy)
  }, [dashboardCopy, data.membership])

  async function handleSaveResult(payload) {
    const isEditing = formMode === "edit" && Boolean(editResult?.id)

    try {
      setSaving(true)
      setError("")

      if (isEditing) {
        await updateStudentWodResult({
          resultId: editResult.result_id || editResult.id,
          wod: selectedWod || editResult.wod || data.todayWod,
          result: payload,
          estimatedCalories: data.estimatedCalories,
        })
      } else {
        await saveStudentWodResult({
          wod: selectedWod || data.todayWod,
          result: payload,
          estimatedCalories: data.estimatedCalories,
        })
      }

      setFormMode(null)
      setSelectedWod(null)
      setEditResult(null)
      await loadData()

      setActionPopup({
        open: true,
        message: isEditing ? "RESULTADO MODIFICADO" : "RESULTADO GUARDADO",
      })
    } catch (saveError) {
      console.error("Error guardando resultado WOD:", saveError)
      setError(saveError.message || copy.error)
    } finally {
      setSaving(false)
    }
  }

  function openCreateForWod(wodOrRow) {
    const wod = wodOrRow?.wod || wodOrRow || data.todayWod
    setSelectedWod(wod)
    setEditResult(null)
    setFormMode("create")
  }

  function openEditForResult(resultOrRow) {
    const wod = resultOrRow?.wod || data.todayWod
    setSelectedWod(wod)
    setEditResult(resultOrRow)
    setFormMode("edit")
  }

  if (loading) return <StudentWodsLoading copy={copy} />

  return (
    <main className="student-wods-dashboard-layout">
      <StudentSidebar copy={dashboardCopy} membership={membership} navigate={navigate} onLogout={logout} />

      <section className="student-wods-content">
        <div className="student-wods-orb student-wods-orb-a" />
        <div className="student-wods-orb student-wods-orb-b" />

        <div className="student-wods-inner">
          <StudentDashboardHeader
            copy={dashboardCopy}
            profileName={profileName}
            initials={initials}
            photoUrl={data.profile?.foto_url}
            onLogout={logout}
          />

          <section className="student-wods-title">
            <div>
              <p className="student-wods-kicker">{copy.todayWod}</p>
              <h1>{copy.title}</h1>
              <p>{copy.subtitle}</p>
            </div>
          </section>

          {error ? <div className="student-wods-error">{error}</div> : null}

          <section className="student-wods-layout">
            <div className="student-wods-main">
              <div className="student-wods-top-grid">
                <StudentWodsHero
                  copy={copy}
                  locale={locale}
                  wod={data.todayWod}
                  loading={loading}
                  registered={hasRegisteredToday}
                  onOpenRegister={() => openCreateForWod(data.todayWod)}
                />

                <StudentWodsRanking
                  copy={copy}
                  locale={locale}
                  wod={data.todayWod}
                  rows={data.dayHistory}
                  currentUserId={currentUserId}
                  onViewAll={() => setRankingWod(data.todayWod)}
                />
              </div>

              <StudentWodsListSection
                copy={copy}
                title={copy.currentWeekWods}
                subtitle={copy.currentWeekSubtitle}
                rows={data.currentWeekWods}
                locale={locale}
                emptyText={copy.noCurrentWeekWods}
                onView={setViewItem}
                onEdit={openEditForResult}
                onRegister={openCreateForWod}
                onRanking={setRankingWod}
              />
            </div>

            <aside className="student-wods-side">
              <StudentWodsCaloriesCard copy={copy} calories={data.estimatedCalories} loading={loading} />
              <StudentWodsWeeklyCalories copy={copy} weekly={data.weeklyCalories} />
            </aside>
          </section>

<section className="student-wods-archive-area">
            <StudentWodsArchivedSection
              copy={copy}
              rows={data.archivedWods}
              locale={locale}
              onView={setViewItem}
              onEdit={openEditForResult}
              onRegister={openCreateForWod}
              onRanking={setRankingWod}
            />
          </section>
        </div>
      </section>

      <StudentMobileNav copy={dashboardCopy} navigate={navigate} />

      {formMode ? (
        <StudentWodsResultForm
          copy={copy}
          wod={selectedWod || data.todayWod || editResult?.wod}
          saving={saving}
          initialResult={editResult}
          mode={formMode}
          onSave={handleSaveResult}
          onCancel={() => {
            setFormMode(null)
            setSelectedWod(null)
            setEditResult(null)
          }}
        />
      ) : null}

      {viewItem ? (
        <StudentWodsDetailModal
          copy={copy}
          item={viewItem}
          locale={locale}
          onClose={() => setViewItem(null)}
        />
      ) : null}

      {rankingWod ? (
        <StudentWodsRankingModal
          copy={copy}
          locale={locale}
          wod={rankingWod}
          currentUserId={currentUserId}
          seedRows={rankingWod?.id === data.todayWod?.id ? data.dayHistory : []}
          onClose={() => setRankingWod(null)}
        />
      ) : null}

      <ActionConfirmationPopup
        open={actionPopup.open}
        message={actionPopup.message}
        onClose={() => setActionPopup({ open: false, message: "" })}
      />
    </main>
  )
}

function ActionConfirmationPopup({ open, message, onClose }) {
  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-live="assertive"
      aria-label={message}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(0, 0, 0, 0.68)",
        backdropFilter: "blur(7px)",
      }}
    >
      <button
        type="button"
        aria-label="Cerrar confirmación"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
          background: "transparent",
          cursor: "default",
        }}
      />

      <section
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(100%, 390px)",
          border: "1px solid rgba(249, 115, 22, 0.38)",
          borderRadius: 28,
          padding: "28px 24px",
          textAlign: "center",
          color: "#fff",
          background:
            "linear-gradient(145deg, rgba(17,17,17,.98), rgba(5,5,5,.98))",
          boxShadow:
            "0 30px 90px rgba(0,0,0,.72), 0 0 42px rgba(249,115,22,.13)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            margin: "0 auto",
            border: "1px solid rgba(249,115,22,.38)",
            borderRadius: "50%",
            color: "#fb923c",
            background: "rgba(249,115,22,.1)",
            fontSize: 32,
            fontWeight: 900,
          }}
        >
          ✓
        </div>

        <p
          style={{
            margin: "20px 0 0",
            color: "#fb923c",
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: "0.22em",
          }}
        >
          PHO3NIX
        </p>

        <h2
          style={{
            margin: "8px 0 0",
            fontSize: "clamp(20px, 5vw, 26px)",
            fontWeight: 900,
            lineHeight: 1.1,
          }}
        >
          {message}
        </h2>

        <p
          style={{
            margin: "10px 0 0",
            color: "rgba(255,255,255,.48)",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          La operación se completó correctamente.
        </p>
      </section>
    </div>
  )
}