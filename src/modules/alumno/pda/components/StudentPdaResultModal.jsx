import { useEffect, useMemo, useState } from "react"

import { parseTimeToSeconds } from "../utils/studentPdaUtils.js"

export default function StudentPdaResultModal({ copy, wod, result, saving, onSave, onClose }) {
  const [completed, setCompleted] = useState(result?.id ? Boolean(result.completado) : true)
  const [time, setTime] = useState(result?.tiempo_texto || secondsToText(result?.tiempo_segundos))
  const [reps, setReps] = useState(
    result?.repeticiones === null || result?.repeticiones === undefined ? "" : String(result.repeticiones)
  )
  const [notes, setNotes] = useState(result?.notas || "")
  const [error, setError] = useState("")

  const isTime = wod?.tipo_resultado === "tiempo"
  const resultType = useMemo(() => (isTime ? copy.time : copy.reps), [copy, isTime])

  useEffect(() => setError(""), [completed, time, reps])

  function handleSubmit(event) {
    event.preventDefault()
    setError("")

    if (!completed) {
      onSave({
        completado: false,
        tiempo_segundos: null,
        tiempo_texto: null,
        repeticiones: null,
        notas: notes,
      })
      return
    }

    if (isTime) {
      const seconds = parseTimeToSeconds(time)
      if (!seconds || seconds <= 0) {
        setError(copy.invalidTime)
        return
      }

      onSave({
        completado: true,
        tiempo_segundos: seconds,
        tiempo_texto: time.trim(),
        repeticiones: null,
        notas: notes,
      })
      return
    }

    const value = Number(reps)
    if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
      setError(copy.invalidReps)
      return
    }

    onSave({
      completado: true,
      tiempo_segundos: null,
      tiempo_texto: null,
      repeticiones: value,
      notas: notes,
    })
  }

  return (
    <div className="student-pda-modal-shell" role="dialog" aria-modal="true">
      <button type="button" className="student-pda-modal-backdrop" onClick={() => !saving && onClose()} />

      <form className="student-pda-modal" onSubmit={handleSubmit}>
        <header>
          <div>
            <span>{copy.resultTitle}</span>
            <h2>{wod?.nombre || `WOD ${wod?.numero || ""}`}</h2>
            <p>{copy.resultType}: <b>{resultType}</b></p>
          </div>

          <button type="button" onClick={onClose} disabled={saving} aria-label={copy.close}>×</button>
        </header>

        <div className="student-pda-modal-body">
          <label className="student-pda-field">
            <span>{copy.completedQuestion}</span>
            <div className="student-pda-segmented">
              <button type="button" className={completed ? "is-active" : ""} onClick={() => setCompleted(true)}>
                {copy.yes}
              </button>
              <button type="button" className={!completed ? "is-active" : ""} onClick={() => setCompleted(false)}>
                {copy.noDnf}
              </button>
            </div>
          </label>

          {completed && isTime ? (
            <label className="student-pda-field">
              <span>{copy.time}</span>
              <input value={time} onChange={(event) => setTime(event.target.value)} placeholder={copy.timePlaceholder} inputMode="numeric" />
            </label>
          ) : null}

          {completed && !isTime ? (
            <label className="student-pda-field">
              <span>{copy.reps}</span>
              <input type="number" min="0" step="1" value={reps} onChange={(event) => setReps(event.target.value)} placeholder={copy.repsPlaceholder} />
            </label>
          ) : null}

          <label className="student-pda-field">
            <span>{copy.notes}</span>
            <textarea rows="3" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={copy.notesPlaceholder} />
          </label>

          {error ? <div className="student-pda-form-error">{error}</div> : null}
        </div>

        <footer>
          <button type="button" className="student-pda-secondary" onClick={onClose} disabled={saving}>{copy.cancel}</button>
          <button type="submit" className="student-pda-primary" disabled={saving}>{saving ? copy.saving : copy.save}</button>
        </footer>
      </form>
    </div>
  )
}

function secondsToText(seconds) {
  const value = Number(seconds || 0)
  if (!value) return ""
  const minutes = Math.floor(value / 60)
  const rest = value % 60
  return `${minutes}:${String(rest).padStart(2, "0")}`
}
