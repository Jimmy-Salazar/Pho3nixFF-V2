export default function CarnivalDecorations({ themeKey }) {
  if (themeKey !== "carnival") return null

  return (
    <div className="phx-carnival-decorations" aria-hidden="true">
      <img
        src="/themes/carnival/decorations/carnival-mask.svg"
        alt=""
        className="phx-carnival-decoration phx-carnival-decoration--carnival-mask"
        draggable="false"
      />
      <img
        src="/themes/carnival/decorations/confetti-burst.svg"
        alt=""
        className="phx-carnival-decoration phx-carnival-decoration--confetti-burst"
        draggable="false"
      />
      <img
        src="/themes/carnival/decorations/feather-splash.svg"
        alt=""
        className="phx-carnival-decoration phx-carnival-decoration--feather-splash"
        draggable="false"
      />
    </div>
  )
}
