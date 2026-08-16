export default function StudentPrsHeading({ copy }) {
  return (
    <section className="student-prs-top-heading">
      <p>{copy.personalRecords}</p>
      <h1>{copy.records}</h1>
      <span>{copy.firstPrHint}</span>
    </section>
  )
}
