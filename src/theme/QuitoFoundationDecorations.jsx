export default function QuitoFoundationDecorations({ themeKey }) {
  if (themeKey !== "quito_foundation") return null

  return (
    <div className="phx-quito-foundation-decorations" aria-hidden="true">
      <img
        src="/themes/quito-foundation/decorations/quito-arches.svg"
        alt=""
        className="phx-quito-foundation-decoration phx-quito-foundation-decoration--quito-arches"
        draggable="false"
      />
      <img
        src="/themes/quito-foundation/decorations/tower-accent.svg"
        alt=""
        className="phx-quito-foundation-decoration phx-quito-foundation-decoration--tower-accent"
        draggable="false"
      />
      <img
        src="/themes/quito-foundation/decorations/cross-ribbon.svg"
        alt=""
        className="phx-quito-foundation-decoration phx-quito-foundation-decoration--cross-ribbon"
        draggable="false"
      />
    </div>
  )
}
