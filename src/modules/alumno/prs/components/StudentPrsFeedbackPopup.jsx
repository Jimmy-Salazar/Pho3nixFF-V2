export default function StudentPrsFeedbackPopup({ open, message, onClose }) {
  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-live="assertive"
      aria-label={message}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(0, 0, 0, 0.68)",
        backdropFilter: "blur(7px)",
      }}
    >
      <button
        type="button"
        aria-label="Cerrar confirmación"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
          background: "transparent",
          cursor: "default",
        }}
      />

      <section
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(100%, 390px)",
          border: "1px solid rgba(249, 115, 22, 0.38)",
          borderRadius: 28,
          padding: "28px 24px",
          textAlign: "center",
          color: "#fff",
          background:
            "linear-gradient(145deg, rgba(17,17,17,.98), rgba(5,5,5,.98))",
          boxShadow:
            "0 30px 90px rgba(0,0,0,.72), 0 0 42px rgba(249,115,22,.13)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            margin: "0 auto",
            border: "1px solid rgba(249,115,22,.38)",
            borderRadius: "50%",
            color: "#fb923c",
            background: "rgba(249,115,22,.1)",
            fontSize: 32,
            fontWeight: 900,
          }}
        >
          ✓
        </div>

        <p
          style={{
            margin: "20px 0 0",
            color: "#fb923c",
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: "0.22em",
          }}
        >
          PHO3NIX
        </p>

        <h2
          style={{
            margin: "8px 0 0",
            fontSize: "clamp(20px, 5vw, 26px)",
            fontWeight: 900,
            lineHeight: 1.1,
          }}
        >
          {message}
        </h2>

        <p
          style={{
            margin: "10px 0 0",
            color: "rgba(255,255,255,.48)",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          La operación se completó correctamente.
        </p>
      </section>
    </div>
  )
}
