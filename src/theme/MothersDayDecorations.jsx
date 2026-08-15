export default function MothersDayDecorations({ themeKey }) {
  if (themeKey !== "mothers_day") return null
  return (
    <div className="phx-mothers-day-decorations" aria-hidden="true">
      <img src="/themes/mothers-day/decorations/mothers-heart.svg" alt="" className="phx-mothers-day-decoration phx-mothers-day-decoration--mothers-heart" draggable="false" />
      <img src="/themes/mothers-day/decorations/mothers-flower.svg" alt="" className="phx-mothers-day-decoration phx-mothers-day-decoration--mothers-flower" draggable="false" />
      <img src="/themes/mothers-day/decorations/mothers-petals.svg" alt="" className="phx-mothers-day-decoration phx-mothers-day-decoration--mothers-petals" draggable="false" />
    </div>
  )
}
