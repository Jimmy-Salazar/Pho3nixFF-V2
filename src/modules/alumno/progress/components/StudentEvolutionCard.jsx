import {
  buildEvolutionChart,
  formatDate,
  formatShortDate,
  normalizeEvolutionRows,
  numberText,
} from "../utils/studentProgressUtils.js"

function pointsToString(points) {
  return points.map((point) => `${point.x},${point.y}`).join(" ")
}

function SeriesChart({
  title,
  unit,
  rows,
  points,
  limitPoints,
  ticks,
  yScale,
  left,
  right,
  showLimit,
  limitLabel,
  locale,
  className,
}) {
  return (
    <section className={`student-evolution-series ${className}`}>
      <header className="student-evolution-series-header">
        <strong>{title}</strong>
        {showLimit ? <small>{limitLabel}</small> : null}
      </header>

      <div className="student-evolution-chart">
        <svg viewBox="0 0 730 270" role="img" aria-label={title}>
          {ticks.map((tick) => {
            const y = yScale(tick)
            return (
              <g key={`${className}-${tick}`}>
                <line x1={left} x2={right} y1={y} y2={y} />
                <text x="8" y={y + 4}>{tick}</text>
              </g>
            )
          })}

          {showLimit ? <polyline className="is-limit" points={pointsToString(limitPoints)} /> : null}
          <polyline className="is-series" points={pointsToString(points)} />

          {points.map((point, index) => (
            <g key={point.key}>
              <circle className="is-series" cx={point.x} cy={point.y} r="5" />
              <text className="student-evolution-value" x={point.x} y={point.y - 12} textAnchor="middle">
                {point.label}{unit}
              </text>
              <text className="student-evolution-month" x={point.x} y="254" textAnchor="middle">
                {formatShortDate(rows[index]?.fecha_analisis, locale)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  )
}

export default function StudentEvolutionCard({
  copy,
  history,
  locale,
  showAdultReference = true,
}) {
  const rows = normalizeEvolutionRows(history, { showAdultReference })
  const chart = buildEvolutionChart(rows, { showAdultReference, locale })

  return (
    <article className="student-progress-card student-evolution-card">
      <header>
        <div><p>↗ {copy.evolution}</p><h2>{copy.evolutionSubtitle}</h2></div>
      </header>

      {!rows.length ? (
        <div className="student-progress-empty">{copy.noEvolution}</div>
      ) : (
        <>
          <div className="student-evolution-series-grid">
            <SeriesChart
              title={copy.weightTrend}
              unit=" kg"
              rows={rows}
              points={chart.weightPoints}
              limitPoints={chart.weightLimitPoints}
              ticks={chart.weightTicks}
              yScale={chart.yWeight}
              left={chart.left}
              right={chart.right}
              showLimit={showAdultReference}
              limitLabel={copy.weightLimit}
              locale={locale}
              className="is-weight"
            />

            <SeriesChart
              title={copy.bmiTrend}
              unit=""
              rows={rows}
              points={chart.bmiPoints}
              limitPoints={chart.bmiLimitPoints}
              ticks={chart.bmiTicks}
              yScale={chart.yBmi}
              left={chart.left}
              right={chart.right}
              showLimit={showAdultReference}
              limitLabel={copy.bmiLimit}
              locale={locale}
              className="is-bmi"
            />
          </div>

          <div className="student-evolution-table">
            {rows.map((item) => (
              <div key={item.id || item.fecha_analisis}>
                <span>{formatDate(item.fecha_analisis, locale)}</span>
                <strong>{numberText(item.peso_kg, 1, locale)} kg</strong>
                <b>{numberText(item.bmi, 1, locale)} {copy.bmi}</b>
              </div>
            ))}
          </div>
        </>
      )}
    </article>
  )
}
