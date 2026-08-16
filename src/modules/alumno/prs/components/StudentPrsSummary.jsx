import { formatLb } from "../utils/studentPrsUtils.js"

export default function StudentPrsSummary({ copy, summary, onAdd }) {
  return (
    <section className="student-prs-summary">
      <Metric icon="🏆" title={copy.registeredPrs} value={summary.total} helper={copy.totalPersonalMarks} />
      <Metric icon="🕒" title={copy.latestPr} value={formatLb(summary.latestPr?.peso_libras)} helper={summary.latestPr?.ejercicio_nombre || copy.noPr} />
      <Metric icon="⭐" title={copy.bestOverallPr} value={formatLb(summary.bestPr?.peso_libras)} helper={summary.bestPr?.ejercicio_nombre || copy.noPr} />
      <Metric icon="💪" title={copy.strongExercise} value={summary.strongest?.ejercicio_nombre || "--"} helper={formatLb(summary.strongest?.peso_libras)} />
      <button
        type="button"
        className="student-prs-add-card"
        onClick={onAdd}
      >
        <span>＋</span>
        <div>
          <small>{copy.personalRecords}</small>
          <strong>{copy.registerNewPr}</strong>
          <p>{copy.firstPrHint}</p>
        </div>
      </button>
    </section>
  )
}

function Metric({ icon, title, value, helper }) {
  return (
    <article>
      <span>{icon}</span>
      <div>
        <small>{title}</small>
        <strong>{value}</strong>
        <p>{helper}</p>
      </div>
    </article>
  )
}
