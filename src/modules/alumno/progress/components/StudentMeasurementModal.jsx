import { useEffect, useState } from "react"

export default function StudentMeasurementModal({ open, copy, profile, saving, onClose, onSave }) {
  const [draft, setDraft] = useState({ peso_kg: "", estatura_cm: "" })

  useEffect(() => {
    if (!open) return
    setDraft({
      peso_kg: profile?.peso_kg || "",
      estatura_cm: profile?.estatura_cm || "",
    })
  }, [open, profile?.estatura_cm, profile?.peso_kg])

  if (!open) return null

  return (
    <div className="student-progress-modal" role="dialog" aria-modal="true">
      <section>
        <header>
          <div>
            <p>{copy.updateMeasurements}</p>
            <h2>{copy.measurements}</h2>
            <span>{copy.updateMeasurementsText}</span>
          </div>
          <button type="button" onClick={onClose} disabled={saving}>×</button>
        </header>

        <div className="student-progress-modal-fields">
          <label>
            <span>{copy.weight}</span>
            <div><input type="number" min="0" step="0.1" value={draft.peso_kg} onChange={(event) => setDraft((current) => ({ ...current, peso_kg: event.target.value }))} /><b>kg</b></div>
          </label>
          <label>
            <span>{copy.height}</span>
            <div><input type="number" min="0" step="0.1" value={draft.estatura_cm} onChange={(event) => setDraft((current) => ({ ...current, estatura_cm: event.target.value }))} /><b>cm</b></div>
          </label>
        </div>

        <footer>
          <button type="button" onClick={onClose} disabled={saving}>{copy.cancel}</button>
          <button type="button" onClick={() => onSave(draft)} disabled={saving}>
            {saving ? copy.saving : copy.save}
          </button>
        </footer>
      </section>
    </div>
  )
}
