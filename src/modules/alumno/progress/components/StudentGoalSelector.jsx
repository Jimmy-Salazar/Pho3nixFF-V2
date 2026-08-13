import { getGoalOptions } from "../utils/studentProgressUtils.js"

export default function StudentGoalSelector({ copy, value, locked, daysRemaining, onChange }) {
  const options = getGoalOptions(copy)

  return (
    <article className="student-progress-card student-goal-card">
      <header>
        <div><p>◆ {copy.goalTitle}</p><h2>{copy.goalSubtitle}</h2></div>
        {locked ? <span>{daysRemaining} {copy.days}</span> : null}
      </header>

      <div className="student-goal-options">
        {options.map((item) => (
          <button
            key={item.id}
            type="button"
            className={value === item.id ? "is-active" : ""}
            onClick={() => onChange(item.id)}
            disabled={locked}
          >
            <span>{item.icon}</span>
            <div><strong>{item.title}</strong><small>{item.text}</small></div>
          </button>
        ))}
      </div>

      <p>{locked ? copy.goalLocked : copy.goalPending}</p>
    </article>
  )
}
