export default function NewYearDecorations({ themeKey }) {
  if (themeKey !== "new_year") return null

  return (
    <div className="phx-new-year-decorations" aria-hidden="true">
      <img
        src="/themes/new-year/decorations/firework-burst.svg"
        alt=""
        className="phx-new-year-decoration phx-new-year-decoration--firework-burst"
        draggable="false"
      />
      <img
        src="/themes/new-year/decorations/countdown-ring.svg"
        alt=""
        className="phx-new-year-decoration phx-new-year-decoration--countdown-ring"
        draggable="false"
      />
      <img
        src="/themes/new-year/decorations/gold-streamer.svg"
        alt=""
        className="phx-new-year-decoration phx-new-year-decoration--gold-streamer"
        draggable="false"
      />
    </div>
  )
}
