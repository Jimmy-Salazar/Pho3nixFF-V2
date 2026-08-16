export default function StudentPrsLoading({ copy }) {
  return (
    <main className="student-prs-page">
      <div className="student-prs-loading">
        <span>🏆</span>
        <strong>{copy.loadingPrs}</strong>
      </div>
    </main>
  )
}
