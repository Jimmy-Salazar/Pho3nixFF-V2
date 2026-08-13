import WodIntensityBar from "./WodIntensityBar.jsx"

export default function WodCaloriesPanel({ copy, estimate }) {
  const metabolicBlocks = Array.from({ length: 12 }, (_, index) => index + 1)
  const activeBlocks = Math.round((Number(estimate?.cargaMetabolica || 0) / 100) * 12)
  const sourceLabel =
    estimate?.source === "gemini"
      ? copy.aiEstimate
      : estimate?.source === "stored"
        ? copy.storedEstimate
        : copy.localEstimate

  return (
    <aside className="admin-wod-calories-panel">
      <header>
        <span aria-hidden="true">🔥</span>
        <div>
          <small>{sourceLabel}</small>
          <h3>{copy.caloriesTitle}</h3>
        </div>
      </header>

      <section className="admin-wod-calories-main">
        <small>{copy.calories}</small>
        <div>
          <strong>{estimate?.caloriasMin || 0} - {estimate?.caloriasMax || 0}</strong>
          <span>kcal</span>
        </div>
        <p>{estimate?.nota || "—"}</p>
      </section>

      <section className="admin-wod-calories-summary">
        <div>
          <small>{copy.intensity}</small>
          <strong>{estimate?.intensidad || "—"}</strong>
          <span className="admin-wod-intensity-dots" aria-hidden="true">
            {Array.from({ length: 5 }, (_, index) => (
              <i key={index} className={index < Number(estimate?.intensidadPuntos || 0) ? "is-active" : ""} />
            ))}
          </span>
        </div>
        <div>
          <small>{copy.duration}</small>
          <strong>◷ {estimate?.duracion || "—"}</strong>
        </div>
      </section>

      <section className="admin-wod-metabolic-load">
        <small>{copy.metabolicLoad}</small>
        <div aria-hidden="true">
          {metabolicBlocks.map((block) => (
            <span key={block} className={block <= activeBlocks ? "is-active" : ""} />
          ))}
        </div>
        <p><span>{copy.low}</span><span>{copy.maximum}</span></p>
      </section>

      <section className="admin-wod-effort-distribution">
        <small>{copy.effortDistribution}</small>
        <WodIntensityBar icon="🏃" label={copy.cardio} value={estimate?.cardio} />
        <WodIntensityBar icon="💪" label={copy.strength} value={estimate?.fuerza} />
        <WodIntensityBar icon="◉" label={copy.gymnastics} value={estimate?.gimnasia} />
      </section>

      {estimate?.tip ? <footer>{estimate.tip}</footer> : null}
    </aside>
  )
}
