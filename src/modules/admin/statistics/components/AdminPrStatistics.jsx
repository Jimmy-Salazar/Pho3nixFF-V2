import { useEffect, useMemo, useState } from "react"
import {
  AthleteIdentity,
  AthletePicker,
  Avatar,
  StatisticsEmpty,
  StatisticsError,
  StatisticsKpis,
  StatisticsLineChart,
  StatisticsLoading,
  StatisticsPieChart,
  StatisticsSubTabs,
  formatDate,
  formatWeight,
} from "./AdminStatisticsDetailShared.jsx"
import { interpolateStatisticsCopy } from "../i18n/adminStatisticsCopy.js"

export default function AdminPrStatistics({
  copy,
  locale,
  stats,
  athletes,
  mode,
  onMode,
  selectedAthleteId,
  onSelectAthlete,
  detail,
  detailLoading,
  detailError,
  onRetryDetail,
}) {
  const subtitle = mode === "exercise"
    ? copy.prExerciseSubtitle
    : mode === "individual"
      ? copy.prDetailSubtitle
      : copy.prGeneralSubtitle

  return (
    <section className="admin-statistics-special-section admin-pr-statistics-section">
      <div className="admin-statistics-special-heading">
        <div>
          <span>{copy.prs}</span>
          <h2>{copy.prStatistics}</h2>
          <p>{subtitle}</p>
        </div>
        <StatisticsSubTabs copy={copy} mode={mode} onMode={onMode} includeExercise />
      </div>

      {mode === "general" ? (
        <PrGeneral copy={copy} locale={locale} stats={stats} />
      ) : mode === "exercise" ? (
        <PrByExercise copy={copy} locale={locale} stats={stats} />
      ) : (
        <PrIndividual
          copy={copy}
          locale={locale}
          athletes={athletes}
          selectedAthleteId={selectedAthleteId}
          onSelectAthlete={onSelectAthlete}
          detail={detail}
          stats={stats}
          loading={detailLoading}
          error={detailError}
          onRetry={onRetryDetail}
        />
      )}
    </section>
  )
}

function PrGeneral({ copy, locale, stats }) {
  const summary = stats?.summary || {}
  const distributionRows = useMemo(() => {
    const rows = stats?.topMovements || []
    const total = rows.reduce((sum, row) => sum + Number(row.value || 0), 0)
    return rows.slice(0, 6).map((row) => ({
      key: row.exerciseId,
      label: row.label,
      value: Number(row.value || 0),
      percentage: total ? (Number(row.value || 0) / total) * 100 : 0,
    }))
  }, [stats?.topMovements])

  return (
    <>
      <StatisticsKpis items={[
        { icon: "PR", label: copy.totalPeriodPrs, value: summary.total || 0, help: copy.periodLabel },
        { icon: "◎", label: copy.uniqueAthletesWithPr, value: summary.uniqueAthletes || 0, help: `${summary.coverageRate || 0}% ${copy.boxCoverage}` },
        { icon: "⌁", label: copy.uniqueExercisesWithPr, value: summary.uniqueExercises || 0, help: copy.exercise },
        { icon: "↗", label: copy.improvementRate, value: `${summary.improvementRate || 0}%`, help: `${summary.comparablePairs || 0} ${copy.comparableMarks}` },
        { icon: "M", label: copy.medianImprovement, value: `+${summary.medianImprovement || 0}%`, help: copy.robustProgressMetric },
        { icon: "1ª", label: copy.firstMarks, value: summary.firstMarks || 0, help: copy.firstMarkHelp },
      ]} />

      <div className="admin-statistics-detail-grid admin-pr-general-grid">
        <PrTrendChart copy={copy} series={stats?.trendSeries || []} />

        <StatisticsPieChart
          title={copy.prDistribution}
          subtitle={copy.prsModule}
          rows={distributionRows}
          emptyText={copy.noPrData}
          totalLabel={copy.records}
        />

        <ExerciseProgressTable copy={copy} rows={stats?.exerciseStats || []} />
        <PrAthletesTable copy={copy} locale={locale} rows={stats?.topAthletes || []} />
        <ImprovementLeaders copy={copy} locale={locale} rows={stats?.improvementLeaders || []} />
      </div>
    </>
  )
}

function PrTrendChart({ copy, series }) {
  const definitions = [
    { key: "records", label: copy.registeredMarksLine, className: "is-records" },
    { key: "athletes", label: copy.participatingAthletesLine, className: "is-athletes" },
    { key: "improvements", label: copy.improvedMarksLine, className: "is-improvements" },
    { key: "firstMarks", label: copy.firstMarksLine, className: "is-first-marks" },
  ]
  const maximum = Math.max(...series.flatMap((row) => definitions.map((definition) => Number(row?.[definition.key] || 0))), 1)
  const chartMax = niceMaximum(maximum)
  const ticks = [1, .75, .5, .25, 0].map((ratio) => ({ value: Math.round(chartMax * ratio), y: 22 + (1 - ratio) * 178 }))
  const hasData = series.some((row) => definitions.some((definition) => Number(row?.[definition.key] || 0) > 0))
  const xFor = (index) => series.length <= 1 ? 390 : 64 + (index * 660) / (series.length - 1)
  const yFor = (value) => 22 + (1 - Number(value || 0) / chartMax) * 178

  return (
    <article className="admin-statistics-detail-panel is-wide admin-pr-trend-panel">
      <header>
        <div>
          <span>{copy.prsModule}</span>
          <h3>{copy.prTrend}</h3>
          <p>{copy.prTrendSubtitle}</p>
        </div>
      </header>

      {hasData ? (
        <div className="admin-pr-multi-chart">
          <div className="admin-pr-y-title">{copy.yAxisCount}</div>
          <svg viewBox="0 0 760 238" preserveAspectRatio="none" role="img" aria-label={copy.prTrend}>
            {ticks.map((tick) => (
              <g key={tick.value}>
                <line x1="64" x2="724" y1={tick.y} y2={tick.y} className="admin-pr-chart-grid" />
                <text x="54" y={tick.y + 4} textAnchor="end" className="admin-pr-chart-y-label">{tick.value}</text>
              </g>
            ))}

            {definitions.map((definition) => {
              const points = series.map((row, index) => ({
                x: xFor(index),
                y: yFor(row?.[definition.key]),
                value: Number(row?.[definition.key] || 0),
                label: row.label,
              }))
              return (
                <g key={definition.key} className={`admin-pr-line-series ${definition.className}`}>
                  <polyline points={points.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" vectorEffect="non-scaling-stroke" />
                  {points.map((point, index) => (
                    <circle key={`${definition.key}-${index}`} cx={point.x} cy={point.y} r="5">
                      <title>{`${definition.label}: ${point.value}`}</title>
                    </circle>
                  ))}
                </g>
              )
            })}
          </svg>

          <div className="admin-pr-x-labels">
            {series.map((row, index) => <span key={`${row.label}-${index}`}>{row.label}</span>)}
          </div>

          <div className="admin-pr-chart-legend">
            {definitions.map((definition) => (
              <span key={definition.key} className={definition.className}><i />{definition.label}</span>
            ))}
          </div>
        </div>
      ) : <StatisticsEmpty text={copy.noPrData} />}
    </article>
  )
}

function ExerciseProgressTable({ copy, rows }) {
  const visibleRows = [...rows]
    .sort((a, b) => b.improvementRate - a.improvementRate || b.medianImprovement - a.medianImprovement || b.periodRecords - a.periodRecords)
    .slice(0, 12)

  return (
    <article className="admin-statistics-detail-panel is-wide admin-statistics-data-panel admin-pr-progress-table">
      <header>
        <div>
          <span>{copy.byExercise}</span>
          <h3>{copy.exercisesWithMostProgress}</h3>
          <p>{copy.exerciseProgressMethod}</p>
        </div>
      </header>
      {visibleRows.length ? (
        <div className="admin-statistics-table-scroll">
          <table className="admin-statistics-data-table">
            <thead>
              <tr>
                <th>{copy.exercise}</th>
                <th>{copy.records}</th>
                <th>{copy.athletes}</th>
                <th>{copy.comparableAthletes}</th>
                <th>{copy.improvedAthletes}</th>
                <th>{copy.improvementRate}</th>
                <th>{copy.medianImprovement}</th>
                <th>{copy.averageIncrease}</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.exerciseId}>
                  <td><strong>{row.exercise}</strong></td>
                  <td>{row.periodRecords}</td>
                  <td>{row.uniqueAthletes}</td>
                  <td>{row.comparableAthletes}</td>
                  <td>{row.improvedAthletes}</td>
                  <td className={row.improvementRate > 0 ? "is-positive" : ""}>{row.improvementRate}%</td>
                  <td className={row.medianImprovement > 0 ? "is-positive" : ""}>+{row.medianImprovement}%</td>
                  <td className={row.averageIncrease > 0 ? "is-positive" : ""}>+{formatWeight(row.averageIncrease)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <StatisticsEmpty text={copy.noImprovementData} />}
    </article>
  )
}

function PrAthletesTable({ copy, locale, rows }) {
  return (
    <article className="admin-statistics-detail-panel is-wide admin-statistics-data-panel">
      <header><div><span>{copy.prsModule}</span><h3>{copy.topPrAthletes}</h3></div></header>
      {rows.length ? (
        <div className="admin-statistics-table-scroll">
          <table className="admin-statistics-data-table">
            <thead><tr><th>#</th><th>{copy.athlete}</th><th>{copy.records}</th><th>{copy.exercise}</th><th>{copy.improvedExercises}</th><th>{copy.averageImprovement}</th><th>{copy.latestPr}</th></tr></thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.userId}>
                  <td><strong className="admin-statistics-position-inline">#{index + 1}</strong></td>
                  <td><div className="admin-statistics-table-athlete"><Avatar athlete={{ nombre: row.nombre, fotoUrl: row.fotoUrl }} /><span><strong>{row.nombre}</strong></span></div></td>
                  <td>{row.count}</td>
                  <td>{interpolateStatisticsCopy(copy.exercisesCount, { count: row.exercises })}</td>
                  <td>{row.improvements}</td>
                  <td className={row.averageImprovement > 0 ? "is-positive" : ""}>{row.averageImprovement ? `+${row.averageImprovement}%` : "—"}</td>
                  <td>{row.latest ? formatDate(row.latest, locale) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <StatisticsEmpty text={copy.noPrData} />}
    </article>
  )
}

function ImprovementLeaders({ copy, locale, rows }) {
  return (
    <article className="admin-statistics-detail-panel is-wide admin-statistics-data-panel">
      <header><div><span>{copy.improvement}</span><h3>{copy.improvementLeaders}</h3></div></header>
      {rows.length ? (
        <div className="admin-statistics-table-scroll">
          <table className="admin-statistics-data-table">
            <thead><tr><th>{copy.athlete}</th><th>{copy.exercise}</th><th>{copy.previousMark}</th><th>{copy.currentMark}</th><th>{copy.difference}</th><th>{copy.improvement}</th><th>{copy.date}</th></tr></thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.userId}-${row.exerciseId}-${index}`}>
                  <td><div className="admin-statistics-table-athlete"><Avatar athlete={{ nombre: row.nombre, fotoUrl: row.fotoUrl }} /><span><strong>{row.nombre}</strong></span></div></td>
                  <td>{row.exercise}</td>
                  <td>{formatWeight(row.previous)}</td>
                  <td><strong>{formatWeight(row.current)}</strong></td>
                  <td className="is-positive">+{formatWeight(row.difference)}</td>
                  <td className="is-positive">+{row.percent}%</td>
                  <td>{formatDate(row.date, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <StatisticsEmpty text={copy.noImprovementData} />}
    </article>
  )
}

function PrByExercise({ copy, locale, stats }) {
  const rows = stats?.exerciseStats || []
  const [selectedExerciseId, setSelectedExerciseId] = useState("")

  useEffect(() => {
    if (!rows.some((row) => String(row.exerciseId) === String(selectedExerciseId))) {
      setSelectedExerciseId(rows[0]?.exerciseId || "")
    }
  }, [rows, selectedExerciseId])

  const selected = rows.find((row) => String(row.exerciseId) === String(selectedExerciseId)) || rows[0] || null

  if (!selected) return <StatisticsEmpty text={copy.noPrData} />

  return (
    <>
      <label className="admin-statistics-athlete-picker admin-pr-exercise-picker">
        <span>{copy.selectExercise}</span>
        <select value={selected.exerciseId} onChange={(event) => setSelectedExerciseId(event.target.value)}>
          {rows.map((row) => <option key={row.exerciseId} value={row.exerciseId}>{row.exercise}</option>)}
        </select>
      </label>

      <StatisticsKpis items={[
        { icon: "PR", label: copy.totalPeriodPrs, value: selected.periodRecords, help: `${selected.totalRecords} ${copy.historicalRecords}` },
        { icon: "◎", label: copy.athletesWithMarks, value: selected.uniqueAthletes, help: copy.periodLabel },
        { icon: "⇄", label: copy.comparableAthletes, value: selected.comparableAthletes, help: copy.twoOrMoreMarks },
        { icon: "↗", label: copy.improvementRate, value: `${selected.improvementRate}%`, help: `${selected.improvedAthletes} ${copy.improvedAthletes.toLowerCase()}` },
        { icon: "M", label: copy.medianImprovement, value: `+${selected.medianImprovement}%`, help: copy.robustProgressMetric },
        { icon: "LB", label: copy.averageIncrease, value: `+${formatWeight(selected.averageIncrease)}`, help: copy.improvedMarksOnly },
      ]} />

      <div className="admin-statistics-detail-grid admin-pr-exercise-grid">
        <PrCollectiveIndexChart copy={copy} series={selected.collectiveSeries || []} exercise={selected.exercise} />
        <ExerciseRankingTable copy={copy} locale={locale} rows={selected.ranking || []} />
        <RecentExerciseMarks copy={copy} locale={locale} rows={selected.recentMarks || []} exercise={selected.exercise} />
      </div>
    </>
  )
}

function PrCollectiveIndexChart({ copy, series, exercise }) {
  const valid = series.filter((row) => Number(row.value || 0) > 0)
  const values = valid.map((row) => Number(row.value || 0))
  const first = values[0] || 0
  const last = values.at(-1) || 0
  const change = first ? Math.round((last - first) * 10) / 10 : 0
  const minValue = values.length ? Math.max(0, Math.floor((Math.min(...values, 100) - 5) / 5) * 5) : 0
  const maxValue = values.length ? Math.ceil((Math.max(...values, 100) + 5) / 5) * 5 : 100
  const span = Math.max(maxValue - minValue, 1)
  const ticks = [1, .75, .5, .25, 0].map((ratio) => ({ value: Math.round((minValue + span * ratio) * 10) / 10, y: 22 + (1 - ratio) * 178 }))
  const xFor = (index) => series.length <= 1 ? 390 : 64 + (index * 660) / (series.length - 1)
  const yFor = (value) => 22 + (1 - (Number(value || 0) - minValue) / span) * 178
  const points = series.map((row, index) => ({ ...row, x: xFor(index), y: yFor(row.value) }))

  return (
    <article className="admin-statistics-detail-panel is-wide admin-pr-collective-panel">
      <header>
        <div>
          <span>{copy.collectivePrIndex}</span>
          <h3>{copy.collectiveEvolution}: {exercise}</h3>
          <p>{copy.collectiveEvolutionMethod}</p>
        </div>
        {valid.length ? (
          <div className={`admin-pr-index-change ${change > 0 ? "is-up" : change < 0 ? "is-down" : "is-stable"}`}>
            <small>{copy.periodEvolution}</small>
            <strong>{change > 0 ? "+" : ""}{change} pts</strong>
          </div>
        ) : null}
      </header>

      {valid.length ? (
        <div className="admin-pr-index-layout">
          <div className="admin-pr-index-summary">
            <div><span>{copy.initialIndex}</span><strong>{first}</strong></div>
            <div><span>{copy.currentIndex}</span><strong>{last}</strong></div>
            <div><span>{copy.athletesEvaluated}</span><strong>{valid.at(-1)?.athletes || 0}</strong></div>
          </div>

          <div className="admin-pr-index-chart">
            <svg viewBox="0 0 760 238" preserveAspectRatio="none" role="img" aria-label={`${copy.collectiveEvolution}: ${exercise}`}>
              {ticks.map((tick) => (
                <g key={tick.value}>
                  <line x1="64" x2="724" y1={tick.y} y2={tick.y} className="admin-pr-chart-grid" />
                  <text x="54" y={tick.y + 4} textAnchor="end" className="admin-pr-chart-y-label">{tick.value}</text>
                </g>
              ))}
              <line x1="64" x2="724" y1={yFor(100)} y2={yFor(100)} className="admin-pr-baseline" />
              <polyline points={points.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" className="admin-pr-index-line" vectorEffect="non-scaling-stroke" />
              {points.map((point, index) => (
                <circle key={`${point.label}-${index}`} cx={point.x} cy={point.y} r="6" className="admin-pr-index-point">
                  <title>{`${point.label}: ${point.value} · ${point.athletes} ${copy.athletes.toLowerCase()}`}</title>
                </circle>
              ))}
            </svg>
            <div className="admin-pr-x-labels">{series.map((row, index) => <span key={`${row.label}-${index}`}>{row.label}</span>)}</div>
          </div>
        </div>
      ) : <StatisticsEmpty text={copy.noCollectivePrData} />}
    </article>
  )
}

function ExerciseRankingTable({ copy, locale, rows }) {
  const [gender, setGender] = useState("all")
  const filtered = rows.filter((row) => gender === "all" || row.sexo === gender)

  return (
    <article className="admin-statistics-detail-panel is-wide admin-statistics-data-panel admin-pr-ranking-panel">
      <header>
        <div><span>{copy.ranking}</span><h3>{copy.exerciseRanking}</h3></div>
        <div className="admin-pr-gender-filters">
          <button type="button" className={gender === "all" ? "is-active" : ""} onClick={() => setGender("all")}>{copy.allGender}</button>
          <button type="button" className={gender === "male" ? "is-active" : ""} onClick={() => setGender("male")}>{copy.male}</button>
          <button type="button" className={gender === "female" ? "is-active" : ""} onClick={() => setGender("female")}>{copy.female}</button>
        </div>
      </header>
      {filtered.length ? (
        <div className="admin-statistics-table-scroll">
          <table className="admin-statistics-data-table">
            <thead><tr><th>#</th><th>{copy.athlete}</th><th>{copy.gender}</th><th>{copy.bestMark}</th><th>{copy.latestMark}</th><th>{copy.previousMark}</th><th>{copy.improvement}</th><th>{copy.records}</th><th>{copy.date}</th></tr></thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.userId}>
                  <td><strong className="admin-statistics-position-inline">#{row.position}</strong></td>
                  <td><div className="admin-statistics-table-athlete"><Avatar athlete={{ nombre: row.nombre, fotoUrl: row.fotoUrl }} /><span><strong>{row.nombre}</strong></span></div></td>
                  <td>{genderLabel(copy, row.sexo)}</td>
                  <td><strong className="is-orange-text">{formatWeight(row.bestWeight)}</strong></td>
                  <td>{formatWeight(row.currentWeight)}</td>
                  <td>{row.previousWeight ? formatWeight(row.previousWeight) : "—"}</td>
                  <td className={row.difference > 0 ? "is-positive" : row.difference < 0 ? "is-negative" : ""}>{formatSignedChange(row)}</td>
                  <td>{row.records}</td>
                  <td>{formatDate(row.date, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <StatisticsEmpty text={copy.noPrData} />}
    </article>
  )
}

function RecentExerciseMarks({ copy, locale, rows, exercise }) {
  return (
    <article className="admin-statistics-detail-panel is-wide admin-statistics-data-panel">
      <header><div><span>{copy.periodLabel}</span><h3>{copy.recentMarks}: {exercise}</h3></div></header>
      {rows.length ? (
        <div className="admin-statistics-table-scroll">
          <table className="admin-statistics-data-table">
            <thead><tr><th>{copy.date}</th><th>{copy.athlete}</th><th>{copy.mark}</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{formatDate(row.date, locale)}</td>
                  <td><div className="admin-statistics-table-athlete"><Avatar athlete={{ nombre: row.nombre, fotoUrl: row.fotoUrl }} /><span><strong>{row.nombre}</strong></span></div></td>
                  <td><strong className="is-orange-text">{formatWeight(row.weight)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <StatisticsEmpty text={copy.noPrData} />}
    </article>
  )
}

function PrIndividual({ copy, locale, athletes, selectedAthleteId, onSelectAthlete, detail, stats, loading, error, onRetry }) {
  const [selectedExerciseId, setSelectedExerciseId] = useState("")

  useEffect(() => {
    const first = detail?.prExercises?.[0]?.exerciseId || ""
    if (!detail?.prExercises?.some((row) => String(row.exerciseId) === String(selectedExerciseId))) {
      setSelectedExerciseId(first)
    }
  }, [detail?.athlete?.id, detail?.prExercises, selectedExerciseId])

  const selectedExercise = useMemo(() => {
    return detail?.prExercises?.find((row) => String(row.exerciseId) === String(selectedExerciseId)) || detail?.prExercises?.[0] || null
  }, [detail?.prExercises, selectedExerciseId])

  const evolutionSeries = useMemo(() => {
    return (selectedExercise?.history || []).map((row) => ({ label: formatDate(row.date, locale).replace(/\s\d{4}/, ""), value: row.weight }))
  }, [locale, selectedExercise])

  const rankMap = useMemo(() => {
    const map = new Map()
    ;(stats?.exerciseStats || []).forEach((exercise) => {
      const row = (exercise.ranking || []).find((rankingRow) => String(rankingRow.userId) === String(selectedAthleteId))
      if (row) map.set(String(exercise.exerciseId), row.position)
    })
    return map
  }, [selectedAthleteId, stats?.exerciseStats])

  const personalSummary = useMemo(() => {
    const improved = (detail?.prExercises || []).filter((row) => row.improvement)
    const average = improved.length
      ? Math.round((improved.reduce((sum, row) => sum + Number(row.improvement.percent || 0), 0) / improved.length) * 10) / 10
      : 0
    const ranks = Array.from(rankMap.values()).filter(Number.isFinite)
    return {
      improvedExercises: improved.length,
      averageImprovement: average,
      bestRank: ranks.length ? Math.min(...ranks) : null,
    }
  }, [detail?.prExercises, rankMap])

  return (
    <>
      <AthletePicker copy={copy} athletes={athletes} value={selectedAthleteId} onChange={onSelectAthlete} />
      {loading ? <StatisticsLoading copy={copy} /> : error ? <StatisticsError copy={copy} message={error} onRetry={onRetry} /> : detail?.athlete ? (
        <>
          <AthleteIdentity athlete={detail.athlete} copy={copy} membershipStatus={detail.membershipStatus} membership={detail.membership} />
          <StatisticsKpis items={[
            { icon: "PR", label: copy.totalPrs, value: detail.prSummary.total, help: `${detail.prSummary.period} ${copy.periodPrs}` },
            { icon: "⌁", label: copy.exercisesWithMarks, value: detail.prSummary.exercises, help: copy.exercise },
            { icon: "↗", label: copy.improvedExercises, value: personalSummary.improvedExercises, help: copy.currentVsPrevious },
            { icon: "%", label: copy.averageImprovement, value: personalSummary.averageImprovement ? `+${personalSummary.averageImprovement}%` : "—", help: copy.improvedMarksOnly },
            { icon: "#", label: copy.bestRanking, value: personalSummary.bestRank ? `#${personalSummary.bestRank}` : "—", help: copy.exerciseRanking },
            { icon: "◷", label: copy.latestPr, value: detail.prSummary.latest ? formatWeight(detail.prSummary.latest.weight) : "—", help: detail.prSummary.latest ? formatDate(detail.prSummary.latest.date, locale) : copy.noPrHistory },
          ]} />

          <div className="admin-statistics-detail-grid admin-pr-individual-grid">
            <BestMarksTable copy={copy} locale={locale} rows={detail.prExercises || []} rankMap={rankMap} />
            <section className="admin-statistics-exercise-evolution is-wide">
              <label>
                <span>{copy.selectExercise}</span>
                <select value={selectedExercise?.exerciseId || ""} onChange={(event) => setSelectedExerciseId(event.target.value)}>
                  {(detail.prExercises || []).map((row) => <option key={row.exerciseId} value={row.exerciseId}>{row.exercise}</option>)}
                </select>
              </label>
              {selectedExercise ? (
                <StatisticsLineChart series={evolutionSeries} title={selectedExercise.exercise} subtitle={`${selectedExercise.records} ${copy.records}`} emptyText={copy.noExerciseHistory} />
              ) : <StatisticsEmpty text={copy.noExerciseHistory} />}
            </section>
            <PrHistoryTable copy={copy} locale={locale} rows={detail.prHistory || []} />
          </div>
        </>
      ) : <StatisticsEmpty text={copy.noAthletes} />}
    </>
  )
}

function BestMarksTable({ copy, locale, rows, rankMap }) {
  return (
    <article className="admin-statistics-detail-panel is-wide admin-statistics-data-panel">
      <header><div><span>{copy.athletePrOverview}</span><h3>{copy.bestMarksByExercise}</h3></div></header>
      {rows.length ? (
        <div className="admin-statistics-table-scroll">
          <table className="admin-statistics-data-table">
            <thead><tr><th>{copy.exercise}</th><th>{copy.latestMark}</th><th>{copy.previousMark}</th><th>{copy.bestMark}</th><th>{copy.improvement}</th><th>{copy.ranking}</th><th>{copy.records}</th><th>{copy.date}</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.exerciseId}>
                  <td><strong>{row.exercise}</strong></td>
                  <td>{row.latest ? formatWeight(row.latest.weight) : "—"}</td>
                  <td>{row.previous ? formatWeight(row.previous.weight) : "—"}</td>
                  <td><strong className="is-orange-text">{row.best ? formatWeight(row.best.weight) : "—"}</strong></td>
                  <td className={row.improvement ? "is-positive" : ""}>{row.improvement ? `+${row.improvement.difference} lb · +${row.improvement.percent}%` : "—"}</td>
                  <td>{rankMap.get(String(row.exerciseId)) ? `#${rankMap.get(String(row.exerciseId))}` : "—"}</td>
                  <td>{row.records}</td>
                  <td>{row.latest ? formatDate(row.latest.date, locale) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <StatisticsEmpty text={copy.noPrHistory} />}
    </article>
  )
}

function PrHistoryTable({ copy, locale, rows }) {
  return (
    <article className="admin-statistics-detail-panel is-wide admin-statistics-data-panel">
      <header><div><span>{copy.records}</span><h3>{copy.completePrHistory}</h3></div></header>
      {rows.length ? (
        <div className="admin-statistics-table-scroll">
          <table className="admin-statistics-data-table">
            <thead><tr><th>{copy.date}</th><th>{copy.exercise}</th><th>{copy.weight}</th></tr></thead>
            <tbody>{rows.slice(0, 50).map((row) => <tr key={row.id}><td>{formatDate(row.date, locale)}</td><td>{row.exercise}</td><td><strong className="is-orange-text">{formatWeight(row.weight)}</strong></td></tr>)}</tbody>
          </table>
        </div>
      ) : <StatisticsEmpty text={copy.noPrHistory} />}
    </article>
  )
}

function formatSignedChange(row) {
  if (!row.previousWeight) return "—"
  if (!row.difference) return "0 lb · 0%"
  const sign = row.difference > 0 ? "+" : ""
  return `${sign}${row.difference} lb · ${sign}${row.percent}%`
}

function genderLabel(copy, gender) {
  if (gender === "male") return copy.male
  if (gender === "female") return copy.female
  return copy.unspecified
}

function niceMaximum(value) {
  const safe = Math.max(Number(value || 0), 1)
  const magnitude = 10 ** Math.floor(Math.log10(safe))
  const normalized = safe / magnitude
  const rounded = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return rounded * magnitude
}
