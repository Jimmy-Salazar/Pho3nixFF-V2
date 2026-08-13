import { useEffect, useState } from "react"

export default function StudentProfileEmailModal({ open, copy, currentEmail, saving, onClose, onSubmit }) {
  const [form, setForm] = useState({ email: "", password: "" })

  useEffect(() => {
    if (open) setForm({ email: "", password: "" })
  }, [open])

  if (!open) return null

  return (
    <div className="student-profile-modal">
      <button type="button" className="student-profile-modal-backdrop" onClick={saving ? undefined : onClose} aria-label={copy.cancel} />
      <form className="student-profile-modal-panel is-compact" onSubmit={(event) => { event.preventDefault(); onSubmit(form) }}>
        <header><div><p>PHO3NIX</p><h2>{copy.changeEmailTitle}</h2><span>{copy.changeEmailText}</span></div><button type="button" onClick={onClose} disabled={saving}>×</button></header>
        <div className="student-profile-form-grid">
          <label className="is-wide is-readonly"><span>{copy.currentEmail}</span><input value={currentEmail || ""} readOnly /></label>
          <label className="is-wide"><span>{copy.newEmail}</span><input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} autoComplete="email" /></label>
          <label className="is-wide"><span>{copy.currentPassword}</span><input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} autoComplete="current-password" /></label>
        </div>
        <footer><button type="button" onClick={onClose} disabled={saving}>{copy.cancel}</button><button type="submit" className="is-primary" disabled={saving}>{saving ? copy.sending : copy.sendVerification}</button></footer>
      </form>
    </div>
  )
}
