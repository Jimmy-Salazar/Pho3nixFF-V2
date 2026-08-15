export default function AllSoulsDayDecorations({ themeKey }) {
  if (themeKey !== "all_souls_day") return null

  return (
    <div className="phx-all-souls-decorations" aria-hidden="true">
      <img
        src="/themes/all-souls-day/decorations/all-souls-papel-picado.svg"
        alt=""
        className="phx-all-souls-decoration phx-all-souls-decoration--paper"
        draggable="false"
      />
      <img
        src="/themes/all-souls-day/decorations/all-souls-cross.svg"
        alt=""
        className="phx-all-souls-decoration phx-all-souls-decoration--cross"
        draggable="false"
      />
      <img
        src="/themes/all-souls-day/decorations/all-souls-flower.svg"
        alt=""
        className="phx-all-souls-decoration phx-all-souls-decoration--flower"
        draggable="false"
      />
    </div>
  )
}
