import { useLocation } from "react-router-dom"

import StudentLanguageSwitch from "./StudentLanguageSwitch.jsx"
import { getStudentNavigationItems } from "./studentNavigation.js"

function getActiveKey(pathname) {
  const path = String(pathname || "").toLowerCase()

  if (path.startsWith("/atleta/pda") || path.startsWith("/alumno/pda") || path === "/pda") return "pda"
  if (path.startsWith("/atleta/wods") || path.startsWith("/alumno/wods") || path.startsWith("/wods")) return "wods"

  if (
    path.startsWith("/atleta/records") ||
    path.startsWith("/alumno/records") ||
    path.startsWith("/alumno/personalrecord") ||
    path.startsWith("/alumno/personalrecords") ||
    path.startsWith("/alumno/pr") ||
    path.startsWith("/personalrecord") ||
    path.includes("personalrecord") ||
    path.includes("/rm")
  ) return "records"

  if (
    path.startsWith("/atleta/progreso") ||
    path.startsWith("/alumno/progreso") ||
    path.startsWith("/alumno/progress") ||
    path.startsWith("/progreso") ||
    path.startsWith("/progress")
  ) return "progress"

  if (
    path.startsWith("/atleta/perfil") ||
    path.startsWith("/alumno/perfil") ||
    path.startsWith("/alumno/profile") ||
    path.startsWith("/perfil") ||
    path.startsWith("/profile")
  ) return "profile"

  return "home"
}

export default function StudentSidebar({ copy, membership, navigate, onLogout }) {
  const location = useLocation()
  const activeKey = getActiveKey(location.pathname)
  const items = getStudentNavigationItems()

  return (
    <aside className="student-sidebar">
      <div className="student-sidebar-brand">
        <span className="student-dashboard-logo" aria-hidden="true" />
        <strong>PHO3NIX</strong>
        <small>FUNCTIONAL FITNESS</small>
      </div>

      <StudentLanguageSwitch />

      <nav className="student-sidebar-nav">
        {items.map((item) => {
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
              {copy[item.key] || item.key.toUpperCase()}
            </button>
          )
        })}
      </nav>

      {membership ? (
        <div className={`student-sidebar-membership is-${membership.status}`}>
          <small>{copy.membership}</small>
          <strong>{membership.title}</strong>
          <span>{membership.subtitle}</span>
        </div>
      ) : null}

      <button type="button" className="student-sidebar-logout" onClick={onLogout}>
        {copy.logout}
      </button>
    </aside>
  )
}
