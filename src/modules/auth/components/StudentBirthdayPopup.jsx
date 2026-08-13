import { useEffect, useMemo, useState } from "react"

import "../../../styles/studentBirthdayPopup.css"

const COPY = {
  es: {
    close: "Cerrar saludo de cumpleaños",
    brand: "PHO3NIX Functional Fitness",
    title: "¡Feliz cumpleaños!",
    thanks: "Gracias 🔥",
    adminMessage: (name) =>
      `Hoy celebramos tu día, ${name}. Gracias por impulsar PHO3NIX con visión, liderazgo y compromiso.`,
    adminFooter:
      "Que este nuevo año llegue con salud, claridad, fuerza y grandes logros para seguir construyendo algo extraordinario.",
    coachMessage: (name) =>
      `Hoy celebramos tu día, ${name}. Gracias por tu energía, disciplina y por inspirar a la comunidad en cada entrenamiento.`,
    coachFooter:
      "Que este nuevo ciclo venga con más fortaleza, evolución y metas cumplidas dentro y fuera del box.",
    athleteMessage: (name) =>
      `Hoy celebramos tu día, ${name}. Todo el equipo de PHO3NIX te desea salud, fuerza y muchos logros en este nuevo año.`,
    athleteFooter:
      "Que sigas renaciendo más fuerte en cada entrenamiento, con disciplina, evolución y fuego.",
  },
  en: {
    close: "Close birthday greeting",
    brand: "PHO3NIX Functional Fitness",
    title: "Happy birthday!",
    thanks: "Thank you 🔥",
    adminMessage: (name) =>
      `Today we celebrate you, ${name}. Thank you for driving PHO3NIX forward with vision, leadership and commitment.`,
    adminFooter:
      "May this new year bring health, clarity, strength and great achievements as you continue building something extraordinary.",
    coachMessage: (name) =>
      `Today we celebrate you, ${name}. Thank you for your energy, discipline and for inspiring the community in every workout.`,
    coachFooter:
      "May this new chapter bring greater strength, growth and goals achieved inside and outside the box.",
    athleteMessage: (name) =>
      `Today we celebrate you, ${name}. The entire PHO3NIX team wishes you health, strength and many achievements this year.`,
    athleteFooter:
      "Keep rising stronger in every workout, with discipline, progress and fire.",
  },
}

const CONFETTI = Array.from({ length: 34 }, (_, index) => ({
  id: index,
  left: `${(index * 29 + 7) % 100}%`,
  delay: `${((index * 17) % 18) / 10}s`,
  duration: `${2.8 + ((index * 13) % 18) / 10}s`,
  shift: `${((index * 37) % 120) - 60}px`,
  rotation: `${(index * 47) % 360}deg`,
  color: [
    "var(--phx-color-primary)",
    "var(--phx-color-accent)",
    "#ffffff",
    "#fbbf24",
    "#ef4444",
  ][index % 5],
}))

function getLocale() {
  return String(document.documentElement.lang || "es")
    .toLowerCase()
    .startsWith("en")
    ? "en"
    : "es"
}

function getInitials(name) {
  const parts = String(name || "PH")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!parts.length) return "PH"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function getFirstName(name, locale) {
  const value = String(name || "").trim().split(/\s+/)[0]
  return value || (locale === "en" ? "Athlete" : "Atleta")
}

function getBirthdayMessage(copy, role, firstName) {
  const normalizedRole = String(role || "").toLowerCase().trim()

  if (normalizedRole === "admin" || normalizedRole === "administrador") {
    return {
      message: copy.adminMessage(firstName),
      footer: copy.adminFooter,
    }
  }

  if (normalizedRole === "coach") {
    return {
      message: copy.coachMessage(firstName),
      footer: copy.coachFooter,
    }
  }

  return {
    message: copy.athleteMessage(firstName),
    footer: copy.athleteFooter,
  }
}

function playBirthdayChime() {
  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext

    if (!AudioContextClass) return

    const context = new AudioContextClass()
    const gain = context.createGain()
    gain.gain.setValueAtTime(0.0001, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.035, context.currentTime + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.72)
    gain.connect(context.destination)

    const notes = [
      { frequency: 659.25, startsAt: 0 },
      { frequency: 783.99, startsAt: 0.18 },
      { frequency: 987.77, startsAt: 0.36 },
    ]

    notes.forEach(({ frequency, startsAt }) => {
      const oscillator = context.createOscillator()
      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(
        frequency,
        context.currentTime + startsAt
      )
      oscillator.connect(gain)
      oscillator.start(context.currentTime + startsAt)
      oscillator.stop(context.currentTime + startsAt + 0.28)
    })

    window.setTimeout(() => {
      context.close().catch(() => {})
    }, 1200)
  } catch {
    // El navegador puede bloquear audio automático. El popup sigue funcionando.
  }
}

export default function StudentBirthdayPopup({ profile, onClose }) {
  const [locale, setLocale] = useState(getLocale)

  useEffect(() => {
    const observer = new MutationObserver(() => setLocale(getLocale()))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", handleKeyDown)
    playBirthdayChime()

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose])

  const copy = COPY[locale] || COPY.es
  const fullName = profile?.nombre || ""
  const firstName = getFirstName(fullName, locale)
  const content = useMemo(
    () => getBirthdayMessage(copy, profile?.role, firstName),
    [copy, firstName, profile?.role]
  )

  return (
    <div
      className="student-birthday-popup"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-birthday-title"
    >
      <div className="student-birthday-confetti" aria-hidden="true">
        {CONFETTI.map((piece) => (
          <i
            key={piece.id}
            style={{
              "--birthday-left": piece.left,
              "--birthday-delay": piece.delay,
              "--birthday-duration": piece.duration,
              "--birthday-shift": piece.shift,
              "--birthday-rotation": piece.rotation,
              "--birthday-color": piece.color,
            }}
          />
        ))}
      </div>

      <button
        type="button"
        className="student-birthday-backdrop"
        aria-label={copy.close}
        onClick={onClose}
      />

      <section className="student-birthday-card">
        <div className="student-birthday-glow student-birthday-glow-a" />
        <div className="student-birthday-glow student-birthday-glow-b" />

        <button
          type="button"
          className="student-birthday-close"
          aria-label={copy.close}
          onClick={onClose}
        >
          ×
        </button>

        <div className="student-birthday-brand">
          <span aria-hidden="true">🔥</span>
          <strong>PHO<span>3</span>NIX</strong>
          <small>FUNCTIONAL FITNESS</small>
        </div>

        <div className="student-birthday-avatar">
          {profile?.fotoUrl ? (
            <img src={profile.fotoUrl} alt={fullName} />
          ) : (
            <span>{getInitials(fullName)}</span>
          )}
        </div>

        <p className="student-birthday-eyebrow">{copy.brand}</p>

        <h2 id="student-birthday-title">{copy.title}</h2>
        <h3>{fullName || firstName}</h3>

        <p className="student-birthday-message">{content.message}</p>

        <div className="student-birthday-footer">
          {content.footer} <span aria-hidden="true">🔥</span>
        </div>

        <button
          type="button"
          className="student-birthday-thanks"
          onClick={onClose}
        >
          {copy.thanks}
        </button>
      </section>
    </div>
  )
}
