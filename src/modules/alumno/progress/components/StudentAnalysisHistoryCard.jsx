import { formatDate, numberText } from "../utils/studentProgressUtils.js"

export default function StudentAnalysisHistoryCard({ copy, history, locale, goalLabels }) {
  return (
    <article className="student-progress-card student-history-card">
      <header>
        <div><p>☷ {copy.history}</p><h2>{copy.latestAnalyses}</h2></div>
        <span>{history?.length || 0}</span>
      </header>

      {!history?.length ? (
        <div className="student-progress-empty">{copy.noHistory}</div>
      ) : (
        <div className="student-history-list">
          {history.slice(0, 5).map((item) => (
            <div key={item.id}>
              <span>
                <strong>{goalLabels[item.meta] || item.meta || copy.monthlyAnalysis}</strong>
                <small>{formatDate(item.fecha_analisis, locale)} · {numberText(item.peso_kg, 1, locale)} kg</small>
              </span>
              <b>{item.score_pho3nix === null || item.score_pho3nix === undefined ? "--" : numberText(item.score_pho3nix, 0, locale)}/100</b>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}
