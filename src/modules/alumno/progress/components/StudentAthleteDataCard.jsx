import { formatDate, numberText } from "../utils/studentProgressUtils.js"

export default function StudentAthleteDataCard({ copy, athlete, profile, locale, onEdit }) {
  const initial = String(athlete?.nombre || "A").trim().charAt(0).toUpperCase() || "A"

  return (
    <article className="student-progress-card student-athlete-data">
      <header>
        <div>
          <p>◉ {copy.athleteData}</p>
          <h2>{copy.measurements}</h2>
        </div>
        <button type="button" onClick={onEdit}>{copy.edit}</button>
      </header>

      <div className="student-athlete-identity">
        {athlete?.foto_url
          ? <img src={athlete.foto_url} alt={athlete?.nombre || copy.athlete} />
          : <span>{initial}</span>}
        <div>
          <strong>{athlete?.nombre || copy.athlete}</strong>
          <small>
            {athlete?.edad ? `${athlete.edad} ${copy.years}` : copy.notRegistered}
            {athlete?.sexo ? ` · ${athlete.sexo}` : ""}
          </small>
          <small>{copy.birthDate}: {athlete?.fecha_nacimiento ? formatDate(athlete.fecha_nacimiento, locale) : copy.notRegistered}</small>
        </div>
      </div>

      <div className="student-athlete-measurements">
        <div><small>{copy.weight}</small><strong>{numberText(profile?.peso_kg)} <b>kg</b></strong></div>
        <div><small>{copy.height}</small><strong>{numberText(profile?.estatura_cm)} <b>cm</b></strong></div>
      </div>
    </article>
  )
}
