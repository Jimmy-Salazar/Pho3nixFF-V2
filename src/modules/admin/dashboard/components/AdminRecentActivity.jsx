export default function AdminRecentActivity({ copy, items, loading }) {
  return (
    <section className="admin-panel admin-activity-panel">
      <div className="admin-panel-heading admin-panel-heading-compact">
        <div>
          <span>{copy.last24Hours}</span>
          <h2>{copy.recentActivity}</h2>
        </div>
        <strong className="admin-panel-total">{loading ? "..." : items.length}</strong>
      </div>

      <div className="admin-activity-list">
        {loading ? (
          <ActivitySkeleton />
        ) : items.length ? (
          items.slice(0, 6).map((item) => (
            <article key={item.id}>
              <span className="admin-activity-icon" aria-hidden="true">{item.icon}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.subtitle}</p>
                <small>{item.module}</small>
              </div>
              <time>{item.time}</time>
            </article>
          ))
        ) : (
          <p className="admin-empty-message">{copy.noActivity}</p>
        )}
      </div>
    </section>
  )
}

function ActivitySkeleton() {
  return (
    <div className="admin-skeleton-list" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  )
}
