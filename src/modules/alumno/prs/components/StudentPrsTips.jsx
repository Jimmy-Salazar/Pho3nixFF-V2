export default function StudentPrsTips({ copy }) {
  return (
    <article className="student-prs-card student-prs-tips">
      <p>🔥 {copy.tipsTitle}</p>
      <h2>{copy.tipsMain}</h2>
      <small>✓ {copy.tipTechnique}</small>
      <small>✓ {copy.tipRegister}</small>
      <small>✓ {copy.tipProgress}</small>
    </article>
  )
}
