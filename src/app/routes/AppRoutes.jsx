import { Navigate, Route, Routes } from "react-router-dom"

import ProtectedRoute from "../../modules/auth/components/ProtectedRoute.jsx"
import RoleRedirect from "../../modules/auth/components/RoleRedirect.jsx"
import HomePage from "../../modules/public/pages/HomePage.jsx"
import LoginPage from "../../modules/auth/pages/LoginPage.jsx"
import AdminDashboardPage from "../../modules/admin/pages/AdminDashboardPage.jsx"
import AdminAthletesPage from "../../modules/admin/pages/AdminAthletesPage.jsx"
import AdminWodsPage from "../../modules/admin/pages/AdminWodsPage.jsx"
import AdminPrsPage from "../../modules/admin/pages/AdminPrsPage.jsx"
import AdminStatisticsPage from "../../modules/admin/pages/AdminStatisticsPage.jsx"
import AdminPdaPage from "../../modules/admin/pages/AdminPdaPage.jsx"
import StudentDashboardPage from "../../modules/alumno/pages/StudentDashboardPage.jsx"
import StudentWodsPage from "../../modules/alumno/pages/StudentWodsPage.jsx"
import StudentPrsPage from "../../modules/alumno/pages/StudentPrsPage.jsx"
import StudentProfilePage from "../../modules/alumno/pages/StudentProfilePage.jsx"
import StudentProgressPage from "../../modules/alumno/pages/StudentProgressPage.jsx"
import StudentPdaPage from "../../modules/alumno/pages/StudentPdaPage.jsx"
import NotFoundPage from "../../modules/core/pages/NotFoundPage.jsx"

function AthleteRoute({ children }) {
  return <ProtectedRoute allowedRoles={["alumno"]}>{children}</ProtectedRoute>
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app" element={<RoleRedirect />} />

      <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin", "coach"]}><Navigate to="/admin/dashboard" replace /></ProtectedRoute>} />
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin", "coach"]}><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="/admin/atleta" element={<ProtectedRoute allowedRoles={["admin", "coach"]}><AdminAthletesPage /></ProtectedRoute>} />
      <Route path="/admin/wods" element={<ProtectedRoute allowedRoles={["admin", "coach"]}><AdminWodsPage /></ProtectedRoute>} />
      <Route path="/admin/pr" element={<ProtectedRoute allowedRoles={["admin", "coach"]}><AdminPrsPage /></ProtectedRoute>} />
      <Route path="/admin/estadisticas" element={<ProtectedRoute allowedRoles={["admin", "administrador"]}><AdminStatisticsPage /></ProtectedRoute>} />
      <Route path="/admin/pda" element={<ProtectedRoute allowedRoles={["admin", "administrador"]}><AdminPdaPage /></ProtectedRoute>} />
      <Route path="/admin/pdas" element={<ProtectedRoute allowedRoles={["admin", "administrador"]}><Navigate to="/admin/pda" replace /></ProtectedRoute>} />
      <Route path="/admin/statistics" element={<ProtectedRoute allowedRoles={["admin", "administrador"]}><Navigate to="/admin/estadisticas" replace /></ProtectedRoute>} />
      <Route path="/admin/estadistica" element={<ProtectedRoute allowedRoles={["admin", "administrador"]}><Navigate to="/admin/estadisticas" replace /></ProtectedRoute>} />
      <Route path="/admin/stats" element={<ProtectedRoute allowedRoles={["admin", "administrador"]}><Navigate to="/admin/estadisticas" replace /></ProtectedRoute>} />
      <Route path="/admin/personalrecord" element={<ProtectedRoute allowedRoles={["admin", "coach"]}><Navigate to="/admin/pr" replace /></ProtectedRoute>} />
      <Route path="/admin/registrar-rm" element={<ProtectedRoute allowedRoles={["admin", "coach"]}><Navigate to="/admin/pr" replace /></ProtectedRoute>} />
      <Route path="/registrar-rm" element={<ProtectedRoute allowedRoles={["admin", "coach"]}><Navigate to="/admin/pr" replace /></ProtectedRoute>} />
      <Route path="/admin/alumnos" element={<ProtectedRoute allowedRoles={["admin", "coach"]}><Navigate to="/admin/atleta" replace /></ProtectedRoute>} />
      <Route path="/admin/atletas" element={<ProtectedRoute allowedRoles={["admin", "coach"]}><Navigate to="/admin/atleta" replace /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin", "coach"]}><Navigate to="/admin/atleta" replace /></ProtectedRoute>} />

      <Route path="/atleta" element={<AthleteRoute><Navigate to="/atleta/dashboard" replace /></AthleteRoute>} />
      <Route path="/atleta/dashboard" element={<AthleteRoute><StudentDashboardPage /></AthleteRoute>} />
      <Route path="/atleta/wods" element={<AthleteRoute><StudentWodsPage /></AthleteRoute>} />
      <Route path="/atleta/records" element={<AthleteRoute><StudentPrsPage /></AthleteRoute>} />
      <Route path="/atleta/progreso" element={<AthleteRoute><StudentProgressPage /></AthleteRoute>} />
      <Route path="/atleta/pda" element={<AthleteRoute><StudentPdaPage /></AthleteRoute>} />
      <Route path="/atleta/perfil" element={<AthleteRoute><StudentProfilePage /></AthleteRoute>} />

      <Route path="/alumno" element={<Navigate to="/atleta/dashboard" replace />} />
      <Route path="/alumno/dashboard" element={<Navigate to="/atleta/dashboard" replace />} />
      <Route path="/alumno/wods" element={<Navigate to="/atleta/wods" replace />} />
      <Route path="/alumno/records" element={<Navigate to="/atleta/records" replace />} />
      <Route path="/alumno/personalrecord" element={<Navigate to="/atleta/records" replace />} />
      <Route path="/alumno/personalrecords" element={<Navigate to="/atleta/records" replace />} />
      <Route path="/alumno/pr" element={<Navigate to="/atleta/records" replace />} />
      <Route path="/alumno/progreso" element={<Navigate to="/atleta/progreso" replace />} />
      <Route path="/alumno/pda" element={<Navigate to="/atleta/pda" replace />} />
      <Route path="/alumno/progress" element={<Navigate to="/atleta/progreso" replace />} />
      <Route path="/alumno/nutricion" element={<Navigate to="/atleta/progreso" replace />} />
      <Route path="/atleta/nutricion" element={<Navigate to="/atleta/progreso" replace />} />
      <Route path="/alumno/perfil" element={<Navigate to="/atleta/perfil" replace />} />
      <Route path="/alumno/profile" element={<Navigate to="/atleta/perfil" replace />} />
      <Route path="/wods" element={<Navigate to="/atleta/wods" replace />} />
      <Route path="/personalrecord" element={<Navigate to="/atleta/records" replace />} />
      <Route path="/progreso" element={<Navigate to="/atleta/progreso" replace />} />
      <Route path="/progress" element={<Navigate to="/atleta/progreso" replace />} />
      <Route path="/nutricion" element={<Navigate to="/atleta/progreso" replace />} />
      <Route path="/perfil" element={<Navigate to="/atleta/perfil" replace />} />
      <Route path="/profile" element={<Navigate to="/atleta/perfil" replace />} />
      <Route path="/pda" element={<Navigate to="/atleta/pda" replace />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
