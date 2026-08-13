export default function LoadingState({ copy }) {
  return (
    <main className="student-dashboard student-dashboard-loading">
      <section className="student-loading-card">
        <span aria-hidden="true" />
        <p>PHO3NIX</p>
        <h1>{copy.loading}</h1>
        <small>{copy.loadingText}</small>
      </section>
    </main>
  )
}
