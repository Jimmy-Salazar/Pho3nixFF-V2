import { useEffect, useMemo, useRef, useState } from "react"

import WodCaloriesPanel from "../../wods/components/WodCaloriesPanel.jsx"
import { estimateWodWithAi } from "../../wods/services/estimateWodWithAi.js"
import { estimateWodCalories } from "../../wods/utils/estimateCalories.js"
import {
  formatSeconds,
  getDefaultEditionDates,
  getPdaWodTypeLabel,
  inferPdaWodType,
  parseTimeToSeconds,
} from "../utils/adminPdaUtils.js"

export function PdaEditionModal({ copy, edition, saving, onClose, onSave }) {
  const defaultYear = edition?.anio || new Date().getFullYear()
  const defaultDates = getDefaultEditionDates(defaultYear)
  const [form, setForm] = useState({
    anio: defaultYear,
    nombre: edition?.nombre || `PDA ${defaultYear}`,
    descripcion: edition?.descripcion || "",
    fecha_inicio: edition?.fecha_inicio || defaultDates.fecha_inicio,
    fecha_fin: edition?.fecha_fin || defaultDates.fecha_fin,
  })
  const [error, setError] = useState("")

  useEffect(() => {
    if (edition) return
    const dates = getDefaultEditionDates(form.anio)
    setForm((current) => ({
      ...current,
      nombre: current.nombre.match(/^PDA \d{4}$/) ? `PDA ${form.anio}` : current.nombre,
      ...dates,
    }))
  }, [form.anio, edition])

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function submit(event) {
    event.preventDefault()
    setError("")

    const year = Number(form.anio)
    const start = String(form.fecha_inicio || "")
    const end = String(form.fecha_fin || "")

    if (!form.nombre.trim()) {
      setError(copy.name)
      return
    }

    if (!start.startsWith(`${year}-12-`) || !end.startsWith(`${year}-12-`) || end < start) {
      setError(copy.invalidDates)
      return
    }

    onSave({
      anio: year,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      fecha_inicio: start,
      fecha_fin: end,
    })
  }

  return (
    <PdaModalShell title={edition ? copy.editEdition : copy.createEdition} onClose={onClose} busy={saving}>
      <form className="admin-pda-form" onSubmit={submit}>
        <div className="admin-pda-form-grid is-two">
          <label>
            <span>{copy.year}</span>
            <input type="number" min="2020" max="2100" value={form.anio} onChange={(event) => update("anio", Number(event.target.value))} />
          </label>
          <label>
            <span>{copy.name}</span>
            <input value={form.nombre} onChange={(event) => update("nombre", event.target.value)} />
          </label>
        </div>

        <label>
          <span>{copy.description}</span>
          <textarea rows="4" value={form.descripcion} onChange={(event) => update("descripcion", event.target.value)} />
        </label>

        <div className="admin-pda-form-grid is-two">
          <label>
            <span>{copy.startDate}</span>
            <input type="date" value={form.fecha_inicio} onChange={(event) => update("fecha_inicio", event.target.value)} />
          </label>
          <label>
            <span>{copy.endDate}</span>
            <input type="date" value={form.fecha_fin} onChange={(event) => update("fecha_fin", event.target.value)} />
          </label>
        </div>

        {error ? <p className="admin-pda-form-error">{error}</p> : null}
        <ModalActions copy={copy} saving={saving} onClose={onClose} />
      </form>
    </PdaModalShell>
  )
}

export function PdaWodModal({ copy, locale, edition, wod, saving, onClose, onSave }) {
  const [form, setForm] = useState({
    numero: wod?.numero || "",
    nombre: wod?.nombre || "",
    descripcion: wod?.descripcion || "",
    tipo_wod: wod?.tipo_wod || "",
    tipo_resultado: wod?.tipo_resultado || "tiempo",
    modalidad: wod?.modalidad || "single",
    fecha: wod?.fecha || "",
  })
  const [estimateOverride, setEstimateOverride] = useState(
    wod ? buildStoredPdaEstimate(wod, locale) : null
  )
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState("")
  const [error, setError] = useState("")

  const rankingMode = form.tipo_resultado === "tiempo" ? "menor_es_mejor" : "mayor_es_mejor"
  const analysisDescription = useMemo(() => buildPdaAnalysisDescription(form, copy), [form, copy])
  const localEstimate = useMemo(
    () => estimateWodCalories({
      nombre: form.nombre,
      descripcion: analysisDescription,
      modalidad: form.modalidad,
      modoRanking: rankingMode,
      locale,
    }),
    [analysisDescription, form.modalidad, form.nombre, locale, rankingMode]
  )
  const estimate = estimateOverride || localEstimate

  function update(field, value, affectsEstimate = false) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(affectsEstimate && field !== "tipo_wod" ? { tipo_wod: "" } : {}),
    }))
    if (affectsEstimate) {
      setEstimateOverride(null)
      setAiError("")
    }
  }

  async function handleAiEstimate() {
    if (!form.descripcion.trim()) {
      setAiError(copy.requiredDescription)
      return
    }

    try {
      setAiLoading(true)
      setAiError("")
      const result = await estimateWodWithAi({
        nombre: form.nombre,
        descripcion: analysisDescription,
        modalidad: form.modalidad,
        modoRanking: rankingMode,
        locale,
      })
      const inferredType = inferPdaWodType({
        description: `${form.nombre}\n${form.descripcion}`,
        resultType: form.tipo_resultado,
        estimate: result,
      })

      setForm((current) => ({ ...current, tipo_wod: inferredType }))
      setEstimateOverride(result)

      if (result.fallback || result.source !== "gemini") {
        setAiError(copy.localFallbackNote)
      }
    } catch (analysisError) {
      setAiError(analysisError?.message || copy.operationError)
    } finally {
      setAiLoading(false)
    }
  }

  function submit(event) {
    event.preventDefault()
    setError("")

    const number = Number(form.numero)
    if (!Number.isInteger(number) || number < 1 || number > 15 || !form.nombre.trim() || !form.descripcion.trim()) {
      setError(copy.operationError)
      return
    }

    if (form.fecha && (form.fecha < edition.fecha_inicio || form.fecha > edition.fecha_fin)) {
      setError(copy.dateOutsideEdition)
      return
    }

    if (!form.tipo_wod) {
      setError(copy.analyzeBeforeSave)
      return
    }

    onSave({
      pda_edicion_id: edition.id,
      numero: number,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      tipo_wod: form.tipo_wod,
      tipo_resultado: form.tipo_resultado,
      modo_ranking: rankingMode,
      modalidad: form.modalidad,
      fecha: form.fecha || null,
      time_cap_segundos: null,
      intensidad_estimada: estimate?.intensidad || null,
      duracion_estimada: estimate?.duracion || null,
      calorias_min: Number.isFinite(Number(estimate?.caloriasMin)) ? Number(estimate.caloriasMin) : null,
      calorias_max: Number.isFinite(Number(estimate?.caloriasMax)) ? Number(estimate.caloriasMax) : null,
      calorias_nota: estimate?.nota || null,
      publicado: wod?.publicado || false,
      activo: wod?.activo || false,
      fecha_publicacion: wod?.fecha_publicacion || null,
    })
  }

  return (
    <PdaModalShell title={wod ? copy.editWod : copy.addWod} onClose={onClose} busy={saving || aiLoading} wide>
      <form className="admin-pda-form admin-pda-wod-editor" onSubmit={submit}>
        <section className="admin-pda-wod-editor-fields">
          <div className="admin-pda-form-grid is-three">
            <label>
              <span>{copy.wodNumber}</span>
              <input type="number" min="1" max="15" value={form.numero} onChange={(event) => update("numero", event.target.value)} />
            </label>
            <label className="is-span-two">
              <span>{copy.wodName}</span>
              <input value={form.nombre} onChange={(event) => update("nombre", event.target.value, true)} />
            </label>
          </div>

          <label>
            <span>{copy.description}</span>
            <textarea rows="7" value={form.descripcion} onChange={(event) => update("descripcion", event.target.value, true)} />
          </label>

          <div className="admin-pda-form-grid is-three">
            <label>
              <span>{copy.resultType}</span>
              <select value={form.tipo_resultado} onChange={(event) => update("tipo_resultado", event.target.value, true)}>
                <option value="tiempo">{copy.time}</option>
                <option value="repeticiones">{copy.repetitions}</option>
              </select>
            </label>
            <label>
              <span>{copy.modality}</span>
              <select value={form.modalidad} onChange={(event) => update("modalidad", event.target.value, true)}>
                <option value="single">{copy.single}</option>
                <option value="duo">{copy.duo}</option>
                <option value="trio">{copy.trio}</option>
              </select>
            </label>
            <label>
              <span>{copy.wodDate}</span>
              <input type="date" min={edition.fecha_inicio} max={edition.fecha_fin} value={form.fecha} onChange={(event) => update("fecha", event.target.value)} />
            </label>
          </div>

          <div className="admin-pda-ai-type-field">
            <span>{copy.aiWodType}</span>
            <div className={form.tipo_wod ? "has-value" : ""}>
              <strong>{form.tipo_wod ? getPdaWodTypeLabel(form.tipo_wod, copy) : copy.pendingAiType}</strong>
              <small>{copy.aiWodTypeHelp}</small>
            </div>
          </div>

          <section className="admin-pda-ai-review">
            <div>
              <strong>{copy.smartAnalysis}</strong>
              <p>{copy.smartAnalysisHelp}</p>
            </div>
            <button type="button" onClick={handleAiEstimate} disabled={saving || aiLoading || !form.descripcion.trim()}>
              <span aria-hidden="true">✦</span>
              {aiLoading ? copy.analyzingAi : copy.analyzeAi}
            </button>
          </section>

          {aiError ? <p className="admin-pda-ai-note">{aiError}</p> : null}
          {estimate?.source === "gemini" && form.tipo_wod ? (
            <p className="admin-pda-ai-note is-success">
              {copy.aiDetectedType} <strong>{getPdaWodTypeLabel(form.tipo_wod, copy)}</strong>. {copy.aiApplied}
            </p>
          ) : null}
          {error ? <p className="admin-pda-form-error">{error}</p> : null}

          <ModalActions copy={copy} saving={saving || aiLoading} onClose={onClose} />
        </section>

        <WodCaloriesPanel copy={copy} estimate={estimate} />
      </form>
    </PdaModalShell>
  )
}

function buildPdaAnalysisDescription(form, copy) {
  const details = `${copy.resultType}: ${getPdaResultTypeLabel(form.tipo_resultado, copy)}`
  return [form.descripcion?.trim(), details].filter(Boolean).join("\n\n")
}

function getPdaResultTypeLabel(type, copy) {
  if (type === "repeticiones") return copy.repetitions
  return copy.time
}

function buildStoredPdaEstimate(wod, locale) {
  const local = estimateWodCalories({
    nombre: wod?.nombre || "",
    descripcion: wod?.descripcion || "",
    modalidad: wod?.modalidad || "single",
    modoRanking: wod?.modo_ranking || "menor_es_mejor",
    locale,
  })

  const hasStored = Number.isFinite(Number(wod?.calorias_min)) || Number.isFinite(Number(wod?.calorias_max))
  if (!hasStored) return local

  return {
    ...local,
    caloriasMin: Number(wod?.calorias_min) || local.caloriasMin,
    caloriasMax: Number(wod?.calorias_max) || local.caloriasMax,
    intensidad: wod?.intensidad_estimada || local.intensidad,
    duracion: wod?.duracion_estimada || local.duracion,
    nota: wod?.calorias_nota || local.nota,
    source: "stored",
  }
}

export function PdaResultModal({ copy, athlete, wod, result, saving, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    estado_resultado: result?.estado_resultado || "valido",
    completado: result?.completado ?? true,
    tiempo_texto: result?.tiempo_texto || (result?.tiempo_segundos ? formatSeconds(result.tiempo_segundos) : ""),
    repeticiones: result?.repeticiones ?? "",
    tie_break: result?.tie_break_segundos ? formatSeconds(result.tie_break_segundos) : "",
    notas: result?.notas || "",
  })
  const [error, setError] = useState("")
  const isValid = form.estado_resultado === "valido"
  const isDnf = form.estado_resultado === "dnf"

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function submit(event) {
    event.preventDefault()
    setError("")

    const completed = isValid && Boolean(form.completado)
    const timeSeconds = wod.tipo_resultado === "tiempo" && completed
      ? parseTimeToSeconds(form.tiempo_texto)
      : null
    const tieBreakSeconds = parseTimeToSeconds(form.tie_break)

    if (wod.tipo_resultado === "tiempo" && completed && !timeSeconds) {
      setError(copy.timeRequired)
      return
    }
    if (wod.tipo_resultado === "repeticiones" && completed && form.repeticiones === "") {
      setError(copy.repsRequired)
      return
    }
    onSave({
      id: result?.id,
      pda_wod_id: wod.id,
      usuario_id: athlete.id,
      estado_resultado: form.estado_resultado,
      completado: completed,
      tiempo_segundos: timeSeconds,
      tiempo_texto: timeSeconds ? formatSeconds(timeSeconds) : null,
      repeticiones: form.repeticiones === "" ? null : Number(form.repeticiones),
      carga_libras: null,
      tie_break_segundos: tieBreakSeconds,
      notas: form.notas.trim() || null,
    })
  }

  return (
    <PdaModalShell title={result ? copy.editResult : copy.registerResult} onClose={onClose} busy={saving}>
      <form className="admin-pda-form" onSubmit={submit}>
        <div className="admin-pda-result-athlete">
          <strong>{athlete?.nombre || athlete?.email}</strong>
          <span>{copy.activeAthlete}</span>
          <small>{wod.nombre}</small>
        </div>

        <label>
          <span>{copy.resultStatus}</span>
          <select value={form.estado_resultado} onChange={(event) => update("estado_resultado", event.target.value)}>
            <option value="valido">{copy.valid}</option>
            <option value="dnf">{copy.dnf}</option>
            <option value="dns">{copy.dns}</option>
            <option value="dq">{copy.dq}</option>
            <option value="anulado">{copy.voided}</option>
          </select>
        </label>

        {isValid ? (
          <label className="admin-pda-check-field">
            <input type="checkbox" checked={form.completado} onChange={(event) => update("completado", event.target.checked)} />
            <span>{copy.completed}</span>
          </label>
        ) : null}

        {wod.tipo_resultado === "tiempo" && form.completado && isValid ? (
          <label>
            <span>{copy.timeSeconds}</span>
            <input value={form.tiempo_texto} onChange={(event) => update("tiempo_texto", event.target.value)} placeholder={copy.timePlaceholder} />
          </label>
        ) : null}

        {((wod.tipo_resultado === "repeticiones" && (isValid || isDnf))
          || (wod.tipo_resultado === "tiempo" && ((isValid && !form.completado) || isDnf))) ? (
          <label>
            <span>{copy.repsCompleted}</span>
            <input type="number" min="0" value={form.repeticiones} onChange={(event) => update("repeticiones", event.target.value)} />
          </label>
        ) : null}

        {isValid || isDnf ? (
          <label>
            <span>{copy.tieBreak}</span>
            <input value={form.tie_break} onChange={(event) => update("tie_break", event.target.value)} placeholder="03:20" />
          </label>
        ) : null}

        <label>
          <span>{copy.notes}</span>
          <textarea rows="3" value={form.notas} onChange={(event) => update("notas", event.target.value)} />
        </label>

        {error ? <p className="admin-pda-form-error">{error}</p> : null}

        <div className="admin-pda-modal-actions">
          {result && onDelete ? (
            <button type="button" className="is-danger" disabled={saving} onClick={() => onDelete(result)}>
              {copy.delete}
            </button>
          ) : <span />}
          <button type="button" disabled={saving} onClick={onClose}>{copy.cancel}</button>
          <button type="submit" className="is-primary" disabled={saving}>
            {saving ? copy.saving : copy.save}
          </button>
        </div>
      </form>
    </PdaModalShell>
  )
}

export function PdaFeedbackPopup({ copy, feedback, onClose }) {
  const closeRef = useRef(onClose)
  const isError = feedback.tone === "error"

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") closeRef.current?.()
    }

    document.addEventListener("keydown", handleKeyDown)

    if (isError) {
      return () => document.removeEventListener("keydown", handleKeyDown)
    }

    const timer = window.setTimeout(() => closeRef.current?.(), 3600)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      window.clearTimeout(timer)
    }
  }, [feedback.message, isError])

  const eyebrow = isError ? copy.feedbackErrorEyebrow : copy.feedbackSuccessEyebrow
  const title = isError ? copy.feedbackErrorTitle : copy.feedbackSuccessTitle
  const helper = isError ? copy.feedbackErrorHelp : copy.feedbackSuccessHelp

  return (
    <div
      className={`admin-pda-feedback-backdrop${isError ? " is-error" : " is-success"}`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeRef.current?.()
      }}
    >
      <section
        className="admin-pda-feedback-dialog"
        role="dialog"
        aria-modal="true"
        aria-live="assertive"
        aria-labelledby="admin-pda-feedback-title"
        aria-describedby="admin-pda-feedback-message"
      >
        <button
          type="button"
          className="admin-pda-feedback-close"
          onClick={() => closeRef.current?.()}
          aria-label={copy.feedbackClose}
        >
          ×
        </button>

        <div className="admin-pda-feedback-icon" aria-hidden="true">
          {isError ? "!" : "✓"}
        </div>

        <span className="admin-pda-feedback-eyebrow">{eyebrow}</span>
        <h2 id="admin-pda-feedback-title">{title}</h2>
        <p id="admin-pda-feedback-message" className="admin-pda-feedback-message">
          {feedback.message}
        </p>
        <p className="admin-pda-feedback-helper">{helper}</p>

        <button
          type="button"
          className="admin-pda-feedback-accept"
          onClick={() => closeRef.current?.()}
          autoFocus
        >
          {copy.feedbackAccept}
        </button>

        {!isError ? <span className="admin-pda-feedback-progress" aria-hidden="true" /> : null}
      </section>
    </div>
  )
}

function PdaModalShell({ title, onClose, busy, wide = false, children }) {
  return (
    <div className="admin-pda-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onClose()
    }}>
      <section className={`admin-pda-modal${wide ? " is-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <div>
            <span>PDA · PHO3NIX</span>
            <h2>{title}</h2>
          </div>
          <button type="button" disabled={busy} onClick={onClose} aria-label="Cerrar">×</button>
        </header>
        <div className="admin-pda-modal-body">{children}</div>
      </section>
    </div>
  )
}

function ModalActions({ copy, saving, onClose, disabled = false }) {
  return (
    <div className="admin-pda-modal-actions">
      <span />
      <button type="button" disabled={saving} onClick={onClose}>{copy.cancel}</button>
      <button type="submit" className="is-primary" disabled={saving || disabled}>
        {saving ? copy.saving : copy.save}
      </button>
    </div>
  )
}
