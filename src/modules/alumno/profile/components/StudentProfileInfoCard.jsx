import { formatProfileDate, formatProfileRole, getProfileAge } from "../utils/studentProfileUtils.js"

export default function StudentProfileInfoCard({ copy, profile, locale, onEdit, onChangeEmail }) {
  const age = getProfileAge(profile?.fecha_nacimiento)
  const birthDate = profile?.fecha_nacimiento
    ? `${formatProfileDate(profile.fecha_nacimiento, locale)}${age !== null ? ` · ${age} ${copy.years}` : ""}`
    : copy.noValue

  const rows = [
    { icon: "👤", label: copy.name, value: profile?.nombre || copy.noValue },
    { icon: "✉️", label: copy.email, value: profile?.email || copy.noValue },
    { icon: "📞", label: copy.phone, value: profile?.telefono || copy.noValue },
    { icon: "🪪", label: copy.idNumber, value: profile?.cedula || copy.noValue },
    { icon: "🎂", label: copy.birthDate, value: birthDate },
    { icon: "🛡️", label: copy.role, value: formatProfileRole(profile?.role, copy) },
  ]

  return (
    <article className="student-profile-card student-profile-info-card">
      <header>
        <div><p>{copy.personalInfo}</p><h2>{copy.personalInfoSubtitle}</h2></div>
        <div className="student-profile-card-actions">
          <button type="button" onClick={onChangeEmail}>{copy.changeEmail}</button>
          <button type="button" className="is-primary" onClick={onEdit}>{copy.editProfile}</button>
        </div>
      </header>

      <div className="student-profile-info-grid">
        {rows.map((row) => (
          <div key={row.label} className="student-profile-info-row">
            <span>{row.icon}</span>
            <div><small>{row.label}</small><strong>{row.value}</strong></div>
          </div>
        ))}
      </div>
    </article>
  )
}
