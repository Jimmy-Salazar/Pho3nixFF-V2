const FIELDS = [
  ["resumen", "summary"],
  ["diagnostico", "diagnosis"],
  ["nutricion", "nutrition"],
  ["entrenamiento", "training"],
  ["pre_wod", "preWod"],
  ["post_wod", "postWod"],
  ["hidratacion", "hydration"],
  ["descanso", "rest"],
]

export default function StudentAiRecommendationCard({
  copy,
  analysis,
  goalLabel,
  translating = false,
  translationError = "",
}) {
  return (
    <article className="student-progress-card student-ai-card">
      <header>
        <div><p>✦ {copy.recommendation}</p><h2>{goalLabel || copy.goalTitle}</h2></div>
        <span>IA</span>
      </header>

      {translating ? (
        <div className="student-ai-translating" role="status" aria-live="polite">
          <i aria-hidden="true" />
          <strong>{copy.translatingRecommendation}</strong>
          <p>{copy.translatingRecommendationText}</p>
        </div>
      ) : !analysis ? (
        <div className="student-ai-empty">
          <strong>{copy.noAiAnalysis}</strong>
          <p>{copy.noAiAnalysisText}</p>
        </div>
      ) : (
        <>
          {translationError ? (
            <div className="student-ai-translation-warning">
              <strong>{copy.translationFailed}</strong>
              <p>{copy.originalLanguageShown}</p>
            </div>
          ) : null}

          <div className="student-ai-grid">
            {FIELDS.map(([field, label]) => (
              <section key={field}>
                <h3>{copy[label]}</h3>
                <p>{analysis[field] || copy.noInformation}</p>
              </section>
            ))}
          </div>

          <div className="student-ai-alert">
            <strong>{copy.professionalAlert}</strong>
            <p>{analysis.alerta || copy.defaultAlert}</p>
          </div>
        </>
      )}
    </article>
  )
}
