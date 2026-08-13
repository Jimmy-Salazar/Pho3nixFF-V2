import { getInitials } from "../utils/adminDashboardUtils.js"

export default function AdminBirthdayCalendar({ copy, locale, items, loading, onOpenDetail }) {
  const today = new Date()
  const monthLabel = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", { month: "long" }).format(today)

  return (
    <section className="admin-panel admin-birthday-panel">
      <div className="admin-panel-heading admin-panel-heading-compact">
        <div>
          <span className="admin-capitalize">{monthLabel}</span>
          <h2>{copy.birthdays}</h2>
        </div>
        <button
          type="button"
          className="admin-panel-total admin-panel-total-button"
          onClick={() => onOpenDetail("birthdaysThisMonth")}
        >
          {loading ? "..." : items.length}
        </button>
      </div>

      <div className="admin-birthday-list">
        {loading ? (
          <div className="admin-skeleton-list" aria-hidden="true"><span /><span /><span /></div>
        ) : items.length ? (
          items.slice(0, 5).map((item) => (
            <article key={item.id}>
              <div className="admin-birthday-avatar">
                {item.fotoUrl ? <img src={item.fotoUrl} alt={item.nombre} /> : <span>{getInitials(item.nombre)}</span>}
              </div>
              <div>
                <strong>{item.nombre}</strong>
                <p>{item.daysUntil === 0 ? copy.todayBirthday : `${item.birthDay}`}</p>
              </div>
              <span aria-hidden="true">🎁</span>
            </article>
          ))
        ) : (
          <p className="admin-empty-message">{copy.noBirthdays}</p>
        )}
      </div>
    </section>
  )
}
