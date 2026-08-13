export default function MetricCard({ icon, label, value, footer }) {
  return (
    <article className="student-metric-card">
      <span>{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{footer}</small>
    </article>
  )
}
