import {
  buildEvolutionChart,
  formatMonth,
  normalizeEvolutionRows,
  numberText,
} from "../utils/studentProgressUtils.js"

function pointsToString(points) {
  return points.map((point) => `${point.x},${point.y}`).join(" ")
}

export default function StudentEvolutionCard({ copy, history, locale }) {
  const rows = normalizeEvolutionRows(history)
  const chart = buildEvolutionChart(rows)

  return (
    <article className="student-progress-card student-evolution-card">
      <header>
        <div><p>↗ {copy.evolution}</p><h2>{copy.evolutionSubtitle}</h2></div>
      </header>

      {!rows.length ? (
        <div className="student-progress-empty">{copy.noEvolution}</div>
      ) : (
        <>
          <div className="student-evolution-legend">
            <span className="is-weight">{copy.weightKg}</span>
            <span className="is-bmi">{copy.bmi}</span>
            <span className="is-limit">{copy.weightLimit}</span>
          </div>

          <div className="student-evolution-chart">
            <svg viewBox="0 0 730 270" role="img" aria-label={copy.evolutionSubtitle}>
              {chart.weightTicks.map((tick) => {
                const y = chart.yWeight(tick)
                return (
                  <g key={`w-${tick}`}>
                    <line x1={chart.left} x2={chart.right} y1={y} y2={y} />
                    <text x="8" y={y + 4}>{tick}</text>
                  </g>
                )
              })}

              <polyline className="is-weight-limit" points={pointsToString(chart.weightLimitPoints)} />
              <polyline className="is-bmi-limit" points={pointsToString(chart.bmiLimitPoints)} />
              <polyline className="is-weight" points={pointsToString(chart.weightPoints)} />
              <polyline className="is-bmi" points={pointsToString(chart.bmiPoints)} />

              {chart.weightPoints.map((point, index) => (
                <g key={point.key}>
                  <circle className="is-weight" cx={point.x} cy={point.y} r="6" />
                  <text className="student-evolution-value" x={point.x} y={point.y - 12} textAnchor="middle">{point.label}</text>
                  <text className="student-evolution-month" x={point.x} y="254" textAnchor="middle">
                    {formatMonth(rows[index]?.fecha_analisis, locale, true)}
                  </text>
                </g>
              ))}

              {chart.bmiPoints.map((point) => (
                <circle key={point.key} className="is-bmi" cx={point.x} cy={point.y} r="5" />
              ))}
            </svg>
          </div>

          <div className="student-evolution-table">
            {rows.map((item) => (
              <div key={item.id || item.fecha_analisis}>
                <span>{formatMonth(item.fecha_analisis, locale)}</span>
                <strong>{numberText(item.peso_kg)} kg</strong>
                <b>{numberText(item.bmi)} IMC</b>
              </div>
            ))}
          </div>
        </>
      )}
    </article>
  )
}
