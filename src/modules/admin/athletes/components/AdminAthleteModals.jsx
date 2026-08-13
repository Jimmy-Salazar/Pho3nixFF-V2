import { useEffect, useState } from "react"
import { getInitials } from "../../dashboard/utils/adminDashboardUtils.js"
import {
  ROLE_PICKER_OPTIONS,
  formatDate,
  getRoleLabel,
  getStatusLabel,
  getTodayISO,
  toRolePickerValue,
} from "../utils/adminAthletesUtils.js"

const EMPTY_CREATE_FORM = {
  nombre: "",
  cedula: "",
  email: "",
  telefono: "",
  fecha_nacimiento: "",
  role: "Alumno",
  sexo: "Masculino",
}

export function CreateAthleteModal({ copy, locale, loading, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_CREATE_FORM)

  const disabled =
    loading ||
    !form.nombre.trim() ||
    !form.cedula.trim() ||
    !form.email.trim() ||
    !form.sexo

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (disabled) return

    onSubmit({
      nombre: form.nombre.trim(),
      cedula: form.cedula.trim(),
      email: form.email.trim().toLowerCase(),
      telefono: form.telefono.trim() || null,
      fecha_nacimiento: form.fecha_nacimiento || null,
      role: form.role,
      sexo: form.sexo,
    })
  }

  return (
    <ModalShell
      copy={copy}
      eyebrow={copy.createEyebrow}
      title={copy.createTitle}
      subtitle={copy.createSubtitle}
      onClose={onClose}
      busy={loading}
    >
      <form onSubmit={handleSubmit}>
        <div className="admin-athlete-modal-grid">
          <TextField
            label={copy.name}
            required
            value={form.nombre}
            onChange={(value) => setField("nombre", value)}
            placeholder="Ej: Jimmy Salazar"
          />
          <TextField
            label={copy.idNumber}
            required
            value={form.cedula}
            onChange={(value) => setField("cedula", value)}
            placeholder="0900000000"
          />
          <TextField
            label={copy.email}
            type="email"
            required
            value={form.email}
            onChange={(value) => setField("email", value)}
            placeholder="correo@ejemplo.com"
          />
          <TextField
            label={copy.phone}
            value={form.telefono}
            onChange={(value) => setField("telefono", value)}
            placeholder="0990000000"
          />
          <TextField
            label={copy.birthDate}
            type="date"
            value={form.fecha_nacimiento}
            onChange={(value) => setField("fecha_nacimiento", value)}
          />
          <SelectField
            label={copy.sex}
            value={form.sexo}
            onChange={(value) => setField("sexo", value)}
            options={[
              { value: "Masculino", label: copy.male },
              { value: "Femenino", label: copy.female },
            ]}
          />
        </div>

        <RoleSelector copy={copy} value={form.role} onChange={(value) => setField("role", value)} />

        <div className="admin-athlete-modal-note">
          <strong>PHO3NIX</strong>
          <span>{copy.createNote}</span>
        </div>

        <ModalActions
          copy={copy}
          busy={loading}
          disabled={disabled}
          submitLabel={loading ? copy.creating : copy.create}
          onClose={onClose}
        />
      </form>
    </ModalShell>
  )
}

export function EditAthleteModal({ copy, user, loading, onClose, onSubmit }) {
  const [form, setForm] = useState({
    telefono: user?.telefono || "",
    role: toRolePickerValue(user?.role),
    fecha_nacimiento: user?.fecha_nacimiento || "",
    sexo: user?.sexo || "",
  })

  useEffect(() => {
    setForm({
      telefono: user?.telefono || "",
      role: toRolePickerValue(user?.role),
      fecha_nacimiento: user?.fecha_nacimiento || "",
      sexo: user?.sexo || "",
    })
  }, [user])

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (loading) return

    onSubmit({
      telefono: form.telefono.trim() || null,
      role: form.role,
      fecha_nacimiento: form.fecha_nacimiento || null,
      sexo: form.sexo || null,
    })
  }

  return (
    <ModalShell
      copy={copy}
      eyebrow={copy.editEyebrow}
      title={copy.editTitle}
      subtitle={user?.nombre || user?.email || "PHO3NIX"}
      onClose={onClose}
      busy={loading}
      user={user}
    >
      <form onSubmit={handleSubmit}>
        <div className="admin-athlete-modal-grid">
          <TextField
            label={copy.phone}
            value={form.telefono}
            onChange={(value) => setField("telefono", value)}
            placeholder="0990000000"
          />
          <TextField
            label={copy.birthDate}
            type="date"
            value={form.fecha_nacimiento}
            onChange={(value) => setField("fecha_nacimiento", value)}
          />
          <SelectField
            label={copy.sex}
            value={form.sexo}
            onChange={(value) => setField("sexo", value)}
            options={[
              { value: "", label: copy.unknown },
              { value: "Masculino", label: copy.male },
              { value: "Femenino", label: copy.female },
            ]}
          />
          <div className="admin-athlete-readonly-field">
            <small>{copy.email}</small>
            <strong>{user?.email || "—"}</strong>
          </div>
        </div>

        <RoleSelector copy={copy} value={form.role} onChange={(value) => setField("role", value)} />

        <ModalActions
          copy={copy}
          busy={loading}
          disabled={loading}
          submitLabel={loading ? copy.saving : copy.save}
          onClose={onClose}
        />
      </form>
    </ModalShell>
  )
}

export function MembershipModal({ copy, locale, user, mode, loading, onClose, onSubmit }) {
  const [startDate, setStartDate] = useState(getTodayISO())
  const [endDate, setEndDate] = useState("")
  const activating = mode === "activate"
  const canSubmit = !loading && (!activating || (startDate && endDate))

  return (
    <ModalShell
      copy={copy}
      eyebrow={copy.membershipTitle}
      title={activating ? copy.membershipActivateTitle : copy.membershipDeactivateTitle}
      subtitle={`${activating ? copy.membershipActivateText : copy.membershipDeactivateText} ${user?.nombre || "PHO3NIX"}.`}
      onClose={onClose}
      busy={loading}
      user={user}
      compact
    >
      {activating ? (
        <div className="admin-athlete-modal-grid">
          <TextField label={copy.startDate} type="date" value={startDate} onChange={setStartDate} />
          <TextField label={copy.endDate} type="date" value={endDate} onChange={setEndDate} />
        </div>
      ) : (
        <div className="admin-athlete-membership-warning">
          <span aria-hidden="true">!</span>
          <p>{copy.membershipDeactivateText} <strong>{user?.nombre || "PHO3NIX"}</strong>.</p>
        </div>
      )}

      {user?.status?.membership?.fecha_fin ? (
        <div className="admin-athlete-last-membership">
          <small>{copy.lastMembership}</small>
          <strong>{formatDate(user.status.membership.fecha_fin, locale)}</strong>
          <span>{getStatusLabel(user.status, copy)}</span>
        </div>
      ) : null}

      <ModalActions
        copy={copy}
        busy={loading}
        disabled={!canSubmit}
        submitLabel={activating ? copy.confirmActivate : copy.confirmDeactivate}
        danger={!activating}
        onClose={onClose}
        onSubmit={() => onSubmit(activating ? { startDate, endDate } : {})}
      />
    </ModalShell>
  )
}

export function DeleteAthleteModal({ copy, locale, user, loading, onClose, onConfirm }) {
  const expected = locale === "en" ? "DELETE" : "ELIMINAR"
  const [confirmation, setConfirmation] = useState("")
  const canDelete = !loading && confirmation.trim().toUpperCase() === expected

  return (
    <ModalShell
      copy={copy}
      eyebrow={copy.delete}
      title={copy.deletingTitle}
      subtitle={user?.nombre || user?.email || "PHO3NIX"}
      onClose={onClose}
      busy={loading}
      user={user}
      danger
      compact
    >
      <div className="admin-athlete-delete-warning">
        <span aria-hidden="true">!</span>
        <p>{copy.deletingText}</p>
      </div>

      <TextField
        label={copy.typeDelete}
        value={confirmation}
        onChange={setConfirmation}
        placeholder={expected}
        disabled={loading}
      />

      <ModalActions
        copy={copy}
        busy={loading}
        disabled={!canDelete}
        submitLabel={loading ? copy.deleting : copy.deletePermanently}
        danger
        onClose={onClose}
        onSubmit={onConfirm}
      />
    </ModalShell>
  )
}


export function OperationConfirmationPopup({ copy, message, onClose }) {
  return (
    <div
      className="admin-athlete-confirmation-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-athlete-confirmation-title"
    >
      <button
        type="button"
        className="admin-athlete-confirmation-backdrop"
        onClick={onClose}
        aria-label={copy.close}
      />

      <section className="admin-athlete-confirmation-card">
        <div className="admin-athlete-confirmation-icon" aria-hidden="true">✓</div>
        <small>{copy.confirmationEyebrow}</small>
        <h2 id="admin-athlete-confirmation-title">{copy.confirmationTitle}</h2>
        <p>{message}</p>
        <button type="button" onClick={onClose}>{copy.accept}</button>
      </section>
    </div>
  )
}

function ModalShell({
  copy,
  eyebrow,
  title,
  subtitle,
  user,
  onClose,
  busy,
  compact = false,
  danger = false,
  children,
}) {
  const name = user?.nombre || user?.email || "PHO3NIX"

  return (
    <div className="admin-athlete-modal-layer" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        className="admin-athlete-modal-backdrop"
        onClick={() => !busy && onClose()}
        aria-label={copy.close}
      />

      <section
        className={`admin-athlete-modal-card${compact ? " is-compact" : ""}${danger ? " is-danger" : ""}`}
      >
        <header>
          <div className="admin-athlete-modal-heading">
            {user ? (
              <div className="admin-athlete-modal-avatar">
                {user.foto_url ? <img src={user.foto_url} alt={name} /> : <span>{getInitials(name)}</span>}
              </div>
            ) : (
              <div className="admin-athlete-modal-symbol" aria-hidden="true">👥</div>
            )}

            <div>
              <small>{eyebrow}</small>
              <h2>{title}</h2>
              <p>{subtitle}</p>
            </div>
          </div>

          <button type="button" onClick={onClose} disabled={busy} aria-label={copy.close}>×</button>
        </header>

        <div className="admin-athlete-modal-body">{children}</div>
      </section>
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
  disabled = false,
}) {
  return (
    <label className="admin-athlete-field">
      <span>{label}{required ? <b> *</b> : null}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
      />
    </label>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="admin-athlete-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={`${option.value}-${option.label}`} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

function RoleSelector({ copy, value, onChange }) {
  return (
    <fieldset className="admin-athlete-role-selector">
      <legend>{copy.accessType}</legend>
      <div>
        {ROLE_PICKER_OPTIONS.map((option) => {
          const selected = value === option.value

          return (
            <button
              key={option.value}
              type="button"
              className={selected ? "is-selected" : ""}
              onClick={() => onChange(option.value)}
            >
              <strong>{copy[option.key]}</strong>
              <small>{copy[option.noteKey]}</small>
              {selected ? <span>{copy.selectedRole}</span> : null}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function ModalActions({
  copy,
  busy,
  disabled,
  submitLabel,
  onClose,
  onSubmit,
  danger = false,
}) {
  const buttonType = onSubmit ? "button" : "submit"

  return (
    <footer className="admin-athlete-modal-actions">
      <button type="button" className="admin-athlete-cancel-button" onClick={onClose} disabled={busy}>
        {copy.cancel}
      </button>
      <button
        type={buttonType}
        className={`admin-athlete-submit-button${danger ? " is-danger" : ""}`}
        onClick={onSubmit}
        disabled={disabled}
      >
        {submitLabel}
      </button>
    </footer>
  )
}
