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
  fetchStudentMeasurementHistory,
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
  cintura_cm: "",
  horas_sueno: "",
  nivel_energia: "",
  lesiones: "",
  observaciones: "",
  meta: "perder_grasa",
}

const EMPTY_DATA = {
  athlete: null,
  nutritionProfile: null,
  membership: null,
  wodSummary: null,
  prSummary: null,
  history: [],
  measurementHistory: [],
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
  const userId = user?.id || null
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
    if (!userId) {
      setLoading(false)
      return null
    }

    try {
      if (showLoading) setLoading(true)
      setError("")

      const payload = await fetchStudentProgressBundle({
        userId,
        authProfile,
      })

      setData(payload)
      setForm({
        peso_kg: payload.nutritionProfile?.peso_kg || "",
        estatura_cm: payload.nutritionProfile?.estatura_cm || "",
        cintura_cm: payload.nutritionProfile?.cintura_cm || "",
        horas_sueno: payload.nutritionProfile?.horas_sueno ?? "",
        nivel_energia: payload.nutritionProfile?.nivel_energia ?? "",
        lesiones: payload.nutritionProfile?.lesiones || "",
        observaciones: payload.nutritionProfile?.observaciones || "",
        meta: payload.nutritionProfile?.meta || "perder_grasa",
      })
      return payload
    } catch (loadError) {
      console.error("Error loading athlete progress:", loadError)
      setError(loadError.message || "LOAD_ERROR")
      return null
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [authProfile, userId])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadData])

  useEffect(() => {
    let active = true

    const timeoutId = window.setTimeout(async () => {
      const analysis = data.latestAnalysis

      if (!analysis) {
        if (!active) return
        setLocalizedAnalysis(null)
        setTranslatingAnalysis(false)
        setTranslationError("")
        return
      }

      const storedAnalysis = getStoredLocalizedNutritionAnalysis(analysis, locale)

      if (storedAnalysis) {
        if (!active) return
        setLocalizedAnalysis(storedAnalysis)
        setTranslatingAnalysis(false)
        setTranslationError("")
        return
      }

      setLocalizedAnalysis(null)
      setTranslatingAnalysis(true)
      setTranslationError("")

      try {
        const translatedAnalysis = await localizeStudentNutritionAnalysis({ analysis, locale })
        if (!active) return
        setLocalizedAnalysis(translatedAnalysis)
      } catch (localizationError) {
        if (!active) return
        console.error("Error translating nutrition analysis:", localizationError)
        setLocalizedAnalysis(analysis)
        setTranslationError(
          localizationError?.message || copy.translationFailed
        )
      } finally {
        if (active) setTranslatingAnalysis(false)
      }
    }, 0)

    return () => {
      active = false
      window.clearTimeout(timeoutId)
    }
  }, [copy.translationFailed, data.latestAnalysis, locale])

  useEffect(() => {
    if (!actionPopup.open) return undefined
    const timeoutId = window.setTimeout(() => {
      setActionPopup({ open: false, message: "", description: "" })
    }, 4000)
    return () => window.clearTimeout(timeoutId)
  }, [actionPopup.open])

  const activeGoal = !data.canAnalyze && data.latestAnalysis?.meta
    ? data.latestAnalysis.meta
    : form.meta
  const goalLocked = !data.canAnalyze && Boolean(data.latestAnalysis?.meta)
  const reference = useMemo(
    () => buildBodyReference(form, data.athlete?.edad),
    [data.athlete?.edad, form]
  )
  const hasReference = Number(form.peso_kg) > 0 && Number(form.estatura_cm) > 0
  const membership = useMemo(
    () => getMembershipStatus(data.membership, copy, locale),
    [copy, data.membership, locale]
  )
  const profileName = data.athlete?.nombre || authProfile?.nombre || user?.email || copy.athlete
  const initials = getInitials(profileName)
  const score = data.liveScore ?? "--"
  const goalLabels = useMemo(
    () => Object.fromEntries(getGoalOptions(copy).map((item) => [item.id, item.title])),
    [copy]
  )

  function mapError(errorValue, fallback) {
    const message = errorValue?.message || ""
    if (message === "INVALID_WEIGHT") return copy.invalidWeight
    if (message === "INVALID_HEIGHT") return copy.invalidHeight
    if (message === "INVALID_WAIST") return copy.invalidWaist
    if (message === "INVALID_SLEEP") return copy.invalidSleep
    if (message === "INVALID_ENERGY") return copy.invalidEnergy
    if (message === "INVALID_GOAL") return copy.invalidGoal
    if (message === "PROFILE_INCOMPLETE") return copy.profileIncomplete
    if (message === "ANALYSIS_IN_PROGRESS") return copy.analysisInProgress
    if (message === "INVALID_AI_RESPONSE") return copy.invalidAiResponse
    if (["AI_PROVIDER_ERROR", "AI_CONFIGURATION_ERROR", "ANALYSIS_FAILED"].includes(message)) return fallback
    if (message.startsWith("ANALYSIS_LOCKED:")) {
      const days = Number(message.split(":")[1] || 0)
      return `${copy.missingDays} ${days} ${days === 1 ? copy.daySingular : copy.dayPlural}`
    }
    if (message.startsWith("ANALYSIS_RATE_LIMITED:")) {
      const minutes = Number(message.split(":")[1] || 1)
      return `${copy.analysisRateLimited} ${minutes} ${minutes === 1 ? copy.minuteSingular : copy.minutePlural}.`
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
      const saved = await saveStudentNutritionProfile(userId, payload)

      let measurementHistory = data.measurementHistory
      try {
        measurementHistory = await fetchStudentMeasurementHistory(userId)
      } catch (refreshError) {
        console.error("Error refreshing athlete measurement history:", refreshError)
      }

      setForm(saved)
      setData((current) => ({
        ...current,
        nutritionProfile: saved,
        measurementHistory,
        reference: buildBodyReference(saved, current.athlete?.edad),
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
      await saveStudentNutritionProfile(userId, clean)

      await createStudentNutritionAnalysis({ locale })

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

          {error ? <div className="student-progress-error" role="alert">{error === "LOAD_ERROR" ? copy.loadError : error}</div> : null}

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
                locale={locale}
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
                locale={locale}
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
                  history={data.measurementHistory?.length ? data.measurementHistory : data.history}
                  locale={locale}
                  showAdultReference={reference?.isAdultReference === true}
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
