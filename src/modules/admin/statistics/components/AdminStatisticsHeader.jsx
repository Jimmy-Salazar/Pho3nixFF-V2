import { getInitials } from "../../dashboard/utils/adminDashboardUtils.js"

export default function AdminStatisticsHeader({
  dashboardCopy,
  copy,
  locale,
  setLocale,
  profile,
  loading,
  exporting,
  onExport,
  onLogout,
}) {
  const name = profile?.nombre || profile?.email || "PHO3NIX"

  return (
    <header className="admin-statistics-header">
      <div className="admin-statistics-mobile-brand">
        <span className="admin-brand-logo" aria-hidden="true" />
        <div>
          <strong>PHO3NIX</strong>
          <small>{copy.title}</small>
        </div>
      </div>

      <div className="admin-statistics-heading">
        <span>{copy.module}</span>
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>
      </div>

      <div className="admin-statistics-header-actions">
        <div className="admin-header-languages">
          <button type="button" className={locale === "es" ? "is-active" : ""} onClick={() => setLocale("es")} aria-label="Español">🇪🇨</button>
          <button type="button" className={locale === "en" ? "is-active" : ""} onClick={() => setLocale("en")} aria-label="English">🇺🇸</button>
        </div>

        <button type="button" className="admin-statistics-export" onClick={onExport} disabled={exporting || loading}>
          <span aria-hidden="true">⇩</span>
          <strong>{exporting ? copy.exporting : copy.export}</strong>
        </button>

        <button type="button" className="admin-header-logout" onClick={onLogout}>
          <span className="admin-header-logout-label">{dashboardCopy.logout}</span>
          <span aria-hidden="true">⏻</span>
        </button>

        <div className="admin-header-profile">
          <div className="admin-header-avatar">
            {profile?.foto_url ? <img src={profile.foto_url} alt={name} /> : <span>{loading ? "..." : getInitials(name)}</span>}
          </div>
          <div>
            <strong>{loading ? "..." : name}</strong>
            <small>{copy.adminRole}</small>
          </div>
        </div>
      </div>
    </header>
  )
}
