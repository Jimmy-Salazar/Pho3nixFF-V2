import { useLocation } from "react-router-dom"
import { useAuth } from "../../../auth/context/AuthContext.jsx"
import {
  ADMIN_NAV_ITEMS,
  getActiveAdminNavKey,
  getInitials,
  normalizeRole,
} from "../utils/adminDashboardUtils.js"

export default function AdminDashboardSidebar({
  copy,
  profile,
  locale,
  setLocale,
  navigate,
  onLogout,
}) {
  const location = useLocation()
  const { role: authRole, rol: legacyAuthRole } = useAuth()
  const activeKey = getActiveAdminNavKey(location.pathname)
  const name = profile?.nombre || profile?.email || "PHO3NIX"
  const role = normalizeRole(authRole || legacyAuthRole || profile?.role || profile?.rol)

  return (
    <aside className="admin-dashboard-sidebar">
      <div className="admin-sidebar-brand">
        <span className="admin-brand-logo" aria-hidden="true" />
        <strong>PHO3NIX</strong>
        <small>FUNCTIONAL FITNESS</small>
      </div>

      <div className="admin-language-switch" aria-label="Selector de idioma">
        <button
          type="button"
          className={locale === "es" ? "is-active" : ""}
          onClick={() => setLocale("es")}
          aria-pressed={locale === "es"}
        >
          🇪🇨 ES
        </button>
        <button
          type="button"
          className={locale === "en" ? "is-active" : ""}
          onClick={() => setLocale("en")}
          aria-pressed={locale === "en"}
        >
          🇺🇸 EN
        </button>
      </div>

      <nav className="admin-sidebar-nav">
        {ADMIN_NAV_ITEMS
          .filter((item) => !item.adminOnly || role === "admin")
          .map((item) => {
          const active = item.key === activeKey

          return (
            <button
              key={item.key}
              type="button"
              className={active ? "is-active" : ""}
              onClick={() => navigate(item.path)}
              aria-current={active ? "page" : undefined}
            >
              <span aria-hidden="true">{item.icon}</span>
              <strong>{copy[item.key] || (locale === "en" ? item.labelEn : item.labelEs) || item.key}</strong>
            </button>
          )
        })}
      </nav>

      <div className="admin-sidebar-profile">
        <div className="admin-sidebar-avatar">
          {profile?.foto_url ? (
            <img src={profile.foto_url} alt={name} />
          ) : (
            <span>{getInitials(name)}</span>
          )}
        </div>
        <div>
          <strong>{name}</strong>
          <small>{role === "coach" ? copy.coachRole : copy.adminRole}</small>
        </div>
      </div>

      <button type="button" className="admin-sidebar-logout" onClick={onLogout}>
        <span aria-hidden="true">⏻</span>
        {copy.logout}
      </button>
    </aside>
  )
}
