import { formatProfileDate } from "../utils/studentProfileUtils.js"

export default function StudentProfileMembershipCard({ copy, membership, membershipInfo, membershipLabel, locale }) {
  const progress = Math.max(0, Math.min(100, Number(membershipLabel.progress || 0)))

  return (
    <article className={`student-profile-card student-profile-membership is-${membershipLabel.status}`}>
      <header><div><p>👑 {copy.membershipTitle}</p><h2>{membershipLabel.title}</h2></div></header>

      <div className="student-profile-membership-main">
        <div className="student-profile-membership-ring" style={{ "--profile-progress": `${progress}%` }}>
          <span>{membershipLabel.icon || "✓"}</span>
        </div>
        <div><strong>{membershipLabel.title}</strong><p>{membershipLabel.subtitle}</p></div>
      </div>

      <div className="student-profile-membership-dates">
        <div><small>{copy.membershipStart}</small><strong>{formatProfileDate(membership?.fecha_inicio, locale)}</strong></div>
        <div><small>{copy.membershipEnd}</small><strong>{formatProfileDate(membership?.fecha_fin, locale)}</strong></div>
      </div>

      <div className="student-profile-progress-row">
        <span><small>{copy.membershipProgress}</small><strong>{membershipInfo?.daysLeft ?? "—"}</strong></span>
        <div><i style={{ width: `${progress}%` }} /></div>
      </div>
    </article>
  )
}
