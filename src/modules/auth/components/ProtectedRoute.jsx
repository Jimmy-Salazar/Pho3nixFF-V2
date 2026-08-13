import { Navigate, useLocation } from "react-router-dom"

import { useAuth } from "../context/AuthContext.jsx"

const normalizeRole = (value) => String(value || "").toLowerCase().trim()

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const location = useLocation()
  const { loading, profileLoading, isAuthenticated, role } = useAuth()

  if (loading || profileLoading) {
    return (
      <main className="phx-auth-state-page">
        <section className="phx-auth-state-card">
          <span className="phx-auth-state-orb" aria-hidden="true" />
          <p>PHO3NIX</p>
          <h1>Validando acceso</h1>
          <small>Estamos revisando tu sesión.</small>
        </section>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  const normalizedRole = normalizeRole(role)
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole)

  if (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(normalizedRole)) {
    return <Navigate to="/app" replace />
  }

  return children
}
