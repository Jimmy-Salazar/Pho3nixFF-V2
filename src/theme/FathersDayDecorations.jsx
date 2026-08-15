export default function FathersDayDecorations({ themeKey }) {
  if (themeKey !== "fathers_day") return null

  return (
    <div className="phx-fathers-day-decorations" aria-hidden="true">
      <img
        src="/themes/fathers-day/decorations/father-son.svg"
        alt=""
        className="phx-fathers-day-decoration phx-fathers-day-decoration--father-son"
        draggable="false"
      />
      <img
        src="/themes/fathers-day/decorations/shield-badge.svg"
        alt=""
        className="phx-fathers-day-decoration phx-fathers-day-decoration--shield-badge"
        draggable="false"
      />
      <img
        src="/themes/fathers-day/decorations/wing-outline.svg"
        alt=""
        className="phx-fathers-day-decoration phx-fathers-day-decoration--wing-outline"
        draggable="false"
      />
    </div>
  )
}
