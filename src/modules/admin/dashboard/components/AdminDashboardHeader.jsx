import { formatLongDate, getInitials, normalizeRole } from "../utils/adminDashboardUtils.js"

export default function AdminDashboardHeader({
  copy,
  locale,
  setLocale,
  profile,
  loading,
  onLogout,
}) {
  const name = profile?.nombre || profile?.email || "PHO3NIX"
  const firstName = String(name).trim().split(/\s+/)[0] || "PHO3NIX"
  const role = normalizeRole(profile?.role)

  return (
    <header className="admin-dashboard-header">
      <div className="admin-mobile-brand">
        <span className="admin-brand-logo" aria-hidden="true" />
        <div>
          <strong>PHO3NIX</strong>
          <small>{copy.moduleDashboard}</small>
        </div>
      </div>

      <div className="admin-dashboard-heading">
        <span>{copy.today}</span>
        <h1>
          {copy.greeting}, <em>{loading ? "..." : firstName}</em> 👋
        </h1>
        <p>{copy.subtitle}</p>
      </div>

      <div className="admin-dashboard-header-actions">
        <div className="admin-header-date">{formatLongDate(new Date(), locale)}</div>

        <div className="admin-header-languages">
          <button
            type="button"
            className={locale === "es" ? "is-active" : ""}
            onClick={() => setLocale("es")}
            aria-label="Español"
          >
            🇪🇨
          </button>
          <button
            type="button"
            className={locale === "en" ? "is-active" : ""}
            onClick={() => setLocale("en")}
            aria-label="English"
          >
            🇺🇸
          </button>
        </div>

        <button type="button" className="admin-header-logout" onClick={onLogout}>
          <span className="admin-header-logout-label">{copy.logout}</span>
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
            <small>{role === "coach" ? copy.coachRole : copy.adminRole}</small>
          </div>
        </div>
      </div>
    </header>
  )
}
