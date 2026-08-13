import { useLocation } from "react-router-dom"
import { useAuth } from "../../../auth/context/AuthContext.jsx"
import { getActiveAdminNavKey, normalizeRole } from "../utils/adminDashboardUtils.js"

const BASE_ITEMS = [
  { key: "dashboard", icon: "⌂", path: "/admin/dashboard" },
  { key: "athletes", icon: "👥", path: "/admin/atleta" },
  { key: "wods", icon: "🏋", path: "/admin/wods" },
]

export default function AdminMobileNav({ copy, navigate }) {
  const location = useLocation()
  const { role, rol } = useAuth()
  const activeKey = getActiveAdminNavKey(location.pathname)
  const isAdmin = normalizeRole(role || rol) === "admin"
  const fourthItem = isAdmin
    ? { key: "pda", icon: "▤", path: "/admin/pda" }
    : { key: "records", icon: "🏆", path: "/admin/pr" }
  const items = [...BASE_ITEMS, fourthItem]

  function handleMore() {
    if (location.pathname !== "/admin/dashboard") {
      navigate("/admin/dashboard")
      window.setTimeout(() => {
        document.getElementById("admin-quick-actions")?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 180)
      return
    }

    document.getElementById("admin-quick-actions")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <nav className="admin-mobile-nav">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={activeKey === item.key ? "is-active" : ""}
          onClick={() => navigate(item.path)}
          aria-current={activeKey === item.key ? "page" : undefined}
        >
          <span aria-hidden="true">{item.icon}</span>
          <small>{item.key === "pda" ? "PDA's" : copy[item.key]}</small>
        </button>
      ))}

      <button type="button" onClick={handleMore}>
        <span aria-hidden="true">☰</span>
        <small>{copy.mobileMore}</small>
      </button>
    </nav>
  )
}
