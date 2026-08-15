import { formatDateLabel } from "../utils/adminDashboardUtils.js"

export default function AdminUpcomingEvents({ copy, locale, items, loading }) {
  return (
    <section className="admin-panel admin-events-panel">
      <div className="admin-panel-heading admin-panel-heading-compact">
        <div>
          <span>{copy.today}</span>
          <h2>{copy.upcomingEvents}</h2>
        </div>
        <strong className="admin-panel-total">{loading ? "..." : items.length}</strong>
      </div>

      <div className="admin-events-list">
        {loading ? (
          <div className="admin-skeleton-list" aria-hidden="true"><span /><span /><span /></div>
        ) : items.length ? (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled
              tabIndex={-1}
              aria-disabled="true"
              style={{ cursor: "default", pointerEvents: "none" }}
            >
              <span className={`admin-event-icon is-${item.type}`} aria-hidden="true">{item.icon}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.subtitle}</p>
              </div>
              <time>{formatDateLabel(item.date, locale)}</time>
            </button>
          ))
        ) : (
          <p className="admin-empty-message">{copy.noEvents}</p>
        )}
      </div>
    </section>
  )
}