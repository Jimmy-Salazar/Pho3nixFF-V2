export default function StudentProgressHero({ copy, score }) {
  const numericScore = Number(score)
  const safeScore = Number.isFinite(numericScore) ? Math.max(0, Math.min(100, numericScore)) : 0

  return (
    <section className="student-progress-hero">
      <div>
        <p>{copy.nutritionTag}</p>
        <h1>{copy.title}</h1>
        <span>{copy.subtitle}</span>
      </div>

      <div className="student-progress-score">
        <span>{copy.scoreCurrent}</span>
        <strong>{score ?? "--"}</strong>
        <small>/100</small>
        <i style={{ "--progress-score": `${safeScore}%` }} />
      </div>
    </section>
  )
}
