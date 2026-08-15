export default function HalloweenDecorations({ themeKey }) {
  if (themeKey !== "halloween") return null

  return (
    <div className="phx-halloween-decorations" aria-hidden="true">
      <img
        src="/themes/halloween/decorations/halloween-web.svg"
        alt=""
        className="phx-halloween-decoration phx-halloween-decoration--web"
        draggable="false"
      />

      <img
        src="/themes/halloween/decorations/halloween-bats.svg"
        alt=""
        className="phx-halloween-decoration phx-halloween-decoration--bats"
        draggable="false"
      />

      <img
        src="/themes/halloween/decorations/halloween-pumpkin.svg"
        alt=""
        className="phx-halloween-decoration phx-halloween-decoration--pumpkin"
        draggable="false"
      />
    </div>
  )
}
