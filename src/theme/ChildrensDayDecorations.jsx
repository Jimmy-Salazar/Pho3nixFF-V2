export default function ChildrensDayDecorations({ themeKey }) {
  if (themeKey !== "childrens_day") return null

  return (
    <div className="phx-childrens-day-decorations" aria-hidden="true">
      <img
        src="/themes/childrens-day/decorations/balloons.svg"
        alt=""
        className="phx-childrens-day-decoration phx-childrens-day-decoration--balloons"
        draggable="false"
      />
      <img
        src="/themes/childrens-day/decorations/confetti-fun.svg"
        alt=""
        className="phx-childrens-day-decoration phx-childrens-day-decoration--confetti-fun"
        draggable="false"
      />
      <img
        src="/themes/childrens-day/decorations/kid-star.svg"
        alt=""
        className="phx-childrens-day-decoration phx-childrens-day-decoration--kid-star"
        draggable="false"
      />
    </div>
  )
}
