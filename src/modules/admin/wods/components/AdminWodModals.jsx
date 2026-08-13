import { useMemo, useState } from "react"

import WodCaloriesPanel from "./WodCaloriesPanel.jsx"
import { estimateWodCalories as estimateWodCaloriesInternal } from "../utils/estimateCalories.js"
import { estimateWodWithAi } from "../services/estimateWodWithAi.js"
import {
  WOD_STATUS,
  buildPreviousDay1930,
  buildStoredEstimate,
  buildWodPayload,
  formatDate,
  formatDateTime,
  formatModality,
  formatRanking,
  getStatusLabel,
  getTodayISO,
  getWodStatus,
} from "../utils/adminWodsUtils.js"

export function WodEditorModal({ copy, locale, wod, saving, onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: wod?.nombre || "",
    descripcion: wod?.descripcion || "",
    modalidad: wod?.modalidad || "single",
    modoRanking: wod?.modo_ranking || "sin_ranking",
  })
  const [estimateOverride, setEstimateOverride] = useState(
    wod ? buildStoredEstimate(wod, locale) : null
  )
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState("")

  const localEstimate = useMemo(
    () => estimateWodCaloriesFromForm(form, locale),
    [form, locale]
  )
  const estimate = estimateOverride || localEstimate
  const editing = Boolean(wod?.id)
  const disabled = saving || !form.descripcion.trim()

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
    setEstimateOverride(null)
    setAiError("")
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
        descripcion: form.descripcion,
        modalidad: form.modalidad,
        modoRanking: form.modoRanking,
        locale,
      })
      setEstimateOverride(result)
      if (result.fallback) setAiError(copy.localFallbackNote)
    } catch (error) {
      setAiError(error?.message || copy.operationError)
    } finally {
      setAiLoading(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (disabled) return
    onSave(buildWodPayload(form, estimate))
  }

  return (
    <ModalShell
      copy={copy}
      eyebrow={editing ? copy.editEyebrow : copy.createEyebrow}
      title={editing ? copy.editTitle : copy.createTitle}
      subtitle={copy.modalSubtitle}
      onClose={onClose}
      busy={saving || aiLoading}
      wide
    >
      <form className="admin-wod-editor" onSubmit={handleSubmit}>
        <section className="admin-wod-editor-fields">
          <TextField
            label={copy.name}
            value={form.nombre}
            onChange={(value) => setField("nombre", value)}
            placeholder={copy.namePlaceholder}
            autoFocus={!editing}
          />

          <TextAreaField
            label={copy.description}
            value={form.descripcion}
            onChange={(value) => setField("descripcion", value)}
            placeholder={copy.descriptionPlaceholder}
            required
          />

          <div className="admin-wod-field-grid">
            <SelectField
              label={copy.modality}
              value={form.modalidad}
              onChange={(value) => setField("modalidad", value)}
              options={[
                { value: "single", label: copy.single },
                { value: "duo", label: copy.duo },
                { value: "trio", label: copy.trio },
              ]}
            />
            <SelectField
              label={copy.ranking}
              value={form.modoRanking}
              onChange={(value) => setField("modoRanking", value)}
              options={[
                { value: "sin_ranking", label: copy.noRanking },
                { value: "mayor_es_mejor", label: copy.moreReps },
                { value: "menor_es_mejor", label: copy.lessTime },
              ]}
            />
          </div>

          <button
            type="button"
            className="admin-wod-ai-button"
            onClick={handleAiEstimate}
            disabled={saving || aiLoading}
          >
            <span aria-hidden="true">✦</span>
            {aiLoading ? copy.analyzingAi : copy.analyzeAi}
          </button>

          {aiError ? <div className="admin-wod-inline-note">{aiError}</div> : null}

          <ModalActions
            copy={copy}
            busy={saving}
            disabled={disabled}
            submitLabel={saving ? copy.saving : editing ? copy.saveChanges : copy.saveDraft}
            onClose={onClose}
          />
        </section>

        <WodCaloriesPanel copy={copy} estimate={estimate} />
      </form>
    </ModalShell>
  )
}

export function ScheduleWodModal({ copy, locale, wod, saving, error, onClose, onSchedule }) {
  const [date, setDate] = useState(wod?.fecha || "")
  const publicationAt = date ? buildPreviousDay1930(date) : ""

  function handleSubmit(event) {
    event.preventDefault()
    if (!date || saving) return
    onSchedule(date)
  }

  return (
    <ModalShell
      copy={copy}
      eyebrow={copy.scheduleEyebrow}
      title={copy.scheduleTitle}
      subtitle={`${copy.scheduleText} ${wod?.nombre || copy.noName}.`}
      onClose={onClose}
      busy={saving}
      compact
    >
      <form onSubmit={handleSubmit}>
        <TextField
          label={copy.wodDate}
          type="date"
          value={date}
          min={getTodayISO()}
          onChange={setDate}
          required
        />

        <div className="admin-wod-publication-preview">
          <span aria-hidden="true">◷</span>
          <div>
            <small>{copy.autoPublish}</small>
            <strong>{publicationAt ? formatDateTime(publicationAt, locale) : copy.previousDayAt}</strong>
          </div>
        </div>

        {error ? <div className="admin-wod-form-error">{error}</div> : null}

        <ModalActions
          copy={copy}
          busy={saving}
          disabled={saving || !date}
          submitLabel={saving ? copy.scheduling : copy.confirmSchedule}
          onClose={onClose}
        />
      </form>
    </ModalShell>
  )
}

export function DeleteWodModal({ copy, locale, wod, saving, onClose, onDelete }) {
  const expected = locale === "en" ? "DELETE" : "ELIMINAR"
  const [confirmation, setConfirmation] = useState("")
  const canDelete = !saving && confirmation.trim().toUpperCase() === expected

  return (
    <ModalShell
      copy={copy}
      eyebrow={copy.deleteEyebrow}
      title={copy.deleteTitle}
      subtitle={wod?.nombre || copy.noName}
      onClose={onClose}
      busy={saving}
      compact
      danger
    >
      <div className="admin-wod-delete-warning">
        <span aria-hidden="true">!</span>
        <p>{copy.deleteText}</p>
      </div>

      <TextField
        label={copy.typeDelete}
        value={confirmation}
        onChange={setConfirmation}
        placeholder={expected}
        disabled={saving}
      />

      <ModalActions
        copy={copy}
        busy={saving}
        disabled={!canDelete}
        submitLabel={saving ? copy.deleting : copy.deletePermanently}
        onClose={onClose}
        onSubmit={onDelete}
        danger
      />
    </ModalShell>
  )
}

export function WodDetailsModal({ copy, locale, wod, onClose, onEdit, onSchedule, onDelete }) {
  const status = getWodStatus(wod)
  const editable = status === WOD_STATUS.DRAFT || status === WOD_STATUS.SCHEDULED

  return (
    <ModalShell
      copy={copy}
      eyebrow={copy.detailsEyebrow}
      title={wod?.nombre || copy.detailsTitle}
      subtitle={getStatusLabel(status, copy)}
      onClose={onClose}
      compact
    >
      <div className="admin-wod-details">
        <p className="admin-wod-details-description">{wod?.descripcion || copy.noDescription}</p>

        <div className="admin-wod-details-grid">
          <DetailItem label={copy.date} value={wod?.fecha ? formatDate(wod.fecha, locale) : copy.noDate} />
          <DetailItem label={copy.modality} value={formatModality(wod?.modalidad, copy)} />
          <DetailItem label={copy.ranking} value={formatRanking(wod?.modo_ranking, copy)} />
          <DetailItem label={copy.estimate} value={wod?.calorias_min || wod?.calorias_max ? `${wod.calorias_min || 0} - ${wod.calorias_max || 0} kcal` : copy.noEstimate} />
          <DetailItem label={copy.publication} value={wod?.fecha_publicacion ? formatDateTime(wod.fecha_publicacion, locale) : copy.noDate} />
          <DetailItem label={copy.created} value={wod?.created_at ? formatDateTime(wod.created_at, locale) : "—"} />
        </div>

        <div className="admin-wod-details-actions">
          {editable ? <button type="button" onClick={onEdit}>✎ {copy.edit}</button> : null}
          {editable ? <button type="button" className="is-primary" onClick={onSchedule}>◷ {status === WOD_STATUS.SCHEDULED ? copy.reschedule : copy.schedule}</button> : null}
          <button type="button" className="is-danger" onClick={onDelete}>× {copy.delete}</button>
        </div>
      </div>
    </ModalShell>
  )
}

export function OperationFeedbackPopup({ copy, feedback, onClose }) {
  const error = feedback?.tone === "error"

  return (
    <div className="admin-wod-feedback-layer" role="dialog" aria-modal="true">
      <button type="button" className="admin-wod-modal-backdrop" onClick={onClose} aria-label={copy.close} />
      <section className={`admin-wod-feedback-card${error ? " is-error" : ""}`}>
        <div className="admin-wod-feedback-icon" aria-hidden="true">{error ? "!" : "✓"}</div>
        <small>{error ? copy.errorEyebrow : copy.confirmationEyebrow}</small>
        <h2>{error ? copy.errorTitle : copy.confirmationTitle}</h2>
        <p>{feedback?.message}</p>
        <button type="button" onClick={onClose}>{copy.accept}</button>
      </section>
    </div>
  )
}

function ModalShell({ copy, eyebrow, title, subtitle, onClose, busy, compact, wide, danger, children }) {
  const classes = [
    "admin-wod-modal-card",
    compact ? "is-compact" : "",
    wide ? "is-wide" : "",
    danger ? "is-danger" : "",
  ].filter(Boolean).join(" ")

  return (
    <div className="admin-wod-modal-layer" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        className="admin-wod-modal-backdrop"
        onClick={() => !busy && onClose()}
        aria-label={copy.close}
      />
      <section className={classes}>
        <header>
          <div className="admin-wod-modal-symbol" aria-hidden="true">W</div>
          <div>
            <small>{eyebrow}</small>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label={copy.close}>×</button>
        </header>
        <div className="admin-wod-modal-body">{children}</div>
      </section>
    </div>
  )
}

function ModalActions({ copy, busy, disabled, submitLabel, onClose, onSubmit, danger }) {
  return (
    <div className="admin-wod-modal-actions">
      <button type="button" onClick={onClose} disabled={busy}>{copy.cancel}</button>
      <button
        type={onSubmit ? "button" : "submit"}
        className={danger ? "is-danger" : "is-primary"}
        onClick={onSubmit}
        disabled={disabled}
      >
        {submitLabel}
      </button>
    </div>
  )
}

function TextField({ label, value, onChange, type = "text", placeholder, min, disabled, required, autoFocus = false }) {
  return (
    <label className="admin-wod-field">
      <small>{label}{required ? " *" : ""}</small>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={min}
        disabled={disabled}
        required={required}
        autoFocus={autoFocus}
      />
    </label>
  )
}

function TextAreaField({ label, value, onChange, placeholder, required }) {
  return (
    <label className="admin-wod-field">
      <small>{label}{required ? " *" : ""}</small>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </label>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="admin-wod-field">
      <small>{label}</small>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  )
}

function DetailItem({ label, value }) {
  return <div><small>{label}</small><strong>{value}</strong></div>
}

function estimateWodCaloriesFromForm(form, locale) {
  return estimateWodCaloriesInternal({
    nombre: form.nombre,
    descripcion: form.descripcion,
    modalidad: form.modalidad,
    modoRanking: form.modoRanking,
    locale,
  })
}

