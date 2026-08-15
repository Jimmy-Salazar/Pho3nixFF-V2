const HEARTS = [
  { src: "/themes/valentines-day/decorations/heart-outline-neon.svg", className: "phx-heart phx-heart--1" },
  { src: "/themes/valentines-day/decorations/heart-soft.svg", className: "phx-heart phx-heart--2" },
  { src: "/themes/valentines-day/decorations/heart-corner.svg", className: "phx-heart phx-heart--3" },
  { src: "/themes/valentines-day/decorations/heart-particle.svg", className: "phx-heart phx-heart--4" },
  { src: "/themes/valentines-day/decorations/heart-particle.svg", className: "phx-heart phx-heart--5" },
  { src: "/themes/valentines-day/decorations/heart-soft.svg", className: "phx-heart phx-heart--6" },
  { src: "/themes/valentines-day/decorations/heart-particle.svg", className: "phx-heart phx-heart--7" },
  { src: "/themes/valentines-day/decorations/heart-particle.svg", className: "phx-heart phx-heart--8" },
  { src: "/themes/valentines-day/decorations/heart-particle.svg", className: "phx-heart phx-heart--9" },
]

export default function ThemeDecorations({ themeKey }) {
  if (themeKey !== "valentines_day") return null

  return (
    <div className="phx-theme-decoration-layer" aria-hidden="true">
      {HEARTS.map((heart, index) => (
        <img
          key={`${heart.className}-${index}`}
          src={heart.src}
          alt=""
          className={heart.className}
          draggable="false"
        />
      ))}
    </div>
  )
}
