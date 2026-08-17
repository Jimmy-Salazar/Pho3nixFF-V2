import { buildLinePoints, formatPercent } from "../utils/adminStatisticsUtils.js"
import { interpolateStatisticsCopy } from "../i18n/adminStatisticsCopy.js"

function PanelHeader({ eyebrow, title, subtitle, action }) {
  return (
    <header className="admin-statistics-panel-header">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action || null}
    </header>
  )
}

export function ActivityPanel({ copy, series, activeAthletes, visible = true }) {
  if (!visible) return null
  const points = buildLinePoints(series)
  const pointText = points.map((point) => `${point.x},${point.y}`).join(" ")
  const areaPath = points.length
    ? `M ${points.map((point) => `${point.x} ${point.y}`).join(" L ")} L 702 210 L 18 210 Z`
    : ""
  const maxGoal = Math.max(Number(activeAthletes || 0), 1)
  const goalY = Math.max(22, 210 - 18 - (maxGoal / maxGoal) * 174)

  return (
    <article className="admin-statistics-panel admin-statistics-activity-panel">
      <PanelHeader
        eyebrow={copy.boxActivity}
        title={copy.activityTitle}
        subtitle={copy.activitySubtitle}
        action={<div className="admin-statistics-legend"><span><i className="is-orange" />{copy.activity}</span><span><i className="is-green" />{copy.activeGoal}</span></div>}
      />

      <div className="admin-statistics-line-chart">
        <div className="admin-statistics-grid-lines" aria-hidden="true"><i /><i /><i /><i /><i /></div>
        <svg viewBox="0 0 720 230" preserveAspectRatio="none" role="img" aria-label={copy.activityTitle}>
          <defs>
            <linearGradient id="admin-statistics-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--admin-primary)" stopOpacity=".34" />
              <stop offset="100%" stopColor="var(--admin-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {areaPath ? <path d={areaPath} fill="url(#admin-statistics-area-fill)" /> : null}
          {pointText ? <polyline points={pointText} fill="none" stroke="var(--admin-primary)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /> : null}
          <line x1="18" y1={goalY} x2="702" y2={goalY} stroke="#39d98a" strokeWidth="2.5" strokeDasharray="9 10" opacity=".65" />
          {points.map((point, index) => <circle key={`${point.label}-${index}`} cx={point.x} cy={point.y} r="6" fill="var(--admin-surface)" stroke="var(--admin-primary)" strokeWidth="4" />)}
        </svg>
        <div className="admin-statistics-x-labels">
          {series.map((item, index) => <span key={`${item.label}-${index}`}>{item.label}</span>)}
        </div>
      </div>
    </article>
  )
}

export function MembershipPanel({ copy, summary, visible = true }) {
  if (!visible) return null
  const total = Math.max(Number(summary.total || 0), 1)
  const activeEnd = (Number(summary.active || 0) / total) * 100
  const expiringEnd = activeEnd + (Number(summary.expiring || 0) / total) * 100
  const expiredEnd = expiringEnd + (Number(summary.expired || 0) / total) * 100
  const upcomingEnd = expiredEnd + (Number(summary.upcoming || 0) / total) * 100
  const background = `conic-gradient(#39d98a 0 ${activeEnd}%, var(--admin-primary) ${activeEnd}% ${expiringEnd}%, #ff5d68 ${expiringEnd}% ${expiredEnd}%, var(--statistics-upcoming) ${expiredEnd}% ${upcomingEnd}%, rgba(255,255,255,.12) ${upcomingEnd}% 100%)`

  return (
    <article className="admin-statistics-panel admin-statistics-membership-panel">
      <PanelHeader eyebrow={copy.membershipsModule} title={copy.currentStatus} />
      <div className="admin-statistics-donut-layout">
        <div className="admin-statistics-donut" style={{ background }}>
          <div><strong>{summary.total || 0}</strong><small>{copy.total}</small></div>
        </div>
        <div className="admin-statistics-donut-legend">
          <div><i className="is-green" /><span>{copy.active}</span><strong>{summary.active || 0}</strong></div>
          <div><i className="is-orange" /><span>{copy.expiring}</span><strong>{summary.expiring || 0}</strong></div>
          <div><i className="is-red" /><span>{copy.expired}</span><strong>{summary.expired || 0}</strong></div>
          <div><i className="is-blue" /><span>{copy.upcoming}</span><strong>{summary.upcoming || 0}</strong></div>
          <div><i className="is-muted" /><span>{copy.missing}</span><strong>{summary.missing || 0}</strong></div>
        </div>
      </div>
      <div className="admin-statistics-mini-alert">⚠ <span>{interpolateStatisticsCopy(copy.membershipAlert, { count: summary.expiring || 0 })}</span></div>
    </article>
  )
}

export function WodPanel({ copy, series, participationRate, visible = true }) {
  if (!visible) return null
  const max = Math.max(...series.map((item) => Number(item.value || 0)), 1)
  const hasData = series.some((item) => Number(item.value || 0) > 0)

  return (
    <article className="admin-statistics-panel admin-statistics-wod-panel">
      <PanelHeader
        eyebrow={copy.wodsModule}
        title={copy.participationByDay}
        subtitle={copy.resultsThisWeek}
        action={<strong className="admin-statistics-badge is-success">{formatPercent(participationRate)}</strong>}
      />
      {hasData ? (
        <div className="admin-statistics-bar-chart">
          {series.map((item) => (
            <div className="admin-statistics-bar-item" key={item.label}>
              <i><b style={{ height: `${Math.max(7, (Number(item.value || 0) / max) * 100)}%` }} /></i>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      ) : <div className="admin-statistics-empty">{copy.noWodData}</div>}
    </article>
  )
}

export function PrPanel({ copy, series, visible = true }) {
  if (!visible) return null
  const max = Math.max(...series.map((item) => Number(item.value || 0)), 1)

  return (
    <article className="admin-statistics-panel admin-statistics-pr-panel">
      <PanelHeader eyebrow={copy.prsModule} title={copy.topPrMovements} />
      {series.length ? (
        <div className="admin-statistics-rank-bars">
          {series.map((item) => (
            <div key={item.exerciseId}>
              <span><b>{item.label}</b><small>{item.value} PR</small></span>
              <i><em style={{ width: `${Math.max(5, (item.value / max) * 100)}%` }} /></i>
            </div>
          ))}
        </div>
      ) : <div className="admin-statistics-empty">{copy.noPrData}</div>}
    </article>
  )
}

export function AlertsPanel({ copy, alerts, visible = true, navigate }) {
  if (!visible) return null
  const rows = [
    {
      icon: "◴",
      tone: "warning",
      title: interpolateStatisticsCopy(copy.expiringAlertTitle, { count: alerts.expiringSoon || 0 }),
      text: copy.expiringAlertText,
      path: "/admin/mensualidades",
    },
    {
      icon: "!",
      tone: "danger",
      title: interpolateStatisticsCopy(copy.inactiveAlertTitle, { count: alerts.inactiveAthletes || 0 }),
      text: copy.inactiveAlertText,
      path: "/admin/atleta",
    },
    {
      icon: "★",
      tone: "success",
      title: interpolateStatisticsCopy(copy.prOpportunityTitle, { count: alerts.prCount || 0 }),
      text: copy.prOpportunityText,
      path: "/admin/pr",
    },
  ]

  return (
    <article className="admin-statistics-panel admin-statistics-alerts-panel">
      <PanelHeader eyebrow={copy.adminAttention} title={copy.alertsTitle} action={<strong className="admin-statistics-badge is-danger">{rows.filter((row, index) => index !== 2 ? Number(Object.values(alerts)[index] || 0) > 0 : false).length}</strong>} />
      <div className="admin-statistics-alert-list">
        {rows.map((row) => (
          <button key={row.title} type="button" onClick={() => navigate(row.path)}>
            <span className={`admin-statistics-alert-icon is-${row.tone}`}>{row.icon}</span>
            <span><strong>{row.title}</strong><small>{row.text}</small></span>
            <b aria-hidden="true">→</b>
          </button>
        ))}
      </div>
    </article>
  )
}

export function HighlightedAthletesPanel({ copy, athletes, visible = true }) {
  if (!visible) return null

  return (
    <article className="admin-statistics-panel admin-statistics-athletes-panel">
      <PanelHeader eyebrow={copy.highlightedAthletes} title={copy.mostActive} />
      {athletes.length ? (
        <div className="admin-statistics-athlete-list">
          {athletes.map((athlete, index) => (
            <div key={athlete.userId}>
              <span className={`admin-statistics-position position-${index + 1}`}>#{index + 1}</span>
              <span className="admin-statistics-athlete-avatar">
                {athlete.fotoUrl ? <img src={athlete.fotoUrl} alt={athlete.nombre} /> : athlete.nombre.slice(0, 2).toUpperCase()}
              </span>
              <span><strong>{athlete.nombre}</strong><small>WOD {athlete.wods} · PR {athlete.prs} · ✓ {athlete.attendance}</small></span>
              <b>{interpolateStatisticsCopy(copy.activityPoints, { count: athlete.score })}</b>
            </div>
          ))}
        </div>
      ) : <div className="admin-statistics-empty">{copy.noActivityData}</div>}
      <footer className="admin-statistics-panel-note">{copy.activityFormula}</footer>
    </article>
  )
}
