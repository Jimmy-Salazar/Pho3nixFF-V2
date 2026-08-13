import {
  formatDateLong,
  formatModalidad,
  formatModoRanking,
  getRegisterAvailability,
  getRegisterButtonLabel,
} from "../utils/studentWodsUtils.js"

export default function StudentWodsHero({
  copy,
  locale,
  wod,
  loading,
  registered,
  onOpenRegister,
}) {
  const availability = getRegisterAvailability(wod)
  const canRegister = Boolean(wod?.id) && !registered && availability.canRegister
  const buttonLabel = getRegisterButtonLabel({
    copy,
    wod,
    loading,
    hasRegistered: registered,
    availability,
  })

  return (
    <section className="student-wods-hero">
      <div className="student-wods-hero-bg" />
      <div className="student-wods-hero-content">
        <p className="student-wods-kicker">🔥 {copy.todayWod}</p>
        <p className="student-wods-date">{loading ? "..." : formatDateLong(wod?.fecha, locale)}</p>

        <h1>{loading ? "..." : wod?.nombre || copy.noWod}</h1>

        <div className="student-wods-badges">
          <span>{formatModoRanking(wod?.modo_ranking, copy)}</span>
          <span>{formatModalidad(wod?.modalidad)}</span>
        </div>

        <p className="student-wods-description">
          {loading ? copy.loadingText : wod?.descripcion || copy.noWodText}
        </p>

        <small>{copy.bestVersion}</small>

        <button
          type="button"
          className={registered ? "is-saved" : ""}
          disabled={!canRegister}
          onClick={onOpenRegister}
        >
          {registered ? "✓" : canRegister ? "✎" : "⏱"} {buttonLabel}
        </button>
      </div>
    </section>
  )
}
