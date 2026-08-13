import EmptyState from "./EmptyState.jsx"
import { getInitials } from "../utils/studentDashboardUtils.js"

export default function BirthdaysList({ copy, items }) {
  if (!items.length) {
    return <EmptyState text={copy.noBirthdays} />
  }

  return (
    <div className="student-birthday-list">
      {items.map((item) => (
        <article key={item.id}>
          <span>{getInitials(item.nombre)}</span>
          <div>
            <strong>{item.nombre}</strong>
            <p>
              {item.day} {item.monthLabel}
            </p>
          </div>
        </article>
      ))}
    </div>
  )
}
