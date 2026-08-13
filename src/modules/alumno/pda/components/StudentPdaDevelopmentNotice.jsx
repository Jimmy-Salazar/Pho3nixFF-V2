export default function StudentPdaDevelopmentNotice({ copy }) {
  return (
    <aside className="student-pda-dev-notice" role="status">
      <span>DEV</span>
      <div>
        <strong>{copy.development}</strong>
        <p>{copy.developmentText}</p>
      </div>
    </aside>
  )
}
