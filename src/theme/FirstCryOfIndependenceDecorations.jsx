export default function FirstCryOfIndependenceDecorations({ themeKey }) {
  if (themeKey !== "first_cry_of_independence") return null

  return (
    <div className="phx-first-cry-of-independence-decorations" aria-hidden="true">
      <img
        src="/themes/first-cry-independence/decorations/flag-ribbon.svg"
        alt=""
        className="phx-first-cry-of-independence-decoration phx-first-cry-of-independence-decoration--flag-ribbon"
        draggable="false"
      />
      <img
        src="/themes/first-cry-independence/decorations/historic-star.svg"
        alt=""
        className="phx-first-cry-of-independence-decoration phx-first-cry-of-independence-decoration--historic-star"
        draggable="false"
      />
      <img
        src="/themes/first-cry-independence/decorations/ecuador-badge.svg"
        alt=""
        className="phx-first-cry-of-independence-decoration phx-first-cry-of-independence-decoration--ecuador-badge"
        draggable="false"
      />
    </div>
  )
}
