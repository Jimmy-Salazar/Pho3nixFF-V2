import { Link, NavLink } from "react-router-dom"
import LanguageSwitcher from "../components/LanguageSwitcher.jsx"
import ThemeStatusBadge from "../components/ThemeStatusBadge.jsx"
import { useI18n } from "../../i18n/I18nProvider.jsx"
export default function DashboardShell({ mode = "admin", title, subtitle, children }) {
  const { t } = useI18n()
  const navItems = mode === "admin" ? [
    { to: "/admin/dashboard", label: "Dashboard" }, { to: "/admin/wods", label: "WODs" }, { to: "/admin/alumnos", label: "Alumnos" }, { to: "/admin/reports", label: "Reportes" },
  ] : [
    { to: "/alumno/dashboard", label: "Dashboard" }, { to: "/alumno/wods", label: "WODs" }, { to: "/alumno/pr", label: "PRs" }, { to: "/alumno/nutrition", label: "Nutrición" },
  ]
  return (
    <main className="phx-dashboard-shell">
      <aside className="phx-sidebar">
        <Link to="/" className="phx-brand"><div className="phx-brand-mark">P3</div><div><strong>{t("app.brand")}</strong><span>{mode === "admin" ? "Admin" : "Alumno"}</span></div></Link>
        <nav className="phx-sidebar-nav">{navItems.map((item) => <NavLink key={item.to} to={item.to}>{item.label}</NavLink>)}</nav>
      </aside>
      <section className="phx-dashboard-main">
        <header className="phx-dashboard-header"><div><p className="phx-eyebrow">{t("app.version")}</p><h1>{title}</h1><p>{subtitle}</p></div><div className="phx-dashboard-actions"><ThemeStatusBadge /><LanguageSwitcher /></div></header>
        {children}
      </section>
    </main>
  )
}
