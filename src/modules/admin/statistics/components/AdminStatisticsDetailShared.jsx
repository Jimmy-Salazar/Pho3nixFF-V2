import { useState } from "react"
import { buildLinePoints } from "../utils/adminStatisticsUtils.js"

export function StatisticsSubTabs({ copy, mode, onMode, includeExercise = false }) {
  return (
    <div className="admin-statistics-subtabs" role="tablist">
      <button type="button" className={mode === "general" ? "is-active" : ""} onClick={() => onMode("general")}>{copy.general}</button>
      {includeExercise ? (
        <button type="button" className={mode === "exercise" ? "is-active" : ""} onClick={() => onMode("exercise")}>{copy.byExercise}</button>
      ) : null}
      <button type="button" className={mode === "individual" ? "is-active" : ""} onClick={() => onMode("individual")}>{copy.byAthlete}</button>
    </div>
  )
}

export function AthletePicker({ copy, athletes, value, onChange }) {
  return (
    <label className="admin-statistics-athlete-picker">
      <span>{copy.selectAthlete}</span>
      <select value={value || ""} onChange={(event) => onChange(event.target.value)}>
        {athletes.length ? null : <option value="">{copy.noAthletes}</option>}
        {athletes.map((athlete) => (
          <option key={athlete.id} value={athlete.id}>{athlete.nombre}{athlete.email ? ` · ${athlete.email}` : ""}</option>
        ))}
      </select>
    </label>
  )
}

export function StatisticsKpis({ items = [] }) {
  return (
    <section className="admin-statistics-detail-kpis">
      {items.map((item) => (
        <article key={item.label} className={item.tone ? `is-${item.tone}` : ""}>
          <span>{item.icon || "•"}</span>
          <div><small>{item.label}</small><strong>{item.value}</strong>{item.help ? <p>{item.help}</p> : null}</div>
        </article>
      ))}
    </section>
  )
}

export function StatisticsLineChart({ series = [], title, subtitle, emptyText }) {
  const points = buildLinePoints(series)
  const pointText = points.map((point) => `${point.x},${point.y}`).join(" ")
  const areaPath = points.length
    ? `M ${points.map((point) => `${point.x} ${point.y}`).join(" L ")} L 702 210 L 18 210 Z`
    : ""
  const hasData = series.some((item) => Number(item.value ?? item.total ?? 0) > 0)

  return (
    <article className="admin-statistics-detail-panel is-wide">
      <header><div><span>{subtitle}</span><h3>{title}</h3></div></header>
      {hasData ? (
        <div className="admin-statistics-detail-line-chart">
          <div className="admin-statistics-grid-lines" aria-hidden="true"><i /><i /><i /><i /><i /></div>
          <svg viewBox="0 0 720 230" preserveAspectRatio="none" role="img" aria-label={title}>
            <defs>
              <linearGradient id={`statistics-detail-${safeId(title)}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--admin-primary)" stopOpacity=".34" />
                <stop offset="100%" stopColor="var(--admin-primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {areaPath ? <path d={areaPath} fill={`url(#statistics-detail-${safeId(title)})`} /> : null}
            {pointText ? <polyline points={pointText} fill="none" stroke="var(--admin-primary)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /> : null}
            {points.map((point, index) => <circle key={`${point.label}-${index}`} cx={point.x} cy={point.y} r="6" fill="var(--admin-surface)" stroke="var(--admin-primary)" strokeWidth="4" />)}
          </svg>
          <div className="admin-statistics-x-labels">{series.map((item, index) => <span key={`${item.label}-${index}`}>{item.label}</span>)}</div>
        </div>
      ) : <StatisticsEmpty text={emptyText} />}
    </article>
  )
}


export function StatisticsMultiLineChart({
  series = [],
  title,
  subtitle,
  emptyText,
  copy,
}) {
  const [mode, setMode] = useState("count")
  const isPercentage = mode === "percentage"
  const definitions = [
    {
      key: isPercentage ? "registeredPercent" : "registered",
      label: copy.registeredAthletesLine,
      className: "is-registered",
    },
    {
      key: isPercentage ? "departedPercent" : "departed",
      label: copy.departedAthletesLine,
      className: "is-departed",
    },
    {
      key: isPercentage ? "newAthletesPercent" : "newAthletes",
      label: copy.newAthletesLine,
      className: "is-new",
    },
  ]
  const rawMax = Math.max(
    ...series.flatMap((row) => definitions.map((definition) => Number(row?.[definition.key] || 0))),
    0
  )
  const maxValue = isPercentage ? 100 : niceChartMax(rawMax)
  const yTicks = [1, .75, .5, .25, 0].map((ratio) => ({
    ratio,
    value: Math.round(maxValue * ratio),
    y: 20 + (1 - ratio) * 175,
  }))
  const hasData = series.some((row) => definitions.some((definition) => Number(row?.[definition.key] || 0) > 0))

  const xFor = (index) => {
    if (series.length <= 1) return 390
    return 62 + (index * 666) / (series.length - 1)
  }
  const yFor = (value) => 20 + (1 - Number(value || 0) / Math.max(maxValue, 1)) * 175

  return (
    <article className="admin-statistics-detail-panel is-wide">
      <header>
        <div>
          <span>{subtitle}</span>
          <h3>{title}</h3>
          <p>{isPercentage ? copy.growthPercentageHelp : copy.growthCountHelp}</p>
        </div>

        <div className="admin-statistics-chart-mode" aria-label={copy.yAxisMode}>
          <button type="button" className={!isPercentage ? "is-active" : ""} onClick={() => setMode("count")}>
            {copy.quantity}
          </button>
          <button type="button" className={isPercentage ? "is-active" : ""} onClick={() => setMode("percentage")}>
            {copy.percentage}
          </button>
        </div>
      </header>

      {hasData ? (
        <div className="admin-statistics-multi-line-chart">
          <div className="admin-statistics-y-axis-title">
            {isPercentage ? copy.yAxisPercentage : copy.yAxisCount}
          </div>

          <svg viewBox="0 0 760 230" preserveAspectRatio="none" role="img" aria-label={title}>
            {yTicks.map((tick) => (
              <g key={tick.ratio}>
                <line x1="62" x2="728" y1={tick.y} y2={tick.y} className="admin-statistics-chart-grid-line" />
                <text x="52" y={tick.y + 4} textAnchor="end" className="admin-statistics-chart-y-label">
                  {tick.value}{isPercentage ? "%" : ""}
                </text>
              </g>
            ))}

            {definitions.map((definition) => {
              const points = series.map((row, index) => ({
                x: xFor(index),
                y: yFor(row?.[definition.key]),
                label: row?.label,
                value: Number(row?.[definition.key] || 0),
              }))
              const pointText = points.map((point) => `${point.x},${point.y}`).join(" ")

              return (
                <g key={definition.key} className={`admin-statistics-chart-series ${definition.className}`}>
                  <polyline points={pointText} fill="none" vectorEffect="non-scaling-stroke" />
                  {points.map((point, index) => (
                    <circle key={`${definition.key}-${point.label}-${index}`} cx={point.x} cy={point.y} r="5">
                      <title>{`${definition.label}: ${point.value}${isPercentage ? "%" : ""}`}</title>
                    </circle>
                  ))}
                </g>
              )
            })}
          </svg>

          <div className="admin-statistics-multi-x-labels">
            {series.map((row, index) => <span key={`${row.label}-${index}`}>{row.label}</span>)}
          </div>

          <div className="admin-statistics-multi-legend">
            {definitions.map((definition) => (
              <span key={definition.key} className={definition.className}>
                <i />
                {definition.label}
              </span>
            ))}
          </div>
        </div>
      ) : <StatisticsEmpty text={emptyText} />}
    </article>
  )
}

export function StatisticsPieChart({
  title,
  subtitle,
  rows = [],
  emptyText,
  totalLabel,
}) {
  const visibleRows = rows.filter((row) => Number(row.value || 0) > 0)
  const total = visibleRows.reduce((sum, row) => sum + Number(row.value || 0), 0)
  const gradient = buildPieGradient(visibleRows, total)

  return (
    <article className="admin-statistics-detail-panel is-wide admin-statistics-nutrition-panel">
      <header>
        <div>
          <span>{subtitle}</span>
          <h3>{title}</h3>
        </div>
      </header>

      {total > 0 ? (
        <div className="admin-statistics-pie-layout">
          <div className="admin-statistics-pie" style={{ background: gradient }}>
            <div>
              <strong>{total}</strong>
              <span>{totalLabel}</span>
            </div>
          </div>

          <div className="admin-statistics-pie-legend">
            {visibleRows.map((row, index) => (
              <div key={row.key || row.label}>
                <i className={`is-slice-${index + 1}`} />
                <span>
                  <strong>{row.label}</strong>
                  <small>{row.value} · {Number(row.percentage || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}%</small>
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : <StatisticsEmpty text={emptyText} />}
    </article>
  )
}

export function StatisticsDistribution({ title, subtitle, rows = [], emptyText }) {
  const max = Math.max(...rows.map((row) => Number(row.value || 0)), 1)
  const hasData = rows.some((row) => Number(row.value || 0) > 0)

  return (
    <article className="admin-statistics-detail-panel">
      <header><div><span>{subtitle}</span><h3>{title}</h3></div></header>
      {hasData ? (
        <div className="admin-statistics-distribution-list">
          {rows.map((row) => (
            <div key={row.key || row.label}>
              <span><b>{row.label}</b><strong>{row.value}</strong></span>
              <i><em style={{ width: `${Math.max(4, (Number(row.value || 0) / max) * 100)}%` }} /></i>
            </div>
          ))}
        </div>
      ) : <StatisticsEmpty text={emptyText} />}
    </article>
  )
}

export function AthleteIdentity({ athlete, copy, membershipStatus, membership }) {
  if (!athlete) return null
  const label = membershipLabel(copy, membershipStatus?.status)
  const help = membershipStatus?.status === "expiring"
    ? copy.expiresIn.replace("{count}", String(membershipStatus.daysLeft ?? 0))
    : membership?.fecha_fin
      ? copy.validUntil.replace("{date}", formatDate(membership.fecha_fin))
      : copy.membershipMissing

  return (
    <section className="admin-statistics-athlete-identity">
      <Avatar athlete={athlete} />
      <div><span>{copy.byAthlete}</span><h2>{athlete.nombre}</h2><p>{athlete.email || "PHO3NIX"}</p></div>
      <div className={`admin-statistics-membership-state is-${membershipStatus?.status || "missing"}`}><strong>{label}</strong><small>{help}</small></div>
    </section>
  )
}

export function Avatar({ athlete, className = "" }) {
  const name = athlete?.nombre || "PHO3NIX"
  return (
    <span className={`admin-statistics-detail-avatar ${className}`.trim()}>
      {athlete?.fotoUrl || athlete?.foto_url ? <img src={athlete.fotoUrl || athlete.foto_url} alt={name} /> : initials(name)}
    </span>
  )
}

export function StatisticsLoading({ copy }) {
  return <div className="admin-statistics-detail-loading"><span>◌</span><strong>{copy.loadingDetail}</strong></div>
}

export function StatisticsError({ copy, message, onRetry }) {
  return <div className="admin-statistics-detail-error" role="alert"><strong>{copy.detailLoadError}</strong><p>{message}</p><button type="button" onClick={onRetry}>{copy.retry}</button></div>
}

export function StatisticsEmpty({ text }) {
  return <div className="admin-statistics-empty">{text}</div>
}

export function formatDate(value, locale = "es") {
  if (!value) return "—"
  const date = new Date(String(value).length === 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", { day: "2-digit", month: "short", year: "numeric" }).format(date)
}

export function formatWeight(value) {
  return `${Number(value || 0)} lb`
}

export function membershipLabel(copy, status) {
  if (status === "active") return copy.membershipActive
  if (status === "expiring") return copy.membershipExpiring
  if (status === "expired") return copy.membershipExpired
  return copy.membershipMissing
}


function niceChartMax(value) {
  const safeValue = Math.max(Number(value || 0), 1)
  const magnitude = 10 ** Math.floor(Math.log10(safeValue))
  const normalized = safeValue / magnitude
  const rounded = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return rounded * magnitude
}

function buildPieGradient(rows, total) {
  if (!total || !rows.length) return "transparent"

  let cursor = 0
  const segments = rows.map((row, index) => {
    const start = cursor
    cursor += (Number(row.value || 0) / total) * 100
    const colorIndex = (index % 5) + 1
    return `var(--statistics-goal-${colorIndex}) ${start}% ${cursor}%`
  })

  return `conic-gradient(${segments.join(", ")})`
}

function initials(name) {
  return String(name || "PH")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function safeId(value) {
  return String(value || "chart").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "chart"
}
