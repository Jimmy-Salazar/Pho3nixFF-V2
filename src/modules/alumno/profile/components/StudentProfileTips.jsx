export default function StudentProfileTips({ copy }) {
  return (
    <article className="student-profile-tips">
      <div><p>🔥 {copy.tipsTitle}</p><h2>{copy.tipMain}</h2></div>
      <span>✓ {copy.tipTechnique}</span>
      <span>✓ {copy.tipRecovery}</span>
      <span>✓ {copy.tipProgress}</span>
    </article>
  )
}
