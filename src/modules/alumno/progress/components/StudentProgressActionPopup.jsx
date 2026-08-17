export default function StudentProgressActionPopup({
  open,
  message,
  description,
  copy,
  onClose,
}) {
  if (!open) return null

  return (
    <div
      className="student-progress-toast"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span aria-hidden="true">✓</span>
      <div>
        <strong>{message}</strong>
        <p>{description || copy.operationCompleted}</p>
      </div>
      <button
        type="button"
        className="student-progress-toast-close"
        onClick={onClose}
        aria-label={copy.close}
      >
        ×
      </button>
    </div>
  )
}
