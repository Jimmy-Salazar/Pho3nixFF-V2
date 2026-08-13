import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useI18n } from "../../../i18n/I18nProvider.jsx"
import { useAuth } from "../../auth/context/AuthContext.jsx"

import StudentSidebar from "../dashboard/components/StudentSidebar.jsx"
import StudentMobileNav from "../dashboard/components/StudentMobileNav.jsx"
import StudentDashboardHeader from "../dashboard/components/StudentDashboardHeader.jsx"

import StudentAiRecommendationCard from "../progress/components/StudentAiRecommendationCard.jsx"
import StudentAnalysisHistoryCard from "../progress/components/StudentAnalysisHistoryCard.jsx"
import StudentAthleteDataCard from "../progress/components/StudentAthleteDataCard.jsx"
import StudentEvolutionCard from "../progress/components/StudentEvolutionCard.jsx"
import StudentGoalSelector from "../progress/components/StudentGoalSelector.jsx"
import StudentMeasurementModal from "../progress/components/StudentMeasurementModal.jsx"
import StudentMonthlyAnalysisCard from "../progress/components/StudentMonthlyAnalysisCard.jsx"
import StudentProgressActionPopup from "../progress/components/StudentProgressActionPopup.jsx"
import StudentProgressHero from "../progress/components/StudentProgressHero.jsx"
import StudentProgressLoading from "../progress/components/StudentProgressLoading.jsx"
import StudentReferenceRangeCard from "../progress/components/StudentReferenceRangeCard.jsx"
import StudentThirtyDaySummary from "../progress/components/StudentThirtyDaySummary.jsx"

import { getStudentProgressCopy } from "../progress/i18n/studentProgressCopy.js"
import {
  createStudentNutritionAnalysis,
  fetchStudentProgressBundle,
  getStoredLocalizedNutritionAnalysis,
  localizeStudentNutritionAnalysis,
  saveStudentNutritionProfile,
} from "../progress/services/studentProgressService.js"
import {
  buildBodyReference,
  getGoalOptions,
  getInitials,
  getMembershipStatus,
  validateNutritionProfile,
} from "../progress/utils/studentProgressUtils.js"

import "../../../styles/studentDashboard.css"
import "../../../styles/studentProgress.css"

const INITIAL_FORM = {
  peso_kg: "",
  estatura_cm: "",
  meta: "perder_grasa",
}

const EMPTY_DATA = {
  athlete: null,
  nutritionProfile: null,
  membership: null,
  wodSummary: null,
  prSummary: null,
  history: [],
  latestAnalysis: null,
  nextAnalysis: null,
  daysToAnalyze: 0,
  canAnalyze: true,
  reference: null,
}

export default function StudentProgressPage() {
  const navigate = useNavigate()
  const { locale } = useI18n()
  const { user, profile: authProfile, logout } = useAuth()
  const copy = useMemo(() => getStudentProgressCopy(locale), [locale])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState("")
  const [data, setData] = useState(EMPTY_DATA)
  const [form, setForm] = useState(INITIAL_FORM)
  const [measurementsOpen, setMeasurementsOpen] = useState(false)
  const [localizedAnalysis, setLocalizedAnalysis] = useState(null)
  const [translatingAnalysis, setTranslatingAnalysis] = useState(false)
  const [translationError, setTranslationError] = useState("")
  const [actionPopup, setActionPopup] = useState({ open: false, message: "", description: "" })

  const showPopup = useCallback((message, description = "") => {
    setActionPopup({ open: true, message, description })
  }, [])

  const loadData = useCallback(async ({ showLoading = true } = {}) => {
    if (!user?.id) {
      setLoading(false)
      return null
    }

    try {
      if (showLoading) setLoading(true)
      setError("")

      const payload = await fetchStudentProgressBundle({
        userId: user.id,
        authProfile,
      })

      setData(payload)
      setForm({
        peso_kg: payload.nutritionProfile?.peso_kg || "",
        estatura_cm: payload.nutritionProfile?.estatura_cm || "",
        meta: payload.nutritionProfile?.meta || "perder_grasa",
      })
      return payload
    } catch (loadError) {
      console.error("Error loading athlete progress:", loadError)
      setError(loadError.message || copy.loadError)
      return null
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [authProfile, copy.loadError, user?.id])

  useEffect(() => {
    loadData()
  }, [loadData])


  useEffect(() => {
    let active = true
    const analysis = data.latestAnalysis

    if (!analysis) {
      setLocalizedAnalysis(null)
      setTranslatingAnalysis(false)
      setTranslationError("")
      return undefined
    }

    const storedAnalysis = getStoredLocalizedNutritionAnalysis(analysis, locale)

    if (storedAnalysis) {
      setLocalizedAnalysis(storedAnalysis)
      setTranslatingAnalysis(false)
      setTranslationError("")
      return undefined
    }

    setLocalizedAnalysis(null)
    setTranslatingAnalysis(true)
    setTranslationError("")

    localizeStudentNutritionAnalysis({ analysis, locale })
      .then((translatedAnalysis) => {
        if (!active) return
        setLocalizedAnalysis(translatedAnalysis)
      })
      .catch((localizationError) => {
        if (!active) return
        console.error("Error translating nutrition analysis:", localizationError)
        setLocalizedAnalysis(analysis)
        setTranslationError(
          localizationError?.message || copy.translationFailed
        )
      })
      .finally(() => {
        if (active) setTranslatingAnalysis(false)
      })

    return () => {
      active = false
    }
  }, [copy.translationFailed, data.latestAnalysis, locale])

  useEffect(() => {
    if (!actionPopup.open) return undefined
    const timeoutId = window.setTimeout(() => {
      setActionPopup({ open: false, message: "", description: "" })
    }, 2400)
    return () => window.clearTimeout(timeoutId)
  }, [actionPopup.open])

  const activeGoal = !data.canAnalyze && data.latestAnalysis?.meta
    ? data.latestAnalysis.meta
    : form.meta
  const goalLocked = !data.canAnalyze && Boolean(data.latestAnalysis?.meta)
  const reference = useMemo(() => buildBodyReference(form), [form])
  const hasReference = Number(form.peso_kg) > 0 && Number(form.estatura_cm) > 0
  const membership = useMemo(
    () => getMembershipStatus(data.membership, copy),
    [copy, data.membership]
  )
  const profileName = data.athlete?.nombre || authProfile?.nombre || user?.email || copy.athlete
  const initials = getInitials(profileName)
  const score = data.latestAnalysis?.score_pho3nix ?? "--"
  const goalLabels = useMemo(
    () => Object.fromEntries(getGoalOptions(copy).map((item) => [item.id, item.title])),
    [copy]
  )

  function mapError(errorValue, fallback) {
    const message = errorValue?.message || ""
    if (message === "INVALID_WEIGHT") return copy.invalidWeight
    if (message === "INVALID_HEIGHT") return copy.invalidHeight
    if (message === "INVALID_GOAL") return copy.invalidGoal
    if (message.startsWith("ANALYSIS_LOCKED:")) {
      const days = message.split(":")[1]
      return `${copy.missingDays} ${days} ${copy.days}`
    }
    return message || fallback
  }

  async function handleSaveMeasurements(draft) {
    try {
      setSaving(true)
      setError("")

      const payload = validateNutritionProfile({
        ...form,
        ...draft,
        meta: activeGoal,
      })
      const saved = await saveStudentNutritionProfile(user?.id, payload)

      setForm(saved)
      setData((current) => ({
        ...current,
        nutritionProfile: saved,
        reference: buildBodyReference(saved),
      }))
      setMeasurementsOpen(false)
      showPopup(copy.dataSaved)
    } catch (saveError) {
      console.error("Error saving athlete nutrition profile:", saveError)
      setError(mapError(saveError, copy.saveError))
    } finally {
      setSaving(false)
    }
  }

  async function handleAnalyze() {
    try {
      setAnalyzing(true)
      setError("")

      const clean = validateNutritionProfile({
        ...form,
        meta: activeGoal,
      })
      const savedProfile = await saveStudentNutritionProfile(user?.id, clean)

      await createStudentNutritionAnalysis({
        athlete: data.athlete,
        profile: savedProfile,
        locale,
      })

      await loadData({ showLoading: false })
      showPopup(copy.analysisSaved)
    } catch (analysisError) {
      console.error("Error generating athlete nutrition analysis:", analysisError)
      setError(mapError(analysisError, copy.analysisError))
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) return <StudentProgressLoading copy={copy} />

  return (
    <main className="student-dashboard student-progress-page">
      <StudentSidebar copy={copy} membership={membership} navigate={navigate} onLogout={logout} />

      <section className="student-dashboard-main student-progress-main">
        <div className="student-dashboard-orb student-dashboard-orb-a" />
        <div className="student-dashboard-orb student-dashboard-orb-b" />

        <div className="student-progress-inner">
          <StudentDashboardHeader
            copy={copy}
            profileName={profileName}
            initials={initials}
            photoUrl={data.athlete?.foto_url}
            onLogout={logout}
          />

          <StudentProgressHero copy={copy} score={score} />

          {error ? <div className="student-progress-error">{error}</div> : null}

          <section className="student-progress-columns">
            <div className="student-progress-column">
              <StudentAthleteDataCard
                copy={copy}
                athlete={data.athlete}
                profile={form}
                locale={locale}
                onEdit={() => setMeasurementsOpen(true)}
              />

              <StudentReferenceRangeCard
                copy={copy}
                reference={reference}
                hasReference={hasReference}
              />

              <StudentGoalSelector
                copy={copy}
                value={activeGoal}
                locked={goalLocked}
                daysRemaining={data.daysToAnalyze}
                onChange={(meta) => setForm((current) => ({ ...current, meta }))}
              />

              <StudentMonthlyAnalysisCard
                copy={copy}
                latestAnalysis={data.latestAnalysis}
                canAnalyze={data.canAnalyze}
                daysRemaining={data.daysToAnalyze}
                nextAnalysis={data.nextAnalysis}
                analyzing={analyzing}
                saving={saving}
                locale={locale}
                onAnalyze={handleAnalyze}
              />
            </div>

            <div className="student-progress-column">
              <StudentThirtyDaySummary
                copy={copy}
                wodSummary={data.wodSummary}
                prSummary={data.prSummary}
              />

              <StudentAiRecommendationCard
                copy={copy}
                analysis={localizedAnalysis}
                goalLabel={goalLabels[activeGoal]}
                translating={translatingAnalysis}
                translationError={translationError}
              />

              <div className="student-progress-bottom-grid">
                <StudentEvolutionCard
                  copy={copy}
                  history={data.history}
                  locale={locale}
                />

                <StudentAnalysisHistoryCard
                  copy={copy}
                  history={data.history}
                  locale={locale}
                  goalLabels={goalLabels}
                />
              </div>
            </div>
          </section>
        </div>
      </section>

      <StudentMobileNav copy={copy} navigate={navigate} />

      <StudentMeasurementModal
        open={measurementsOpen}
        copy={copy}
        profile={form}
        saving={saving}
        onClose={() => !saving && setMeasurementsOpen(false)}
        onSave={handleSaveMeasurements}
      />

      <StudentProgressActionPopup
        open={actionPopup.open}
        message={actionPopup.message}
        description={actionPopup.description}
        copy={copy}
        onClose={() => setActionPopup({ open: false, message: "", description: "" })}
      />
    </main>
  )
}
