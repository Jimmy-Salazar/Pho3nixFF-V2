export default function YearEndDecorations({ themeKey }) {
  if (themeKey !== "year_end") return null

  return (
    <div className="phx-year-end-decorations" aria-hidden="true">
      <img
        src="/themes/year-end/decorations/year-end-fireworks.svg"
        alt=""
        className="phx-year-end-decoration phx-year-end-decoration--fireworks"
        draggable="false"
      />
      <img
        src="/themes/year-end/decorations/year-end-confetti.svg"
        alt=""
        className="phx-year-end-decoration phx-year-end-decoration--confetti"
        draggable="false"
      />
      <img
        src="/themes/year-end/decorations/year-end-clock.svg"
        alt=""
        className="phx-year-end-decoration phx-year-end-decoration--clock"
        draggable="false"
      />
    </div>
  )
}
