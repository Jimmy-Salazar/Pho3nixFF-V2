import { useLocation } from "react-router-dom"

import { NAV_ITEMS } from "./studentNavigation.js"

function getActiveKey(pathname) {
  const path = String(pathname || "").toLowerCase()

  if (path.startsWith("/alumno/wods") || path.startsWith("/wods")) return "wods"

  if (
    path.startsWith("/alumno/records") ||
    path.startsWith("/alumno/personalrecord") ||
    path.startsWith("/alumno/personalrecords") ||
    path.startsWith("/alumno/pr") ||
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

export default function StudentMobileNav({ copy, navigate }) {
  const location = useLocation()
  const activeKey = getActiveKey(location.pathname)

  return (
    <nav className="student-mobile-nav">
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
            <small>{copy[item.key]}</small>
          </button>
        )
      })}
    </nav>
  )
}
