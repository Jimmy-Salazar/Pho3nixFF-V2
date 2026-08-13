import { useEffect, useMemo } from "react"

import "./homeInfoPopup.css"

const CONTENT = {
  es: {
    close: "Cerrar",
    titles: {
      about: "¿Quiénes somos?",
      schedule: "Horarios",
      partners: "Partners",
      news: "Novedades",
    },
    about: {
      paragraph:
        "PHO3NIX Functional Fitness es una comunidad creada para personas que quieren entrenar con propósito, superar sus límites y construir disciplina dentro y fuera del box.",
      values: [
        {
          icon: "🔥",
          title: "Pasión",
          text: "Entrenamos con intensidad y enfoque.",
        },
        {
          icon: "🤝",
          title: "Comunidad",
          text: "Nadie renace solo; avanzamos juntos.",
        },
        {
          icon: "🏆",
          title: "Progreso",
          text: "Medimos, mejoramos y celebramos cada logro.",
        },
      ],
    },
    schedules: [
      {
        key: "morning",
        title: "Mañana",
        times: ["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM"],
      },
      {
        key: "afternoon",
        title: "Tarde",
        times: ["5:00 PM", "6:00 PM", "7:00 PM"],
      },
      {
        key: "saturday",
        title: "Sábado y feriados",
        times: ["Open Box 8:00 AM - 10:00 AM"],
      },
    ],
    partners: {
      title: "LYCAN Ecuador",
      text: "Partner de equipamiento y comunidad deportiva.",
      coming:
        "Próximamente se podrán mostrar más aliados, marcas y beneficios para miembros PHO3NIX.",
    },
    news: [
      {
        id: "fallback-1",
        title: "Nuevos retos PHO3NIX",
        text: "Muy pronto anunciaremos nuevos challenges internos para la comunidad.",
      },
      {
        id: "fallback-2",
        title: "Open Box",
        text: "Los sábados mantenemos espacios abiertos para técnica, movilidad y recuperación.",
      },
      {
        id: "fallback-3",
        title: "Promos y eventos",
        text: "Las promociones y anuncios especiales aparecerán aquí.",
      },
    ],
  },
  en: {
    close: "Close",
    titles: {
      about: "About us",
      schedule: "Schedule",
      partners: "Partners",
      news: "News",
    },
    about: {
      paragraph:
        "PHO3NIX Functional Fitness is a community built for people who want to train with purpose, push their limits, and build discipline inside and outside the box.",
      values: [
        {
          icon: "🔥",
          title: "Passion",
          text: "We train with intensity and focus.",
        },
        {
          icon: "🤝",
          title: "Community",
          text: "No one rises alone; we move forward together.",
        },
        {
          icon: "🏆",
          title: "Progress",
          text: "We measure, improve, and celebrate every achievement.",
        },
      ],
    },
    schedules: [
      {
        key: "morning",
        title: "Morning",
        times: ["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM"],
      },
      {
        key: "afternoon",
        title: "Afternoon",
        times: ["5:00 PM", "6:00 PM", "7:00 PM"],
      },
      {
        key: "saturday",
        title: "Saturday and holidays",
        times: ["Open Box 8:00 AM - 10:00 AM"],
      },
    ],
    partners: {
      title: "LYCAN Ecuador",
      text: "Equipment and sports community partner.",
      coming:
        "Soon we will show more partners, brands, and benefits for PHO3NIX members.",
    },
    news: [
      {
        id: "fallback-1",
        title: "New PHO3NIX challenges",
        text: "Very soon we will announce new internal challenges for the community.",
      },
      {
        id: "fallback-2",
        title: "Open Box",
        text: "On Saturdays we keep open sessions for technique, mobility, and recovery.",
      },
      {
        id: "fallback-3",
        title: "Promos and events",
        text: "Promotions and special announcements will appear here.",
      },
    ],
  },
}

function getCopy(locale) {
  return CONTENT[locale] || CONTENT.es
}

export default function HomeInfoPopup({ type, locale = "es", t, onClose }) {
  const copy = getCopy(locale)
  const title = useMemo(() => copy.titles[type] || "PHO3NIX", [copy, type])
  const closeLabel = copy.close || t?.("home.close") || "Cerrar"

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose])

  return (
    <div className="home-info-popup-shell" role="dialog" aria-modal="true" aria-labelledby="home-info-popup-title">
      <button
        type="button"
        className="home-info-popup-backdrop"
        aria-label={closeLabel}
        onClick={onClose}
      />

      <article className="home-info-popup-card">
        <div className="home-info-popup-glow" aria-hidden="true" />

        <header className="home-info-popup-header">
          <div>
            <p>PHO3NIX</p>
            <h2 id="home-info-popup-title">{title}</h2>
          </div>

          <button
            type="button"
            className="home-info-popup-close"
            aria-label={closeLabel}
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="home-info-popup-body">
          {type === "about" ? <AboutContent copy={copy} /> : null}
          {type === "schedule" ? <ScheduleContent copy={copy} /> : null}
          {type === "partners" ? <PartnersContent copy={copy} /> : null}
          {type === "news" ? <NewsContent copy={copy} /> : null}
        </div>
      </article>
    </div>
  )
}

function AboutContent({ copy }) {
  return (
    <div className="home-info-popup-stack">
      <p className="home-info-popup-lead">{copy.about.paragraph}</p>

      <div className="home-info-popup-value-grid">
        {copy.about.values.map((item) => (
          <section key={item.title} className="home-info-popup-value-card">
            <span>{item.icon}</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </section>
        ))}
      </div>
    </div>
  )
}

function ScheduleContent({ copy }) {
  return (
    <div className="home-info-popup-schedule-grid">
      {copy.schedules.map((block) => (
        <section key={block.key} className="home-info-popup-schedule-card">
          <h3>{block.title}</h3>

          <div>
            {block.times.map((time) => (
              <p key={time}>{time}</p>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function PartnersContent({ copy }) {
  return (
    <div className="home-info-popup-stack">
      <section className="home-info-popup-partner-card">
        <span className="home-info-popup-partner-logo" aria-hidden="true" />

        <div>
          <h3>{copy.partners.title}</h3>
          <p>{copy.partners.text}</p>
        </div>
      </section>

      <p className="home-info-popup-muted">{copy.partners.coming}</p>
    </div>
  )
}

function NewsContent({ copy }) {
  return (
    <div className="home-info-popup-news-grid">
      {copy.news.map((item, index) => (
        <article key={item.id} className="home-info-popup-news-card">
          <div className="home-info-popup-news-icon">{index + 1}</div>
          <div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        </article>
      ))}
    </div>
  )
}
