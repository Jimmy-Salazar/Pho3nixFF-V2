import { formatDateLabel, getInitials } from "../utils/adminDashboardUtils.js"
import { interpolateAdminCopy } from "../i18n/adminDashboardCopy.js"

export default function AdminDetailModal({ type, rows, copy, locale, onClose }) {
  if (!type) return null

  const config = getConfig(type, rows, copy, locale)

  return (
    <div className="admin-detail-modal" role="dialog" aria-modal="true" aria-labelledby="admin-detail-title">
      <button type="button" className="admin-detail-backdrop" onClick={onClose} aria-label={copy.close} />

      <section className="admin-detail-card">
        <header>
          <div>
            <span>{copy.details}</span>
            <h2 id="admin-detail-title">{config.title}</h2>
            <p>{interpolateAdminCopy(copy.recordsFound, { count: config.items.length })}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={copy.close}>×</button>
        </header>

        <div className="admin-detail-list">
          {config.items.length ? (
            config.items.map((item, index) => (
              <article key={item.id || `${item.nombre}-${index}`}>
                <div className="admin-detail-avatar">
                  {item.fotoUrl ? <img src={item.fotoUrl} alt={item.nombre} /> : <span>{getInitials(item.nombre)}</span>}
                </div>
                <div>
                  <strong>{item.nombre}</strong>
                  {item.secondary ? <p>{item.secondary}</p> : null}
                </div>
                {item.badge ? <span className="admin-detail-badge">{item.badge}</span> : null}
              </article>
            ))
          ) : (
            <p className="admin-empty-message">0</p>
          )}
        </div>

        <footer>
          <button type="button" onClick={onClose}>{copy.close}</button>
        </footer>
      </section>
    </div>
  )
}

function getConfig(type, rows, copy, locale) {
  if (type === "registeredAthletes") {
    return {
      title: copy.registeredAthletesDetail,
      items: (rows.registeredAthletes || []).map((item) => ({
        ...item,
        secondary: item.email,
        badge: getRoleLabel(item.role, copy),
      })),
    }
  }

  if (type === "activeAthletes") {
    return {
      title: copy.activeAthletesDetail,
      items: (rows.activeAthletes || []).map((item) => ({
        ...item,
        secondary: item.email,
        badge: item.fechaFin ? formatDateLabel(item.fechaFin, locale) : copy.active,
      })),
    }
  }

  if (type === "expiringSoon") {
    return {
      title: copy.expiringSoonDetail,
      items: (rows.expiringSoon || []).map((item) => ({
        ...item,
        secondary: item.fechaFin ? formatDateLabel(item.fechaFin, locale) : "—",
        badge:
          item.daysLeft === 0
            ? copy.expiresToday
            : interpolateAdminCopy(copy.expiresIn, { days: item.daysLeft }),
      })),
    }
  }

  if (type === "birthdaysThisMonth") {
    return {
      title: copy.birthdaysDetail,
      items: (rows.birthdaysThisMonth || []).map((item) => ({
        ...item,
        secondary: item.fechaNacimiento ? formatDateLabel(item.fechaNacimiento, locale) : "—",
        badge: item.daysUntil === 0 ? copy.todayBirthday : String(item.birthDay),
      })),
    }
  }

  return {
    title: copy.details,
    items: [],
  }
}

function getRoleLabel(role, copy) {
  if (role === "alumno") return copy.roleAthlete
  if (role === "coach") return copy.roleCoach
  if (role === "admin") return copy.roleAdmin
  return copy.roleOther
}
