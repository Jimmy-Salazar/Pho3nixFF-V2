export default function WodCard({ copy, wod, navigate }) {
  return (
    <article className="student-wod-card">
      <div className="student-wod-visual">
        <span>🏋️</span>
      </div>

      <div className="student-wod-content">
        <small>{copy.wodSubtitle}</small>
        <h2>{wod?.nombre || copy.noWod}</h2>
        <p>{wod?.descripcion || copy.noWodText}</p>

        <div className="student-wod-actions">
          <button type="button" disabled={!wod} onClick={() => navigate("/alumno/wods")}>
            {copy.viewWod} →
          </button>
          <button type="button" onClick={() => navigate("/alumno/wods")}>
            {copy.history}
          </button>
        </div>
      </div>
    </article>
  )
}
