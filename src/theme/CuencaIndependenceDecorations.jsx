export default function CuencaIndependenceDecorations({ themeKey }) {
  if (themeKey !== "cuenca_independence") return null

  return (
    <div className="phx-cuenca-decorations" aria-hidden="true">
      <img
        src="/themes/cuenca-independence/decorations/cuenca-flag.svg"
        alt=""
        className="phx-cuenca-decoration phx-cuenca-decoration--flag"
        draggable="false"
      />
      <img
        src="/themes/cuenca-independence/decorations/cuenca-cathedral.svg"
        alt=""
        className="phx-cuenca-decoration phx-cuenca-decoration--cathedral"
        draggable="false"
      />
      <img
        src="/themes/cuenca-independence/decorations/cuenca-flourish.svg"
        alt=""
        className="phx-cuenca-decoration phx-cuenca-decoration--flourish"
        draggable="false"
      />
    </div>
  )
}
