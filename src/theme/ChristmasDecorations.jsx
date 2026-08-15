export default function ChristmasDecorations({ themeKey }) {
  if (themeKey !== "christmas") return null

  return (
    <div className="phx-christmas-decorations" aria-hidden="true">
      <img
        src="/themes/christmas/decorations/christmas-lights.svg"
        alt=""
        className="phx-christmas-decoration phx-christmas-decoration--lights"
        draggable="false"
      />
      <img
        src="/themes/christmas/decorations/christmas-holly.svg"
        alt=""
        className="phx-christmas-decoration phx-christmas-decoration--holly"
        draggable="false"
      />
      <img
        src="/themes/christmas/decorations/christmas-gift.svg"
        alt=""
        className="phx-christmas-decoration phx-christmas-decoration--gift"
        draggable="false"
      />
    </div>
  )
}
