import { Navigate } from "react-router-dom"

import { useAuth } from "../context/AuthContext.jsx"

export default function RoleRedirect() {
  const { loading, profileLoading, isAuthenticated, role, getRoleDestination } = useAuth()

  if (loading || profileLoading) {
    return (
      <main className="phx-auth-state-page">
        <section className="phx-auth-state-card">
          <span className="phx-auth-state-orb" aria-hidden="true" />
          <p>PHO3NIX</p>
          <h1>Preparando tu panel</h1>
          <small>Redirigiendo según tu rol.</small>
        </section>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={getRoleDestination(role)} replace />
}
