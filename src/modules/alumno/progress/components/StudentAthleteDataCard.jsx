import {
  formatDate,
  formatSex,
  numberText,
} from "../utils/studentProgressUtils.js"

export default function StudentAthleteDataCard({ copy, athlete, profile, locale, onEdit }) {
  const initial = String(athlete?.nombre || "A").trim().charAt(0).toUpperCase() || "A"
  const hasOptionalMetrics = (
    Number(profile?.cintura_cm) > 0
    || profile?.horas_sueno !== ""
    || profile?.nivel_energia !== ""
  )

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
            {athlete?.sexo ? ` · ${formatSex(athlete.sexo, copy)}` : ""}
          </small>
          <small>{copy.birthDate}: {athlete?.fecha_nacimiento ? formatDate(athlete.fecha_nacimiento, locale) : copy.notRegistered}</small>
        </div>
      </div>

      <div className="student-athlete-measurements">
        <div><small>{copy.weight}</small><strong>{numberText(profile?.peso_kg, 1, locale)} <b>kg</b></strong></div>
        <div><small>{copy.height}</small><strong>{numberText(profile?.estatura_cm, 1, locale)} <b>cm</b></strong></div>
        {hasOptionalMetrics ? (
          <>
            {Number(profile?.cintura_cm) > 0 ? (
              <div><small>{copy.waist}</small><strong>{numberText(profile.cintura_cm, 1, locale)} <b>cm</b></strong></div>
            ) : null}
            {profile?.horas_sueno !== "" && profile?.horas_sueno !== null && profile?.horas_sueno !== undefined ? (
              <div><small>{copy.sleepHours}</small><strong>{numberText(profile.horas_sueno, 1, locale)} <b>h</b></strong></div>
            ) : null}
            {profile?.nivel_energia !== "" && profile?.nivel_energia !== null && profile?.nivel_energia !== undefined ? (
              <div><small>{copy.energyLevel}</small><strong>{numberText(profile.nivel_energia, 0, locale)} <b>/5</b></strong></div>
            ) : null}
          </>
        ) : null}
      </div>
    </article>
  )
}
