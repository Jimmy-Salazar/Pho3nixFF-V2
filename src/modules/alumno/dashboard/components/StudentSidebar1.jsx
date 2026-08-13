import { useLocation } from "react-router-dom"

import StudentLanguageSwitch from "./StudentLanguageSwitch.jsx"
import { NAV_ITEMS } from "./studentNavigation.js"

function getActiveKey(pathname) {
  const path = String(pathname || "").toLowerCase()

  if (path.startsWith("/alumno/wods") || path.startsWith("/wods")) return "wods"

  if (
    path.startsWith("/alumno/records") ||
    path.startsWith("/alumno/personalrecord") ||
    path.startsWith("/alumno/personalrecords") ||
    path.startsWith("/alumno/pr") ||
    path.startsWith("/personalrecord") ||
    path.includes("personalrecord") ||
    path.includes("/rm")
  ) {
    return "records"
  }

  if (
    path.startsWith("/alumno/progreso") ||
    path.startsWith("/alumno/progress") ||
    path.startsWith("/progreso") ||
    path.startsWith("/progress")
  ) {
    return "progress"
  }

  if (
    path.startsWith("/alumno/perfil") ||
    path.startsWith("/alumno/profile") ||
    path.startsWith("/perfil") ||
    path.startsWith("/profile")
  ) {
    return "profile"
  }

  return "home"
}

export default function StudentSidebar({ copy, membership, navigate, onLogout }) {
  const location = useLocation()
  const activeKey = getActiveKey(location.pathname)

  return (
    <aside className="student-sidebar">
      <div className="student-sidebar-brand">
        <span className="student-dashboard-logo" aria-hidden="true" />
        <strong>PHO3NIX</strong>
        <small>FUNCTIONAL FITNESS</small>
      </div>

      <StudentLanguageSwitch />

      <nav className="student-sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === activeKey

          return (
            <button
              key={item.key}
              type="button"
              className={isActive ? "is-active" : ""}
              onClick={() => navigate(item.path)}
              aria-current={isActive ? "page" : undefined}
            >
              <span>{item.icon}</span>
              {copy[item.key]}
            </button>
          )
        })}
      </nav>

      <div className={`student-sidebar-membership is-${membership.status}`}>
        <small>{copy.membership}</small>
        <strong>{membership.title}</strong>
        <span>{membership.subtitle}</span>
      </div>

      <button type="button" className="student-sidebar-logout" onClick={onLogout}>
        {copy.logout}
      </button>
    </aside>
  )
}
