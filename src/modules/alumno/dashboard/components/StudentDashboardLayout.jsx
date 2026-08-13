import StudentMobileNav from "./StudentMobileNav.jsx"
import StudentSidebar from "./StudentSidebar.jsx"

export default function StudentDashboardLayout({ copy, membership, navigate, onLogout, children }) {
  return (
    <main className="student-dashboard">
      <StudentSidebar copy={copy} membership={membership} navigate={navigate} onLogout={onLogout} />
      {children}
      <StudentMobileNav copy={copy} navigate={navigate} />
    </main>
  )
}
