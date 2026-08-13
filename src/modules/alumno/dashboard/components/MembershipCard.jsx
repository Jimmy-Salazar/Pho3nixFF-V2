export default function MembershipCard({ copy, membership }) {
  const progress = Number.isFinite(Number(membership.progress))
    ? Math.min(Math.max(Number(membership.progress), 0), 100)
    : 0

  return (
    <article className={`student-membership-card is-${membership.status}`}>
      <div
        className="student-membership-ring"
        style={{ "--membership-progress": `${progress}%` }}
        aria-label={`${copy.membership}: ${progress}%`}
      >
        <span>{progress}%</span>
      </div>

      <div>
        <small>{copy.membership}</small>
        <strong>{membership.title}</strong>
        <p>{membership.subtitle}</p>
      </div>

      <em>{membership.dateLabel}</em>
    </article>
  )
}
