export default function GuayaquilIndependenceDecorations({ themeKey }) {
  if (themeKey !== "guayaquil_independence") return null

  return (
    <div
      className="phx-guayaquil-decorations"
      aria-hidden="true"
    >
      <img
        src="/themes/guayaquil-independence/decorations/guayaquil-stripes.svg"
        alt=""
        className="phx-guayaquil-decoration phx-guayaquil-decoration--stripes"
        draggable="false"
      />

      <img
        src="/themes/guayaquil-independence/decorations/guayaquil-stars.svg"
        alt=""
        className="phx-guayaquil-decoration phx-guayaquil-decoration--stars"
        draggable="false"
      />

      <img
        src="/themes/guayaquil-independence/decorations/guayaquil-corner.svg"
        alt=""
        className="phx-guayaquil-decoration phx-guayaquil-decoration--corner"
        draggable="false"
      />
    </div>
  )
}
