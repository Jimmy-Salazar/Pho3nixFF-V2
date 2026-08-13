export default function StudentWodsLoading({ copy }) {
  return (
    <main className="student-wods-loading">
      <section>
        <span />
        <p>PHO3NIX</p>
        <h1>{copy.loading}</h1>
        <small>{copy.loadingText}</small>
      </section>
    </main>
  )
}
