import { formatDate } from "../utils/studentProgressUtils.js"

export default function StudentMonthlyAnalysisCard({
  copy,
  latestAnalysis,
  canAnalyze,
  daysRemaining,
  nextAnalysis,
  analyzing,
  saving,
  locale,
  onAnalyze,
}) {
  const disabled = !canAnalyze || analyzing || saving
  const dayLabel = Number(daysRemaining) === 1 ? copy.daySingular : copy.dayPlural

  return (
    <article className="student-progress-card student-analysis-card">
      <header>
        <div><p>✦ {copy.monthlyAnalysis}</p><h2>{copy.analysisControl}</h2></div>
      </header>

      <div className="student-analysis-dates">
        <div><small>{copy.lastAnalysis}</small><strong>{latestAnalysis?.fecha_analisis ? formatDate(latestAnalysis.fecha_analisis, locale) : copy.noAnalysisYet}</strong></div>
        <div><small>{copy.nextAnalysis}</small><strong>{nextAnalysis ? formatDate(nextAnalysis, locale) : copy.availableNow}</strong></div>
      </div>

      {!canAnalyze ? <p className="student-analysis-lock">🔒 {copy.missingDays} <strong>{daysRemaining}</strong> {dayLabel}</p> : null}

      <button type="button" disabled={disabled} onClick={onAnalyze}>
        {analyzing ? copy.analyzing : copy.analyzeWithAi}
      </button>

      <p>{copy.analysisEvery30}</p>
    </article>
  )
}
