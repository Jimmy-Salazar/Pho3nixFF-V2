export default function AdminMembershipSummary({ copy, summary, loading, onOpenDetail }) {
  const items = [
    { key: "active", label: copy.active, value: summary.active },
    { key: "expiring", label: copy.expiring, value: summary.expiring, detail: "expiringSoon" },
    { key: "expired", label: copy.expired, value: summary.expired },
    { key: "missing", label: copy.missing, value: summary.missing },
  ]

  return (
    <section className="admin-panel admin-membership-panel">
      <div className="admin-panel-heading admin-panel-heading-compact">
        <div>
          <span>{copy.memberships}</span>
          <h2>{copy.membershipStatus}</h2>
        </div>
        <strong className="admin-panel-total">{loading ? "..." : summary.totalAthletes}</strong>
      </div>

      <div className="admin-membership-grid">
        {items.map((item) => {
          const Component = item.detail ? "button" : "article"

          return (
            <Component
              key={item.key}
              type={item.detail ? "button" : undefined}
              className={`admin-membership-item is-${item.key}`}
              onClick={item.detail ? () => onOpenDetail(item.detail) : undefined}
            >
              <strong>{loading ? "..." : item.value}</strong>
              <span>{item.label}</span>
            </Component>
          )
        })}
      </div>
    </section>
  )
}
