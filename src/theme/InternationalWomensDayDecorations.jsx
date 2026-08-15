export default function InternationalWomensDayDecorations({ themeKey }) {
  if (themeKey !== "international_womens_day") return null
  return (
    <div className="phx-international-womens-day-decorations" aria-hidden="true">
      <img src="/themes/international-womens-day/decorations/womens-symbol.svg" alt="" className="phx-international-womens-day-decoration phx-international-womens-day-decoration--womens-symbol" draggable="false" />
      <img src="/themes/international-womens-day/decorations/womens-flower.svg" alt="" className="phx-international-womens-day-decoration phx-international-womens-day-decoration--womens-flower" draggable="false" />
      <img src="/themes/international-womens-day/decorations/womens-petals.svg" alt="" className="phx-international-womens-day-decoration phx-international-womens-day-decoration--womens-petals" draggable="false" />
    </div>
  )
}
