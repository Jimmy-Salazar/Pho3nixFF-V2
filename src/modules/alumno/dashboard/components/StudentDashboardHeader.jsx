import StudentLanguageSwitch from "./StudentLanguageSwitch.jsx"

export default function StudentDashboardHeader({ profileName, initials, photoUrl, onLogout, copy }) {
  return (
    <header className="student-dashboard-header">
      <div className="student-dashboard-brand">
        <span className="student-dashboard-logo" aria-hidden="true" />
        <div>
          <strong>PHO3NIX</strong>
          <small>FUNCTIONAL FITNESS</small>
        </div>
      </div>

      <div className="student-dashboard-profile">
        <StudentLanguageSwitch compact />

        <button type="button" className="student-dashboard-logout" onClick={onLogout}>
          <span className="student-logout-text">{copy.logout}</span>
          <span className="student-logout-icon" aria-hidden="true">⏻</span>
        </button>

        <div className="student-dashboard-avatar">
          {photoUrl ? <img src={photoUrl} alt={profileName} /> : <span>{initials}</span>}
        </div>
      </div>
    </header>
  )
}
