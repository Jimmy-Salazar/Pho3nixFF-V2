import { formatPdaDate, getWodPublicationLabel } from "../utils/studentPdaUtils.js"

export default function StudentPdaWodDetailModal({ copy, locale, wod, onClose }) {
  if (!wod) return null

  return (
    <div className="student-pda-modal-shell" role="dialog" aria-modal="true">
      <button type="button" className="student-pda-modal-backdrop" onClick={onClose} />

      <section className="student-pda-modal student-pda-detail-modal">
        <header>
          <div>
            <span>{copy.wodDetail}</span>
            <h2>WOD {String(wod.numero || "").padStart(2, "0")} · {wod.nombre}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={copy.close}>×</button>
        </header>

        <div className="student-pda-modal-body">
          <div className="student-pda-detail-meta">
            <Metric label={copy.date} value={formatPdaDate(wod.fecha, locale)} />
            <Metric label={copy.resultMode} value={wod.tipo_resultado === "tiempo" ? copy.time : copy.reps} />
            <Metric label={copy.modality} value={String(wod.modalidad || "single").toUpperCase()} />
            <Metric label={copy.status} value={getWodPublicationLabel(wod, copy)} />
          </div>

          <div className="student-pda-detail-description">
            {String(wod.descripcion || "PHO3NIX PDA")
              .split("\n")
              .map((line, index) => <p key={`${index}-${line}`}>{line || "\u00a0"}</p>)}
          </div>
        </div>
      </section>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <article>
      <small>{label}</small>
      <strong>{value || "—"}</strong>
    </article>
  )
}
