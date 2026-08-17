
import { useEffect, useRef, useState } from "react"

function buildDraft(profile) {
  return {
    peso_kg: profile?.peso_kg || "",
    estatura_cm: profile?.estatura_cm || "",
    cintura_cm: profile?.cintura_cm || "",
    horas_sueno: profile?.horas_sueno ?? "",
    nivel_energia: profile?.nivel_energia ?? "",
    lesiones: profile?.lesiones || "",
    observaciones: profile?.observaciones || "",
  }
}

function StudentMeasurementDialog({ copy, profile, saving, onClose, onSave }) {
  const [draft, setDraft] = useState(() => buildDraft(profile))
  const dialogRef = useRef(null)
  const firstInputRef = useRef(null)
  const restoreFocusRef = useRef(null)
  const savingRef = useRef(saving)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    savingRef.current = saving
  }, [saving])

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    restoreFocusRef.current = document.activeElement
    const focusTimer = window.setTimeout(() => firstInputRef.current?.focus(), 0)

    function handleKeyDown(event) {
      if (event.key === "Escape" && !savingRef.current) {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== "Tab") return
      const focusable = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable?.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener("keydown", handleKeyDown)
      const previous = restoreFocusRef.current
      if (previous && typeof previous.focus === "function" && previous.isConnected) {
        window.setTimeout(() => previous.focus(), 0)
      }
    }
  }, [])

  function setField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  return (
    <div
      className="student-progress-modal"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose()
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-measurements-title"
        aria-describedby="student-measurements-description"
      >
        <header>
          <div>
            <p>{copy.updateMeasurements}</p>
            <h2 id="student-measurements-title">{copy.measurements}</h2>
            <span id="student-measurements-description">{copy.updateMeasurementsText}</span>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label={copy.close}>×</button>
        </header>

        <div className="student-progress-modal-fields">
          <label>
            <span>{copy.weight}</span>
            <div>
              <input
                ref={firstInputRef}
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={draft.peso_kg}
                onChange={(event) => setField("peso_kg", event.target.value)}
              />
              <b>kg</b>
            </div>
          </label>

          <label>
            <span>{copy.height}</span>
            <div>
              <input
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={draft.estatura_cm}
                onChange={(event) => setField("estatura_cm", event.target.value)}
              />
              <b>cm</b>
            </div>
          </label>

          <label>
            <span>{copy.waist} · {copy.optional}</span>
            <div>
              <input
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={draft.cintura_cm}
                onChange={(event) => setField("cintura_cm", event.target.value)}
              />
              <b>cm</b>
            </div>
          </label>

          <label>
            <span>{copy.sleepHours} · {copy.optional}</span>
            <div>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                inputMode="decimal"
                value={draft.horas_sueno}
                onChange={(event) => setField("horas_sueno", event.target.value)}
              />
              <b>h</b>
            </div>
          </label>

          <label>
            <span>{copy.energyLevel} · {copy.optional}</span>
            <div>
              <input
                type="number"
                min="1"
                max="5"
                step="1"
                inputMode="numeric"
                value={draft.nivel_energia}
                onChange={(event) => setField("nivel_energia", event.target.value)}
              />
              <b>/5</b>
            </div>
            <small className="student-progress-field-help">{copy.energyHint}</small>
          </label>

          <label className="student-progress-modal-wide">
            <span>{copy.injuriesLimitations} · {copy.optional}</span>
            <textarea
              rows="3"
              maxLength="1000"
              value={draft.lesiones}
              onChange={(event) => setField("lesiones", event.target.value)}
            />
          </label>

          <label className="student-progress-modal-wide">
            <span>{copy.observations} · {copy.optional}</span>
            <textarea
              rows="3"
              maxLength="1000"
              value={draft.observaciones}
              onChange={(event) => setField("observaciones", event.target.value)}
            />
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

export default function StudentMeasurementModal({ open, copy, profile, saving, onClose, onSave }) {
  if (!open) return null

  return (
    <StudentMeasurementDialog
      copy={copy}
      profile={profile}
      saving={saving}
      onClose={onClose}
      onSave={onSave}
    />
  )
}
