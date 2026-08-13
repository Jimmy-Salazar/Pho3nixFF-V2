import MetricCard from "./MetricCard.jsx"
import SectionHeader from "./SectionHeader.jsx"
import { formatCompactNumber } from "../utils/studentDashboardUtils.js"

export default function QuickStatsGrid({ copy, dashboard, weekPercent, caloriesPercent }) {
  return (
    <section className="student-section">
      <SectionHeader title={copy.stats} action="" />

      <div className="student-stat-grid">
        <MetricCard
          icon="🔥"
          label={copy.calories}
          value={formatCompactNumber(dashboard.weekCaloriesTotal)}
          footer={`${caloriesPercent}% · ${copy.accumulated}`}
        />
        <MetricCard
          icon="📅"
          label={copy.week}
          value={`${weekPercent}%`}
          footer={`${dashboard.weekWodCount}/${dashboard.weekWodTarget} ${copy.programmed}`}
        />
        <MetricCard
          icon="🏆"
          label={copy.pr}
          value={dashboard.prCount}
          footer={dashboard.latestPr?.peso_libras ? `${copy.latest}: ${dashboard.latestPr.peso_libras} lb` : copy.noMarks}
        />
        <MetricCard
          icon="🎯"
          label={copy.challenges}
          value={dashboard.activeChallengesCount}
          footer={dashboard.activeChallengesCount > 0 ? copy.completed : copy.noChallenges}
        />
      </div>
    </section>
  )
}
