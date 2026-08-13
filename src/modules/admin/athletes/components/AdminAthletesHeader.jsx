import {
  formatLongDate,
  getInitials,
  normalizeRole,
} from "../../dashboard/utils/adminDashboardUtils.js"

export default function AdminAthletesHeader({
  dashboardCopy,
  copy,
  locale,
  setLocale,
  profile,
  loading,
  onLogout,
}) {
  const name = profile?.nombre || profile?.email || "PHO3NIX"
  const role = normalizeRole(profile?.role)

  return (
    <header className="admin-dashboard-header">
      <div className="admin-mobile-brand">
        <span className="admin-brand-logo" aria-hidden="true" />
        <div>
          <strong>PHO3NIX</strong>
          <small>{copy.moduleLabel}</small>
        </div>
      </div>

      <div className="admin-dashboard-heading">
        <span>{copy.eyebrow}</span>
        <h1>
          {copy.titleLead} <em>{copy.titleAccent}</em>
        </h1>
        <p>{copy.subtitle}</p>
      </div>

      <div className="admin-dashboard-header-actions">
        <div className="admin-header-date">
          {formatLongDate(new Date(), locale)}
        </div>

        <div className="admin-header-languages">
          <button
            type="button"
            className={locale === "es" ? "is-active" : ""}
            onClick={() => setLocale("es")}
            aria-label="Español"
            aria-pressed={locale === "es"}
          >
            🇪🇨
          </button>
          <button
            type="button"
            className={locale === "en" ? "is-active" : ""}
            onClick={() => setLocale("en")}
            aria-label="English"
            aria-pressed={locale === "en"}
          >
            🇺🇸
          </button>
        </div>

        <button type="button" className="admin-header-logout" onClick={onLogout}>
          <span className="admin-header-logout-label">{dashboardCopy.logout}</span>
          <span aria-hidden="true">⏻</span>
        </button>

        <div className="admin-header-profile">
          <div className="admin-header-avatar">
            {profile?.foto_url ? (
              <img src={profile.foto_url} alt={name} />
            ) : (
              <span>{loading ? "..." : getInitials(name)}</span>
            )}
          </div>
          <div>
            <strong>{loading ? "..." : name}</strong>
            <small>
              {role === "coach" ? dashboardCopy.coachRole : dashboardCopy.adminRole}
            </small>
          </div>
        </div>
      </div>
    </header>
  )
}
