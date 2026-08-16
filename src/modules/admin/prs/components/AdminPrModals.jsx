import { useMemo, useState } from "react"
import { interpolatePrCopy } from "../i18n/adminPrsCopy.js"
import {
  buildChartPoints,
  calculateBarbellTotal,
  formatDate,
  formatIsoDate,
  formatWeight,
  getAthleteFromRecord,
  getAthleteName,
  getExerciseName,
  PLATE_OPTIONS,
} from "../utils/adminPrsUtils.js"

const EMPTY_PLATES = Object.fromEntries(PLATE_OPTIONS.map((plate) => [String(plate), 0]))

export function RegisterPrModal({
  copy,
  locale,
  athletes,
  exercises,
  selectedExerciseId,
  saving,
  onClose,
  onSave,
}) {
  const [athleteId, setAthleteId] = useState("")
  const [exerciseId, setExerciseId] = useState(selectedExerciseId || exercises[0]?.id || "")
  const [date, setDate] = useState(formatIsoDate())
  const [barWeight, setBarWeight] = useState(45)
  const [plates, setPlates] = useState(EMPTY_PLATES)
  const [error, setError] = useState("")

  const weight = useMemo(() => calculateBarbellTotal(barWeight, plates), [barWeight, plates])

  function handlePlateChange(plate, value) {
    setPlates((current) => ({
      ...current,
      [String(plate)]: value === "" ? 0 : Math.max(0, Number(value) || 0),
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setError("")

    if (!athleteId || !exerciseId || !date) {
      setError(copy.requiredFields)
      return
    }

    if (!(weight.total > 0)) {
      setError(copy.invalidWeight)
      return
    }

    onSave({ athleteId, exerciseId, date, weightLb: weight.total })
  }

  return (
    <ModalShell className="admin-prs-register-modal" onClose={saving ? undefined : onClose}>
      <form onSubmit={handleSubmit} className="admin-prs-modal-card admin-prs-register-card">
        <ModalHeader title={copy.createPrTitle} subtitle={copy.createPrSubtitle} onClose={onClose} disabled={saving} icon="🏆" />

        <div className="admin-prs-register-body">
          <section className="admin-prs-register-fields">
            <Field label={copy.athlete}>
              <select value={athleteId} onChange={(event) => setAthleteId(event.target.value)} autoFocus>
                <option value="">{copy.selectAthlete}</option>
                {athletes.map((athlete) => (
                  <option key={athlete.id} value={athlete.id}>{athlete.nombre || athlete.email}</option>
                ))}
              </select>
            </Field>

            <Field label={copy.exercise}>
              <select value={exerciseId} onChange={(event) => setExerciseId(event.target.value)}>
                <option value="">{copy.selectExerciseOption}</option>
                {exercises.map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>{exercise.nombre}</option>
                ))}
              </select>
            </Field>

            <div className="admin-prs-field-grid">
              <Field label={copy.date}>
                <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </Field>

              <Field label={copy.bar}>
                <select value={barWeight} onChange={(event) => setBarWeight(Number(event.target.value))}>
                  <option value={45}>45 lb</option>
                  <option value={35}>35 lb</option>
                  <option value={25}>25 lb</option>
                </select>
              </Field>
            </div>

            <div className="admin-prs-total-card">
              <small>{copy.totalWeight}</small>
              <strong>{formatWeight(weight.total, locale)}</strong>
              <p>{formatWeight(barWeight, locale)} + {formatWeight(weight.sideTotal, locale)} {copy.perSide}</p>
            </div>
          </section>

          <section className="admin-prs-plates-panel">
            <header>
              <span>◫</span>
              <div><small>{copy.plateCalculator}</small><strong>{copy.perSide}</strong></div>
            </header>

            <div className="admin-prs-plates-grid">
              {PLATE_OPTIONS.map((plate) => (
                <Field key={plate} label={`${plate} lb`}>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={plates[String(plate)] || ""}
                    onChange={(event) => handlePlateChange(plate, event.target.value)}
                    placeholder="0"
                  />
                </Field>
              ))}
            </div>
          </section>
        </div>

        {error ? <div className="admin-prs-modal-error" role="alert">{error}</div> : null}

        <ModalActions copy={copy} saving={saving} onClose={onClose} submitLabel={copy.newPr} />
      </form>
    </ModalShell>
  )
}

export function EditPrModal({ copy, record, exercises, saving, onClose, onSave }) {
  const [exerciseId, setExerciseId] = useState(record?.ejercicio_id || "")
  const [weightLb, setWeightLb] = useState(record?.peso_libras ?? "")
  const [date, setDate] = useState(String(record?.fecha || "").slice(0, 10))
  const [error, setError] = useState("")

  function handleSubmit(event) {
    event.preventDefault()
    setError("")

    if (!exerciseId || !date) {
      setError(copy.requiredFields)
      return
    }

    const numericWeight = Number(weightLb)
    if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
      setError(copy.invalidWeight)
      return
    }

    onSave({ exerciseId, weightLb: numericWeight, date })
  }

  return (
    <ModalShell onClose={saving ? undefined : onClose}>
      <form onSubmit={handleSubmit} className="admin-prs-modal-card admin-prs-small-modal">
        <ModalHeader
          title={copy.editPrTitle}
          subtitle={copy.editPrSubtitle}
          onClose={onClose}
          disabled={saving}
          icon="✎"
        />

        <div className="admin-prs-small-modal-body">
          <Field label={copy.athlete}>
            <input value={getAthleteName(record)} disabled />
          </Field>

          <Field label={copy.exercise}>
            <select value={exerciseId} onChange={(event) => setExerciseId(event.target.value)} autoFocus>
              <option value="">{copy.selectExerciseOption}</option>
              {exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>{exercise.nombre}</option>
              ))}
            </select>
          </Field>

          <div className="admin-prs-field-grid">
            <Field label={copy.weight}>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={weightLb}
                onChange={(event) => setWeightLb(event.target.value)}
              />
            </Field>

            <Field label={copy.date}>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </Field>
          </div>

          {error ? <div className="admin-prs-modal-error" role="alert">{error}</div> : null}
        </div>

        <ModalActions copy={copy} saving={saving} onClose={onClose} submitLabel={copy.save} />
      </form>
    </ModalShell>
  )
}

export function DeletePrModal({ copy, locale, record, saving, onClose, onDelete }) {
  const confirmationWord = locale === "en" ? "DELETE" : "ELIMINAR"
  const [confirmation, setConfirmation] = useState("")
  const canDelete = confirmation.trim().toUpperCase() === confirmationWord
  const athleteName = getAthleteName(record)
  const exerciseName = getExerciseName(record)

  return (
    <ModalShell onClose={saving ? undefined : onClose}>
      <section className="admin-prs-modal-card admin-prs-small-modal admin-prs-delete-modal">
        <ModalHeader
          title={copy.deletePrTitle}
          subtitle={athleteName + " · " + exerciseName}
          onClose={onClose}
          disabled={saving}
          icon="⚠"
        />

        <div className="admin-prs-small-modal-body">
          <p className="admin-prs-delete-message">
            {interpolatePrCopy(copy.deletePrWarning, {
              weight: formatWeight(record?.peso_libras, locale),
              date: formatDate(record?.fecha, locale),
            })}
          </p>

          <Field label={confirmationWord}>
            <input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoFocus
              autoComplete="off"
              placeholder={confirmationWord}
            />
          </Field>
        </div>

        <div className="admin-prs-modal-actions">
          <button type="button" className="admin-prs-secondary-button" onClick={onClose} disabled={saving}>{copy.cancel}</button>
          <button type="button" className="admin-prs-danger-button" onClick={onDelete} disabled={saving || !canDelete}>
            {saving ? copy.deleting : copy.confirmDelete}
          </button>
        </div>
      </section>
    </ModalShell>
  )
}

export function ExerciseModal({ copy, exercise, saving, onClose, onSave }) {
  const [name, setName] = useState(exercise?.nombre || "")
  const [error, setError] = useState("")

  function handleSubmit(event) {
    event.preventDefault()
    const value = name.trim()

    if (!value) {
      setError(copy.emptyExerciseName)
      return
    }

    onSave(value)
  }

  return (
    <ModalShell onClose={saving ? undefined : onClose}>
      <form onSubmit={handleSubmit} className="admin-prs-modal-card admin-prs-small-modal">
        <ModalHeader
          title={exercise ? copy.editExerciseTitle : copy.createExerciseTitle}
          subtitle={copy.exerciseName}
          onClose={onClose}
          disabled={saving}
          icon="🏋"
        />
        <div className="admin-prs-small-modal-body">
          <Field label={copy.exerciseName}>
            <input value={name} onChange={(event) => setName(event.target.value)} autoFocus placeholder="Back Squat" />
          </Field>
          {error ? <div className="admin-prs-modal-error" role="alert">{error}</div> : null}
        </div>
        <ModalActions copy={copy} saving={saving} onClose={onClose} submitLabel={copy.save} />
      </form>
    </ModalShell>
  )
}

export function DeleteExerciseModal({ copy, locale, exercise, saving, onClose, onDelete }) {
  const confirmationWord = locale === "en" ? "DELETE" : "ELIMINAR"
  const [confirmation, setConfirmation] = useState("")
  const count = Number(exercise?.historyCount || 0)
  const canDelete = confirmation.trim().toUpperCase() === confirmationWord

  return (
    <ModalShell onClose={saving ? undefined : onClose}>
      <section className="admin-prs-modal-card admin-prs-small-modal admin-prs-delete-modal">
        <ModalHeader title={copy.deleteExerciseTitle} subtitle={exercise?.nombre || copy.exercise} onClose={onClose} disabled={saving} icon="⚠" />
        <div className="admin-prs-small-modal-body">
          <p className="admin-prs-delete-message">
            {count > 0
              ? interpolatePrCopy(copy.deleteExerciseWarning, { count })
              : copy.deleteExerciseSafe}
          </p>

          <Field label={confirmationWord}>
            <input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoFocus
              autoComplete="off"
              placeholder={confirmationWord}
            />
          </Field>
        </div>

        <div className="admin-prs-modal-actions">
          <button type="button" className="admin-prs-secondary-button" onClick={onClose} disabled={saving}>{copy.cancel}</button>
          <button type="button" className="admin-prs-danger-button" onClick={onDelete} disabled={saving || !canDelete}>
            {saving ? copy.deleting : copy.confirmDelete}
          </button>
        </div>
      </section>
    </ModalShell>
  )
}

export function PrHistoryModal({ copy, locale, record, rows, onClose, onEdit, onDelete }) {
  const athlete = getAthleteFromRecord(record)
  const name = getAthleteName(record)
  const points = buildChartPoints(rows)
  const recent = [...rows].reverse()

  return (
    <ModalShell onClose={onClose}>
      <section className="admin-prs-modal-card admin-prs-history-modal">
        <ModalHeader title={copy.historyTitle} subtitle={`${name} · ${record?.ejercicios?.nombre || copy.exercise}`} onClose={onClose} icon="📈" />

        <div className="admin-prs-history-body">
          <section className="admin-prs-history-chart-card">
            <header><small>{copy.chart}</small><strong>{rows.length}</strong></header>
            {points.length === 0 ? (
              <div className="admin-prs-empty">{copy.noHistory}</div>
            ) : (
              <div className="admin-prs-chart" role="img" aria-label={copy.chart}>
                {points.map((item) => (
                  <div className="admin-prs-chart-column" key={item.id}>
                    <span className="admin-prs-chart-value">{formatWeight(item.peso_libras, locale)}</span>
                    <span className="admin-prs-chart-bar" style={{ height: `${item.height}%` }} />
                    <small>{formatDate(item.fecha, locale)}</small>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="admin-prs-history-list-card">
            <header><small>{copy.records}</small><strong>{recent.length}</strong></header>
            {recent.length === 0 ? (
              <div className="admin-prs-empty">{copy.noHistory}</div>
            ) : (
              <div className="admin-prs-history-list">
                {recent.map((item) => (
                  <article key={item.id}>
                    <span><strong>{formatWeight(item.peso_libras, locale)}</strong><small>{formatDate(item.fecha, locale)}</small></span>
                    <div className="admin-prs-row-actions">
                      <em>PR</em>
                      <button type="button" onClick={() => onEdit(item)} aria-label={copy.edit + " PR"}>✎</button>
                      <button type="button" className="is-danger" onClick={() => onDelete(item)} aria-label={copy.delete + " PR"}>🗑</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </ModalShell>
  )
}

export function OperationFeedbackPopup({ feedback, onClose }) {
  return (
    <div className={`admin-prs-feedback is-${feedback?.tone || "success"}`} role="status" aria-live="polite">
      <span aria-hidden="true">{feedback?.tone === "error" ? "!" : "✓"}</span>
      <strong>{feedback?.message}</strong>
      <button type="button" onClick={onClose} aria-label="Cerrar">×</button>
    </div>
  )
}

function ModalShell({ children, className = "", onClose }) {
  return (
    <div className={`admin-prs-modal-shell ${className}`}>
      <button type="button" className="admin-prs-modal-backdrop" onClick={onClose} aria-label="Cerrar" />
      {children}
    </div>
  )
}

function ModalHeader({ title, subtitle, icon, onClose, disabled = false }) {
  return (
    <header className="admin-prs-modal-header">
      <div><span aria-hidden="true">{icon}</span><div><small>{subtitle}</small><h2>{title}</h2></div></div>
      <button type="button" onClick={onClose} disabled={disabled} aria-label="Cerrar">×</button>
    </header>
  )
}

function ModalActions({ copy, saving, onClose, submitLabel }) {
  return (
    <div className="admin-prs-modal-actions">
      <button type="button" className="admin-prs-secondary-button" onClick={onClose} disabled={saving}>{copy.cancel}</button>
      <button type="submit" className="admin-prs-primary-button" disabled={saving}>{saving ? copy.saving : submitLabel}</button>
    </div>
  )
}

function Field({ label, children }) {
  return <label className="admin-prs-field"><span>{label}</span>{children}</label>
}
