export default function FlagDayDecorations({ themeKey }) {
  if (themeKey !== "flag_day") return null

  return (
    <div
      className="phx-flag-day-decorations"
      aria-hidden="true"
    >
      <img
        src="/themes/flag-day/decorations/flag-brush.svg"
        alt=""
        className="phx-flag-day-decoration phx-flag-day-decoration--brush"
      />

      <img
        src="/themes/flag-day/decorations/flag-ribbon.svg"
        alt=""
        className="phx-flag-day-decoration phx-flag-day-decoration--ribbon"
      />

      <img
        src="/themes/flag-day/decorations/flag-corner.svg"
        alt=""
        className="phx-flag-day-decoration phx-flag-day-decoration--corner"
      />
    </div>
  )
}
