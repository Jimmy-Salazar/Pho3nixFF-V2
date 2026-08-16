import { useState } from "react"
import { todayISO } from "../utils/studentPrsUtils.js"

export default function StudentPrsModal({ exercises, item, saving, onClose, onSave, copy }) {
  const [form, setForm] = useState({
    ejercicio_id: item?.ejercicio_id || "",
    peso_libras: item?.peso_libras || "",
    fecha: item?.fecha || todayISO(),
  })

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <section className="student-prs-modal">
      <div onClick={saving ? undefined : onClose} />
      <article>
        <header>
          <h2>{item ? copy.editPr : copy.registerNewPr}</h2>
          <button type="button" onClick={onClose} disabled={saving}>×</button>
        </header>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSave(form, item)
          }}
        >
          <label>
            {copy.exercise}
            <select value={form.ejercicio_id} onChange={(event) => update("ejercicio_id", event.target.value)}>
              <option value="">{copy.selectExercise}</option>
              {exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>{exercise.nombre}</option>
              ))}
            </select>
          </label>

          <label>
            {copy.weightLb}
            <input type="number" min="1" step="0.5" value={form.peso_libras} onChange={(event) => update("peso_libras", event.target.value)} />
          </label>

          <label>
            {copy.date}
            <input type="date" value={form.fecha} onChange={(event) => update("fecha", event.target.value)} />
          </label>

          <footer>
            <button type="button" onClick={onClose} disabled={saving}>{copy.cancel}</button>
            <button type="submit" disabled={saving}>{saving ? copy.saving : copy.savePr}</button>
          </footer>
        </form>
      </article>
    </section>
  )
}
