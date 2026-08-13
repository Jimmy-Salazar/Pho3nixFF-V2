import { useEffect, useMemo, useState } from "react"

import {
  Avatar,
  StatisticsEmpty,
  StatisticsKpis,
  StatisticsPieChart,
  formatDate,
} from "./AdminStatisticsDetailShared.jsx"
import { formatPercent } from "../utils/adminStatisticsUtils.js"

export default function AdminWodStatistics({ copy, locale, stats }) {
  const wods = stats?.wods || []
  const [selectedWodId, setSelectedWodId] = useState("")

  useEffect(() => {
    if (!wods.length) {
      setSelectedWodId("")
      return
    }

    const exists = wods.some((wod) => String(wod.id) === String(selectedWodId))
    if (!exists) setSelectedWodId(String(wods[0].id))
  }, [selectedWodId, wods])

  const selectedWod = useMemo(() => {
    return wods.find((wod) => String(wod.id) === String(selectedWodId)) || wods[0] || null
  }, [selectedWodId, wods])

  const categoryRows = (stats?.categorySeries || []).map((row) => ({
    ...row,
    label: categoryLabel(copy, row.key),
  }))

  const performanceCategories = (stats?.groupPerformanceSeries || []).map((row) => ({
    ...row,
    label: categoryLabel(copy, row.key),
  }))

  return (
    <section className="admin-statistics-special-section admin-wod-statistics-section">
      <div className="admin-statistics-special-heading">
        <div>
          <span>{copy.wods}</span>
          <h2>{copy.wodStatistics}</h2>
          <p>{copy.wodStatisticsSubtitle}</p>
        </div>
      </div>

      <StatisticsKpis
        items={[
          { icon: "W", label: copy.totalWodsPeriod, value: stats?.summary?.totalWods || 0, help: copy.periodLabel },
          { icon: "◎", label: copy.wodResultsRegistered, value: stats?.summary?.totalResults || 0, help: copy.periodLabel },
          { icon: "A", label: copy.wodAthletesParticipating, value: stats?.summary?.uniqueAthletes || 0, help: copy.athletes },
          { icon: "%", label: copy.averageWodParticipation, value: formatPercent(stats?.summary?.averageParticipation || 0), help: copy.periodLabel },
        ]}
      />

      <WodSelector
        copy={copy}
        locale={locale}
        wods={wods}
        value={selectedWod?.id || ""}
        onChange={setSelectedWodId}
        selectedWod={selectedWod}
      />

      <div className="admin-statistics-detail-grid admin-wod-statistics-grid">
        <WodRankingTable copy={copy} locale={locale} wod={selectedWod} />

        <StatisticsPieChart
          title={copy.wodTypeDistribution}
          subtitle={copy.wodTypeDistributionSubtitle}
          rows={categoryRows}
          emptyText={copy.noWodTypeData}
          totalLabel={copy.wods}
        />

        <WodGroupPerformanceChart
          copy={copy}
          locale={locale}
          categories={performanceCategories}
        />
      </div>
    </section>
  )
}

function WodSelector({ copy, locale, wods, value, onChange, selectedWod }) {
  return (
    <article className="admin-wod-statistics-selector">
      <label>
        <span>{copy.selectWod}</span>
        <select value={value} onChange={(event) => onChange(event.target.value)} disabled={!wods.length}>
          {wods.length ? (
            wods.map((wod) => (
              <option key={wod.id} value={wod.id}>
                {formatDate(wod.date, locale)} · {wod.name}
              </option>
            ))
          ) : (
            <option value="">{copy.noWodsInPeriod}</option>
          )}
        </select>
      </label>

      {selectedWod ? (
        <div className="admin-wod-statistics-meta">
          <div>
            <small>{copy.wodType}</small>
            <strong>{categoryLabel(copy, selectedWod.category)}</strong>
          </div>
          <div>
            <small>{copy.rankingMode}</small>
            <strong>{rankingModeLabel(copy, selectedWod.rankingMode)}</strong>
          </div>
          <div>
            <small>{copy.participants}</small>
            <strong>{selectedWod.participantCount || 0}</strong>
          </div>
          <div>
            <small>{copy.participation}</small>
            <strong>{formatPercent(selectedWod.participationRate || 0)}</strong>
          </div>
        </div>
      ) : null}
    </article>
  )
}

function WodRankingTable({ copy, locale, wod }) {
  const rows = wod?.ranking || []
  const hasRanking = wod?.rankingMode !== "sin_ranking"

  return (
    <article className="admin-statistics-detail-panel is-wide admin-statistics-data-panel admin-wod-ranking-panel">
      <header>
        <div>
          <span>{copy.wodRanking}</span>
          <h3>{wod ? wod.name : copy.selectWod}</h3>
          <p>{wod ? `${formatDate(wod.date, locale)} · ${categoryLabel(copy, wod.category)}` : copy.noWodsInPeriod}</p>
        </div>
        {wod ? <strong className="admin-statistics-badge is-success">{wod.participantCount || 0} {copy.participants.toLowerCase()}</strong> : null}
      </header>

      {wod && rows.length ? (
        <div className="admin-statistics-table-scroll">
          <table className="admin-statistics-data-table admin-wod-ranking-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{copy.athlete}</th>
                <th>{copy.gender}</th>
                <th>{copy.modality}</th>
                <th>{copy.mark}</th>
                <th>{copy.calories}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id || `${row.userId}-${index}`}>
                  <td>
                    <strong className="admin-statistics-position-inline">
                      {hasRanking && row.position ? `#${row.position}` : "—"}
                    </strong>
                  </td>
                  <td>
                    <div className="admin-statistics-table-athlete">
                      <Avatar athlete={{ nombre: row.name, fotoUrl: row.photoUrl }} />
                      <span><strong>{row.name}</strong></span>
                    </div>
                  </td>
                  <td>{genderLabel(copy, row.gender)}</td>
                  <td>{row.modality || "—"}</td>
                  <td><strong className="is-orange-text">{row.mark}</strong></td>
                  <td>{Number(row.calories || 0) > 0 ? `${Number(row.calories)} kcal` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <StatisticsEmpty text={wod ? copy.noWodRankingData : copy.noWodsInPeriod} />
      )}

      {wod?.rankingMode === "sin_ranking" && rows.length ? (
        <p className="admin-wod-ranking-note">{copy.noRankingWodNotice}</p>
      ) : null}
    </article>
  )
}

function WodGroupPerformanceChart({ copy, locale, categories }) {
  const availableCategories = useMemo(
    () => categories.filter((category) => Array.isArray(category.series) && category.series.length > 0),
    [categories]
  )
  const availableKey = availableCategories.map((category) => category.key).join("|")
  const [selectedCategory, setSelectedCategory] = useState("")

  useEffect(() => {
    if (!availableCategories.length) {
      setSelectedCategory("")
      return
    }

    const exists = availableCategories.some((category) => category.key === selectedCategory)
    if (!exists) setSelectedCategory(availableCategories[0].key)
  }, [availableKey, availableCategories, selectedCategory])

  const category = availableCategories.find((item) => item.key === selectedCategory) || availableCategories[0] || null
  const rows = category?.series || []
  const hasEvolution = rows.length > 1
  const chartWidth = Math.max(760, rows.length * 132)
  const chartHeight = 292
  const plot = { left: 62, right: 24, top: 25, bottom: 82 }
  const plotWidth = chartWidth - plot.left - plot.right
  const plotHeight = chartHeight - plot.top - plot.bottom
  const xFor = (index) => rows.length <= 1
    ? plot.left + plotWidth / 2
    : plot.left + (index * plotWidth) / (rows.length - 1)
  const yFor = (score) => plot.top + ((100 - Number(score || 0)) / 100) * plotHeight
  const points = rows.map((row, index) => ({ ...row, x: xFor(index), y: yFor(row.score) }))
  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ")
  const areaPath = points.length
    ? `M ${points.map((point) => `${point.x} ${point.y}`).join(" L ")} L ${points.at(-1).x} ${plot.top + plotHeight} L ${points[0].x} ${plot.top + plotHeight} Z`
    : ""
  const ticks = [100, 75, 50, 25, 0]

  return (
    <article className="admin-statistics-detail-panel is-wide admin-wod-group-performance-panel">
      <header>
        <div>
          <span>{copy.performanceEvolution}</span>
          <h3>{copy.wodGroupPerformanceTitle}</h3>
          <p>{copy.wodGroupPerformanceSubtitle}</p>
        </div>

        <label className="admin-wod-group-category-picker">
          <span>{copy.selectWodCategory}</span>
          <select
            value={category?.key || ""}
            onChange={(event) => setSelectedCategory(event.target.value)}
            disabled={!availableCategories.length}
          >
            {availableCategories.length ? availableCategories.map((item) => (
              <option key={item.key} value={item.key}>{item.label}</option>
            )) : <option value="">{copy.noGroupPerformanceData}</option>}
          </select>
        </label>
      </header>

      {category && rows.length ? (
        <>
          <div className="admin-wod-group-performance-summary">
            <PerformanceSummaryCard
              label={copy.firstWodPerformance}
              value={`${formatDecimal(category.firstScore)}%`}
              help={rows[0]?.name || "—"}
            />
            <PerformanceSummaryCard
              label={copy.latestWodPerformance}
              value={`${formatDecimal(category.latestScore)}%`}
              help={rows.at(-1)?.name || "—"}
            />
            <PerformanceSummaryCard
              label={copy.evolutionPoints}
              value={hasEvolution ? `${formatSigned(category.deltaPoints)} ${copy.percentagePointsShort}` : "—"}
              help={hasEvolution
                ? `${trendLabel(copy, category.trend)} · ${copy.relativeVariation}: ${formatSigned(category.relativeChange)}%`
                : copy.singleWodNoTrend}
              tone={hasEvolution ? category.trend : "stable"}
            />
            <PerformanceSummaryCard
              label={copy.averagePerformance}
              value={`${formatDecimal(category.averageScore)}%`}
              help={`${category.wodCount} ${copy.wods.toLowerCase()}`}
            />
          </div>

          <div className="admin-wod-group-performance-chart-scroll">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              width={chartWidth}
              height={chartHeight}
              role="img"
              aria-label={`${copy.wodGroupPerformanceTitle}: ${category.label}`}
            >
              <defs>
                <linearGradient id="admin-wod-group-performance-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--admin-primary)" stopOpacity=".28" />
                  <stop offset="100%" stopColor="var(--admin-primary)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {ticks.map((tick) => {
                const y = yFor(tick)
                return (
                  <g key={tick}>
                    <line x1={plot.left} x2={chartWidth - plot.right} y1={y} y2={y} className="admin-wod-group-grid-line" />
                    <text x={plot.left - 12} y={y + 5} textAnchor="end" className="admin-wod-group-y-label">{tick}%</text>
                  </g>
                )
              })}

              {areaPath ? <path d={areaPath} fill="url(#admin-wod-group-performance-area)" /> : null}
              {points.length > 1 ? <polyline points={linePoints} className="admin-wod-group-performance-line" /> : null}

              {points.map((point, index) => (
                <g key={point.id || `${point.name}-${index}`}>
                  <line x1={point.x} x2={point.x} y1={point.y} y2={plot.top + plotHeight} className="admin-wod-group-point-guide" />
                  <circle cx={point.x} cy={point.y} r="7" className="admin-wod-group-performance-point">
                    <title>{performanceTooltip(copy, locale, point)}</title>
                  </circle>
                  <text x={point.x} y={point.y - 13} textAnchor="middle" className="admin-wod-group-point-value">
                    {formatDecimal(point.score)}%
                  </text>
                  <text x={point.x} y={plot.top + plotHeight + 28} textAnchor="middle" className="admin-wod-group-point-name">
                    {truncateLabel(point.name, 17)}
                  </text>
                  <text x={point.x} y={plot.top + plotHeight + 48} textAnchor="middle" className="admin-wod-group-point-date">
                    {formatDate(point.date, locale)}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="admin-wod-group-performance-points">
            {rows.map((row) => (
              <article key={row.id}>
                <div>
                  <span>{formatDate(row.date, locale)}</span>
                  <strong>{row.name}</strong>
                </div>
                <b>{formatDecimal(row.score)}%</b>
                <small>{row.validResultCount} {copy.validResults.toLowerCase()} · {copy.averageMark}: {row.averageMark}</small>
                {row.metricKind === "time" ? (
                  <small>{copy.completionRate}: {formatPercent(row.completionRate || 0)}</small>
                ) : null}
              </article>
            ))}
          </div>
        </>
      ) : (
        <StatisticsEmpty text={copy.noGroupPerformanceData} />
      )}

      <p className="admin-wod-group-performance-note">{copy.groupPerformanceMethod}</p>
    </article>
  )
}

function PerformanceSummaryCard({ label, value, help, tone = "stable" }) {
  return (
    <article className={`is-${tone}`}>
      <small>{label}</small>
      <strong>{value}</strong>
      <p>{help}</p>
    </article>
  )
}

function performanceTooltip(copy, locale, point) {
  const parts = [
    point.name,
    formatDate(point.date, locale),
    `${copy.groupPerformanceIndex}: ${formatDecimal(point.score)}%`,
    `${copy.validResults}: ${point.validResultCount}`,
    `${copy.averageMark}: ${point.averageMark}`,
  ]

  if (point.metricKind === "time") {
    parts.push(`${copy.completionRate}: ${formatPercent(point.completionRate || 0)}`)
  }

  return parts.join(" · ")
}

function formatDecimal(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })
}

function formatSigned(value) {
  const number = Number(value || 0)
  const prefix = number > 0 ? "+" : ""
  return `${prefix}${formatDecimal(number)}`
}

function truncateLabel(value, maxLength) {
  const label = String(value || "WOD")
  return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label
}

function trendLabel(copy, trend) {
  if (trend === "up") return copy.groupPerformanceUp
  if (trend === "down") return copy.groupPerformanceDown
  return copy.groupPerformanceStable
}

function categoryLabel(copy, key) {
  const labels = {
    strength: copy.wodCategoryStrength,
    weightlifting: copy.wodCategoryWeightlifting,
    gymnastics: copy.wodCategoryGymnastics,
    cardio: copy.wodCategoryCardio,
    mixed: copy.wodCategoryMixed,
    metcon: copy.wodCategoryMetcon,
    other: copy.wodCategoryOther,
  }

  return labels[key] || labels.other
}

function rankingModeLabel(copy, mode) {
  if (mode === "menor_es_mejor") return copy.lowerIsBetter
  if (mode === "mayor_es_mejor") return copy.higherIsBetter
  return copy.noRanking
}

function genderLabel(copy, value) {
  const gender = String(value || "").toLowerCase()
  if (["m", "masculino", "male", "hombre"].includes(gender)) return copy.male
  if (["f", "femenino", "female", "mujer"].includes(gender)) return copy.female
  return copy.unspecified
}
