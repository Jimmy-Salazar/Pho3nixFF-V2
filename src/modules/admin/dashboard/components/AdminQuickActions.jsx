import { useNavigate } from "react-router-dom"

import { useAuth } from "../../../auth/context/AuthContext.jsx"
import { normalizeRole } from "../utils/adminDashboardUtils.js"

const STATISTICS_PATH = "/admin/estadisticas"

const ACTIONS = [
  { key: "manageAthletes", icon: "👥", path: "/admin/atleta" },
  { key: "createWod", icon: "🏋", path: "/admin/wods" },
  { key: "registerPr", icon: "🏆", path: "/admin/pr" },
  { key: "pda", icon: "▤", path: "/admin/pda", label: "PDA's" },
  { key: "createAnnouncement", icon: "📣", path: "/admin/anuncios" },
  { key: "manageCompetitions", icon: "★", path: "/admin/competencias" },
]

export default function AdminQuickActions({ copy, navigate }) {
  const routerNavigate = useNavigate()
  const { role, rol } = useAuth()
  const isAdmin = normalizeRole(role || rol) === "admin"
  const statisticsLabel =
    copy.viewStatistics ||
    (copy.logout === "Sign out" ? "View statistics" : "Ver estadísticas")

  const items = isAdmin
    ? [
        ...ACTIONS,
        {
          key: "viewStatistics",
          icon: "↗",
          path: STATISTICS_PATH,
          label: statisticsLabel,
        },
      ]
    : ACTIONS

  function handleOpenModule(item) {
    // El acceso de Estadísticas usa directamente el router de esta pantalla.
    // Así no depende de que el Dashboard entregue correctamente la prop navigate.
    if (item.path === STATISTICS_PATH) {
      routerNavigate(STATISTICS_PATH)
      return
    }

    if (typeof navigate === "function") {
      navigate(item.path)
      return
    }

    routerNavigate(item.path)
  }

  return (
    <section id="admin-quick-actions" className="admin-panel admin-quick-actions-panel">
      <div className="admin-panel-heading admin-panel-heading-compact">
        <div>
          <span>{copy.dailyManagement}</span>
          <h2>{copy.quickActions}</h2>
        </div>
      </div>

      <div className="admin-quick-actions-grid">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => handleOpenModule(item)}
          >
            <span className="admin-quick-action-icon" aria-hidden="true">
              {item.icon}
            </span>
            <strong>{item.label || copy[item.key]}</strong>
            <small>{copy.openModule}</small>
            <em aria-hidden="true">›</em>
          </button>
        ))}
      </div>
    </section>
  )
}
