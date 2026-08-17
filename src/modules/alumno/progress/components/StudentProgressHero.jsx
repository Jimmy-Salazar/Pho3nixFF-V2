export default function StudentProgressHero({ copy, score }) {
  const numericScore = Number(score)
  const hasScore = score !== null && score !== undefined && score !== "" && Number.isFinite(numericScore)
  const safeScore = hasScore ? Math.max(0, Math.min(100, numericScore)) : 0

  return (
    <section className="student-progress-hero">
      <div>
        <p>{copy.nutritionTag}</p>
        <h1>{copy.title}</h1>
        <span>{copy.subtitle}</span>
      </div>

      <div className="student-progress-score">
        <span>{copy.scoreCurrent}</span>
        <strong>{hasScore ? score : "--"}</strong>
        <small>{hasScore ? "/100" : copy.scoreNoDataShort}</small>
        <p className="student-progress-score-note">
          {hasScore ? copy.scoreExplanation : copy.scoreNoData}
        </p>
        <i style={{ "--progress-score": `${safeScore}%` }} />
      </div>
    </section>
  )
}
