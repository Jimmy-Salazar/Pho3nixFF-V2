export default function GoodFridayDecorations({ themeKey }) {
  if (themeKey !== "good_friday") return null
  return (
    <div className="phx-good-friday-decorations" aria-hidden="true">
      <img src="/themes/good-friday/decorations/good-friday-cross.svg" alt="" className="phx-good-friday-decoration phx-good-friday-decoration--good-friday-cross" draggable="false" />
      <img src="/themes/good-friday/decorations/crown-thorns.svg" alt="" className="phx-good-friday-decoration phx-good-friday-decoration--crown-thorns" draggable="false" />
      <img src="/themes/good-friday/decorations/olive-branch.svg" alt="" className="phx-good-friday-decoration phx-good-friday-decoration--olive-branch" draggable="false" />
    </div>
  )
}
