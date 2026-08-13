import StudentWodsLanguageSwitch from "./StudentWodsLanguageSwitch.jsx"

export default function StudentWodsHeader({ copy, profileName, initials, photoUrl, onBack, onLogout }) {
  return (
    <header className="student-wods-header">
      <button type="button" className="student-wods-back" onClick={onBack} aria-label={copy.dashboard}>
        ‹
      </button>

      <div className="student-wods-brand">
        <span className="student-wods-logo" aria-hidden="true" />
        <div>
          <strong>PHO3NIX</strong>
          <small>{copy.title}</small>
        </div>
      </div>

      <div className="student-wods-actions">
        <StudentWodsLanguageSwitch />

        <button type="button" className="student-wods-logout" onClick={onLogout}>
          <span>{copy.logout}</span>
          <b aria-hidden="true">⏻</b>
        </button>

        <div className="student-wods-avatar">
          {photoUrl ? <img src={photoUrl} alt={profileName} /> : <span>{initials}</span>}
        </div>
      </div>
    </header>
  )
}
