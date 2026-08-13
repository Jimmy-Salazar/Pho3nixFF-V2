export default function SectionHeader({ title, action, onAction }) {
  return (
    <header className="student-section-header">
      <h2>{title}</h2>
      {action ? (
        <button type="button" onClick={onAction}>
          {action}
        </button>
      ) : null}
    </header>
  )
}
