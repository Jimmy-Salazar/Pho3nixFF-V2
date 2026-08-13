export default function StudentProgressLoading({ copy }) {
  return (
    <main className="student-progress-loading">
      <div>
        <span>↗</span>
        <strong>{copy.loading}</strong>
        <p>{copy.loadingText}</p>
      </div>
    </main>
  )
}
