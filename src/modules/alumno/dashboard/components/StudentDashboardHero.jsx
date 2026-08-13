import MembershipCard from "./MembershipCard.jsx"

export default function StudentDashboardHero({ copy, firstName, membership }) {
  return (
    <section className="student-dashboard-hero">
      <div>
        <p className="student-dashboard-kicker">{copy.member}</p>
        <h1>
          {copy.greeting}, {firstName}
        </h1>
        <p>{copy.subtitle}</p>
      </div>

      <MembershipCard copy={copy} membership={membership} />
    </section>
  )
}
