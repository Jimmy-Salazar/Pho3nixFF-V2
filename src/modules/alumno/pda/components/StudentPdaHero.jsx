export default function StudentPdaHero({ copy, data }) {
  const rank = data.athleteRank
  const category = data.category?.nombre || copy.generalCategory
  const completed = Number(rank?.wods_completados || data.results?.filter((item) => item.completado).length || 0)
  const points = Number(rank?.puntos_totales || 0)

  return (
    <section className="student-pda-hero">
      <div className="student-pda-hero-copy">
        <span>{copy.activeEdition}</span>
        <h2>{data.edition?.nombre || `PDA ${data.edition?.anio || ""}`}</h2>
        <p>{data.edition?.descripcion || copy.subtitle}</p>

        <div className="student-pda-edition-state">
          <span>{String(data.edition?.estado || "borrador").toUpperCase()}</span>
          <span>{data.edition?.publicada ? copy.published : copy.draft}</span>
        </div>
      </div>

      <div className="student-pda-hero-stats">
        <Metric label={copy.category} value={category} />
        <Metric label={copy.position} value={rank?.posicion_general ? `#${rank.posicion_general}` : "—"} />
        <Metric label={copy.points} value={formatNumber(points)} />
        <Metric label={copy.completedWods} value={completed} />
      </div>
    </section>
  )
}

function Metric({ label, value }) {
  return (
    <article>
      <small>{label}</small>
      <strong>{value}</strong>
    </article>
  )
}

function formatNumber(value) {
  if (Number.isInteger(value)) return String(value)
  return value.toFixed(1)
}
