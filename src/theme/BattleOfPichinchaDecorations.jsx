export default function BattleOfPichinchaDecorations({ themeKey }) {
  if (themeKey !== "battle_of_pichincha") return null
  return (
    <div className="phx-battle-of-pichincha-decorations" aria-hidden="true">
      <img src="/themes/battle-of-pichincha/decorations/pichincha-flag.svg" alt="" className="phx-battle-of-pichincha-decoration phx-battle-of-pichincha-decoration--pichincha-flag" draggable="false" />
      <img src="/themes/battle-of-pichincha/decorations/pichincha-mountain.svg" alt="" className="phx-battle-of-pichincha-decoration phx-battle-of-pichincha-decoration--pichincha-mountain" draggable="false" />
      <img src="/themes/battle-of-pichincha/decorations/pichincha-laurel.svg" alt="" className="phx-battle-of-pichincha-decoration phx-battle-of-pichincha-decoration--pichincha-laurel" draggable="false" />
    </div>
  )
}
