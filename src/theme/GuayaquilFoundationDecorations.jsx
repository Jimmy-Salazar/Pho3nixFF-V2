export default function GuayaquilFoundationDecorations({ themeKey }) {
  if (themeKey !== "guayaquil_foundation") return null

  return (
    <div className="phx-guayaquil-foundation-decorations" aria-hidden="true">
      <img
        src="/themes/guayaquil-foundation/decorations/malecon.svg"
        alt=""
        className="phx-guayaquil-foundation-decoration phx-guayaquil-foundation-decoration--malecon"
        draggable="false"
      />
      <img
        src="/themes/guayaquil-foundation/decorations/river-wave.svg"
        alt=""
        className="phx-guayaquil-foundation-decoration phx-guayaquil-foundation-decoration--river-wave"
        draggable="false"
      />
      <img
        src="/themes/guayaquil-foundation/decorations/city-stars.svg"
        alt=""
        className="phx-guayaquil-foundation-decoration phx-guayaquil-foundation-decoration--city-stars"
        draggable="false"
      />
    </div>
  )
}
