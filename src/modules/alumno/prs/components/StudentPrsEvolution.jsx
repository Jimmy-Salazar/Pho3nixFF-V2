import { formatDateCompact, formatLb } from "../utils/studentPrsUtils.js"

export default function StudentPrsEvolution({
  copy,
  rows = [],
  exercises = [],
  selectedExerciseId,
  selectedExerciseName,
  onSelectExercise,
}) {
  return (
    <article className="student-prs-card">
      <header>
        <div>
          <p>📈 {copy.evolution}</p>
          <h2>{selectedExerciseName || copy.selectExercise}</h2>
        </div>
        <select value={selectedExerciseId || ""} onChange={(event) => onSelectExercise(event.target.value)}>
          {exercises.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>{exercise.nombre}</option>
          ))}
        </select>
      </header>

      <EvolutionChart rows={rows} copy={copy} />
    </article>
  )
}

function EvolutionChart({ rows = [], copy }) {
  if (rows.length === 0) return <div className="student-prs-empty">{copy.noMarksForExercise}</div>

  const weights = rows.map((row) => Number(row.peso_libras || 0))
  const minWeightRaw = Math.min(...weights)
  const maxWeightRaw = Math.max(...weights)
  const paddingValue = Math.max(Math.round((maxWeightRaw - minWeightRaw) * 0.18), 10)
  const minWeight = Math.max(0, Math.floor((minWeightRaw - paddingValue) / 10) * 10)
  const maxWeight = Math.ceil((maxWeightRaw + paddingValue) / 10) * 10 || 200

  const width = 760
  const height = 310
  const leftPad = 78
  const rightPad = 34
  const topPad = 34
  const bottomPad = 72
  const usableW = width - leftPad - rightPad
  const usableH = height - topPad - bottomPad

  const weightRange = Math.max(maxWeight - minWeight, 1)

  const points = rows.map((row, index) => {
    const x = rows.length <= 1 ? leftPad + usableW / 2 : leftPad + (usableW / (rows.length - 1)) * index
    const y = topPad + usableH - ((Number(row.peso_libras || 0) - minWeight) / weightRange) * usableH

    return { x, y, row }
  })

  const line = points.map((point) => `${point.x},${point.y}`).join(" ")
  const yTicks = [minWeight, Math.round((minWeight + maxWeight) / 2), maxWeight]

  return (
    <div className="student-prs-chart is-xy-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${copy.xAxisDates} / ${copy.yAxisWeight}`}>
        <text className="student-prs-axis-title is-y" x="18" y={height / 2} textAnchor="middle">
          {copy.yAxisWeight}
        </text>

        <text className="student-prs-axis-title is-x" x={leftPad + usableW / 2} y={height - 10} textAnchor="middle">
          {copy.xAxisDates}
        </text>

        <line className="student-prs-axis-line" x1={leftPad} y1={topPad} x2={leftPad} y2={topPad + usableH} />
        <line className="student-prs-axis-line" x1={leftPad} y1={topPad + usableH} x2={leftPad + usableW} y2={topPad + usableH} />

        {yTicks.map((tick) => {
          const y = topPad + usableH - ((tick - minWeight) / weightRange) * usableH

          return (
            <g key={`y-${tick}`}>
              <line className="student-prs-axis-grid is-horizontal" x1={leftPad} y1={y} x2={leftPad + usableW} y2={y} />
              <text className="student-prs-axis-tick is-y" x={leftPad - 12} y={y + 5} textAnchor="end">
                {tick} lb
              </text>
            </g>
          )
        })}

        {points.map((point) => (
          <g key={`x-${point.row.id}`}>
            <line className="student-prs-axis-grid" x1={point.x} y1={topPad} x2={point.x} y2={topPad + usableH} />
            <text
              className="student-prs-axis-tick is-x"
              x={point.x}
              y={topPad + usableH + 25}
              textAnchor="middle"
            >
              {formatDateCompact(point.row.fecha)}
            </text>
          </g>
        ))}

        <polyline points={line} />

        {points.map((point) => (
          <g key={point.row.id}>
            <circle cx={point.x} cy={point.y} r="7" />
            <text className="student-prs-point-label" x={point.x + 10} y={point.y - 10}>
              {formatLb(point.row.peso_libras)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
