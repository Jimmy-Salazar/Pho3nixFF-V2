export default function LaborDayDecorations({ themeKey }) {
  if (themeKey !== "labor_day") return null
  return (
    <div className="phx-labor-day-decorations" aria-hidden="true">
      <img src="/themes/labor-day/decorations/labor-gear.svg" alt="" className="phx-labor-day-decoration phx-labor-day-decoration--labor-gear" draggable="false" />
      <img src="/themes/labor-day/decorations/labor-tools.svg" alt="" className="phx-labor-day-decoration phx-labor-day-decoration--labor-tools" draggable="false" />
      <img src="/themes/labor-day/decorations/labor-helmet.svg" alt="" className="phx-labor-day-decoration phx-labor-day-decoration--labor-helmet" draggable="false" />
    </div>
  )
}
