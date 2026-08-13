import {
  StatisticsDistribution,
  StatisticsMultiLineChart,
  StatisticsPieChart,
  StatisticsEmpty,
  StatisticsKpis,
} from "./AdminStatisticsDetailShared.jsx"

export default function AdminAthleteStatistics({ copy, stats }) {
  return (
    <section className="admin-statistics-special-section admin-athlete-statistics-section">
      <div className="admin-statistics-special-heading">
        <div>
          <span>{copy.athletes}</span>
          <h2>{copy.athleteStatistics}</h2>
          <p>{copy.athleteGeneralSubtitle}</p>
        </div>
      </div>

      <AthleteGeneral copy={copy} stats={stats} />
    </section>
  )
}

function AthleteGeneral({ copy, stats }) {
  const summary = stats?.summary || {}
  const membershipRows = [
    { key: "active", label: copy.membershipActive, value: summary.active || 0 },
    { key: "expiring", label: copy.membershipExpiring, value: summary.expiring || 0 },
    { key: "expired", label: copy.membershipExpired, value: summary.expired || 0 },
    { key: "missing", label: copy.membershipMissing, value: summary.missing || 0 },
  ]
  const genderRows = (stats?.genderSeries || []).map((row) => ({
    ...row,
    label: copy[row.key] || row.key,
  }))
  const ageRows = (stats?.ageSeries || []).map((row) => ({
    ...row,
    label: copy[row.key] || row.key,
  }))
  const nutritionRows = (stats?.nutritionSeries || []).map((row) => ({
    ...row,
    label: copy[row.key] || row.key,
  }))

  return (
    <>
      <StatisticsKpis
        items={[
          { icon: "◎", label: copy.totalAthletes, value: summary.total || 0, help: copy.total },
          { icon: "+", label: copy.newAthletes, value: summary.newInPeriod || 0, help: copy.periodLabel },
          { icon: "⚡", label: copy.activeInPeriod, value: summary.activeInPeriod || 0, help: `${summary.activityRate || 0}%` },
          { icon: "◷", label: copy.averageMemberTime, value: `${summary.averageMemberDays || 0}`, help: copy.daysUnit },
        ]}
      />

      <div className="admin-statistics-detail-grid">
        <StatisticsMultiLineChart
          series={stats?.growthSeries || []}
          title={copy.athleteGrowth}
          subtitle={copy.newRegistrations}
          emptyText={copy.noActivityData}
          copy={copy}
        />
        <StatisticsDistribution
          title={copy.membershipDistribution}
          subtitle={copy.memberships}
          rows={membershipRows}
          emptyText={copy.noActivityData}
        />
        <StatisticsDistribution
          title={copy.genderDistribution}
          subtitle={copy.athletes}
          rows={genderRows}
          emptyText={copy.noActivityData}
        />
        <StatisticsDistribution
          title={copy.ageDistribution}
          subtitle={copy.athletes}
          rows={ageRows}
          emptyText={copy.noActivityData}
        />
        <InactivityPanel copy={copy} inactivity={stats?.inactivity || {}} />
        <StatisticsPieChart
          title={copy.nutritionStatistics}
          subtitle={copy.nutritionGoals}
          rows={nutritionRows}
          emptyText={copy.noNutritionData}
          totalLabel={copy.athletes}
        />
      </div>
    </>
  )
}

function InactivityPanel({ copy, inactivity }) {
  const rows = [
    { label: copy.inactive7, value: inactivity.days7 || 0, tone: "warning" },
    { label: copy.inactive14, value: inactivity.days14 || 0, tone: "danger" },
    { label: copy.inactive30, value: inactivity.days30 || 0, tone: "critical" },
  ]

  return (
    <article className="admin-statistics-detail-panel">
      <header>
        <div>
          <span>{copy.adminAttention}</span>
          <h3>{copy.inactivityTitle}</h3>
          <p>{copy.inactivitySubtitle}</p>
        </div>
      </header>
      <div className="admin-statistics-inactivity-list">
        {rows.map((row) => (
          <div key={row.label} className={`is-${row.tone}`}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
    </article>
  )
}
