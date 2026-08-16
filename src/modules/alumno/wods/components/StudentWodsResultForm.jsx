import { useEffect, useMemo, useState } from "react"

import {
  parseTimeToSeconds,
  secondsToTime,
  shouldUseTimeResult,
} from "../utils/studentWodsUtils.js"

export default function StudentWodsResultForm({
  copy,
  wod,
  saving,
  initialResult,
  mode = "create",
  onSave,
  onCancel,
}) {
  const isTime = useMemo(() => shouldUseTimeResult(wod), [wod])
  const isEdit = mode === "edit"

  const [modalidad, setModalidad] = useState(initialResult?.modalidad || "RX")
  const [timeValue, setTimeValue] = useState(getInitialTime(initialResult))
  const [repeticiones, setRepeticiones] = useState(getInitialReps(initialResult))
  const [notas, setNotas] = useState(initialResult?.notas || initialResult?.observacion || "")
  const [formError, setFormError] = useState("")

  useEffect(() => {
    setModalidad(initialResult?.modalidad || "RX")
    setTimeValue(getInitialTime(initialResult))
    setRepeticiones(getInitialReps(initialResult))
    setNotas(initialResult?.notas || initialResult?.observacion || "")
    setFormError("")
  }, [initialResult?.id, isTime])

  function handleSubmit(event) {
    event.preventDefault()

    const normalizedTime = String(timeValue || "").trim()
    const parsedTime = isTime ? parseTimeToSeconds(normalizedTime) : null

    if (isTime && normalizedTime && parsedTime === null) {
      setFormError(copy.invalidResult)
      return
    }

    const payload = {
      id: initialResult?.id || null,
      modalidad,
      tiempo_segundos: parsedTime,
      tiempo_texto: isTime ? normalizedTime : "",
      repeticiones: Number(repeticiones || 0),
      notas,
    }

    if (!payload.tiempo_segundos && !payload.repeticiones) {
      setFormError(copy.invalidResult)
      return
    }

    onSave?.(payload)
  }

  if (!wod?.id) return null

  return (
    <section className="student-wods-form-shell">
      <div className="student-wods-form-backdrop" onClick={onCancel} />
      <article className="student-wods-form-card">
        <header>
          <div>
            <p>{isEdit ? copy.editResult : copy.resultForm}</p>
            <h2>{wod?.nombre || copy.todayWod}</h2>
            <small>{copy.resultFormSubtitle}</small>
          </div>
          <button type="button" onClick={onCancel}>×</button>
        </header>

        <form onSubmit={handleSubmit}>
          <label>
            <span>{copy.resultMode}</span>
            <select value={modalidad} onChange={(event) => setModalidad(event.target.value)} disabled={saving}>
              <option value="RX">{copy.rx}</option>
              <option value="SC">{copy.scaled}</option>
              <option value="PR">{copy.beginner}</option>
            </select>
          </label>

          {isTime ? (
            <label>
              <span>{copy.time}</span>
              <input
                value={timeValue}
                onChange={(event) => setTimeValue(event.target.value)}
                placeholder="14:32"
                disabled={saving}
              />
            </label>
          ) : (
            <label>
              <span>{copy.reps}</span>
              <input
                type="number"
                min="0"
                value={repeticiones}
                onChange={(event) => setRepeticiones(event.target.value)}
                disabled={saving}
                placeholder="120"
              />
            </label>
          )}

          {isTime ? (
            <label>
              <span>{copy.incompleteReps}</span>
              <input
                type="number"
                min="0"
                value={repeticiones}
                onChange={(event) => setRepeticiones(event.target.value)}
                disabled={saving}
                placeholder="120"
              />
            </label>
          ) : null}

          <label className="is-full">
            <span>{copy.notes}</span>
            <textarea
              value={notas}
              onChange={(event) => setNotas(event.target.value)}
              placeholder={copy.notesPlaceholder}
              disabled={saving}
            />
          </label>

          {formError ? <p className="student-wods-form-error">{formError}</p> : null}

          <button type="submit" disabled={saving}>
            {saving ? copy.saving : isEdit ? copy.update : copy.save}
          </button>
        </form>
      </article>
    </section>
  )
}

function getInitialTime(result) {
  if (result?.tiempo_texto) return result.tiempo_texto
  if (Number(result?.tiempo_segundos || 0) > 0) return secondsToTime(Number(result.tiempo_segundos || 0))
  return ""
}

function getInitialReps(result) {
  if (result?.repeticiones !== null && result?.repeticiones !== undefined) {
    return Number(result.repeticiones || 0)
  }

  return ""
}
