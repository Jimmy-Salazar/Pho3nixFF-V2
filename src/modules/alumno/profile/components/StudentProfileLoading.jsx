export default function StudentProfileLoading({ copy }) {
  return (
    <main className="student-dashboard student-dashboard-loading">
      <section className="student-loading-card"><span /><p>{copy.loading}</p><h1>PHO3NIX</h1><small>{copy.loadingText}</small></section>
    </main>
  )
}
