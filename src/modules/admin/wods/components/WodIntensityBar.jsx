export default function WodIntensityBar({ icon, label, value }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0))

  return (
    <div className="admin-wod-intensity-row">
      <div className="admin-wod-intensity-label">
        <span aria-hidden="true">{icon}</span>
        <strong>{label}</strong>
      </div>

      <div className="admin-wod-intensity-track" aria-hidden="true">
        <span style={{ width: `${safeValue}%` }} />
      </div>

      <b>{safeValue}%</b>
    </div>
  )
}
