import SectionHeader from "./SectionHeader.jsx"
import WeekProgress from "./WeekProgress.jsx"

export default function WeekProgressSection({ copy, dashboard }) {
  return (
    <section className="student-section">
      <SectionHeader title={copy.weekProgress} action={copy.weekGoal} />
      <WeekProgress
        copy={copy}
        completed={dashboard.weekWodCount}
        target={dashboard.weekWodTarget}
        calories={dashboard.weekCaloriesTotal}
        caloriesTarget={dashboard.weekCaloriesTarget}
        series={dashboard.weekCaloriesSeries}
      />
    </section>
  )
}
