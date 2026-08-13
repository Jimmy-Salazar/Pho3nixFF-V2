import { useEffect, useState } from "react"

export default function StudentProfileEditModal({ open, copy, profile, saving, onClose, onSave }) {
  const [form, setForm] = useState({ nombre: "", telefono: "", fecha_nacimiento: "" })

  useEffect(() => {
    if (!open) return
    setForm({
      nombre: profile?.nombre || "",
      telefono: profile?.telefono || "",
      fecha_nacimiento: profile?.fecha_nacimiento || "",
    })
  }, [open, profile])

  if (!open) return null

  return (
    <div className="student-profile-modal">
      <button type="button" className="student-profile-modal-backdrop" onClick={saving ? undefined : onClose} aria-label={copy.cancel} />
      <form className="student-profile-modal-panel" onSubmit={(event) => { event.preventDefault(); onSave(form) }}>
        <header><div><p>PHO3NIX</p><h2>{copy.editInformation}</h2><span>{copy.editInformationText}</span></div><button type="button" onClick={onClose} disabled={saving}>×</button></header>
        <div className="student-profile-form-grid">
          <label className="is-wide"><span>{copy.name}</span><input value={form.nombre} onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))} /></label>
          <label><span>{copy.phone}</span><input value={form.telefono} onChange={(event) => setForm((current) => ({ ...current, telefono: event.target.value }))} /></label>
          <label><span>{copy.birthDate}</span><input type="date" value={form.fecha_nacimiento} onChange={(event) => setForm((current) => ({ ...current, fecha_nacimiento: event.target.value }))} /></label>
          <label className="is-wide is-readonly"><span>{copy.email}</span><input value={profile?.email || ""} readOnly /></label>
        </div>
        <footer><button type="button" onClick={onClose} disabled={saving}>{copy.cancel}</button><button type="submit" className="is-primary" disabled={saving}>{saving ? copy.saving : copy.save}</button></footer>
      </form>
    </div>
  )
}
