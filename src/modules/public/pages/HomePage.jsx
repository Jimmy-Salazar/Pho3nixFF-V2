import { useState } from "react"
import { Link } from "react-router-dom"

import PublicShell from "../../../shared/layouts/PublicShell.jsx"
import HomeInfoPopup from "../components/HomeInfoPopup.jsx"
import { useI18n } from "../../../i18n/I18nProvider.jsx"

const actionCards = [
  {
    icon: "👥",
    titleKey: "home.cards.about.title",
    textKey: "home.cards.about.text",
    popupKey: "about",
  },
  {
    icon: "🕘",
    titleKey: "home.cards.schedule.title",
    textKey: "home.cards.schedule.text",
    popupKey: "schedule",
  },
  {
    icon: "🤝",
    titleKey: "home.cards.partners.title",
    textKey: "home.cards.partners.text",
    popupKey: "partners",
  },
  {
    icon: "📣",
    titleKey: "home.cards.news.title",
    textKey: "home.cards.news.text",
    popupKey: "news",
  },
]

export default function HomePage() {
  const { t, locale } = useI18n()
  const [activePopup, setActivePopup] = useState(null)

  return (
    <PublicShell>
      <section className="box-home">
        <div className="box-home-bg" aria-hidden="true">
          <div className="box-home-bg-image" />
          <div className="box-home-brand-word" />
          <div className="box-home-monument" />
          <div className="box-home-glow box-home-glow-left" />
          <div className="box-home-glow box-home-glow-right" />
        </div>

        <div className="box-home-layout">
          <section className="box-home-hero">
            <p className="box-home-kicker">{t("home.kicker")}</p>

            <h1>
              <span>{t("home.headline.line1")}</span>
              <span>{t("home.headline.line2")}</span>
              <span className="box-home-gradient-text">
                {t("home.headline.line3")}
              </span>
            </h1>

            <p className="box-home-subtitle">{t("home.subtitle")}</p>

            <div className="box-home-actions">
              <Link to="/login" className="box-home-primary-button">
                {t("home.primaryAction")}
                <span>→</span>
              </Link>

              <button type="button" className="box-home-secondary-button" onClick={() => setActivePopup("about")}>
                {t("home.secondaryAction")}
                <span>▶</span>
              </button>
            </div>
          </section>

          <section className="box-home-action-cards" aria-label={t("home.cardsLabel")}>
            {actionCards.map((item) => (
              <article key={item.titleKey} className="box-home-action-card">
                <div className="box-home-action-icon">{item.icon}</div>

                <div>
                  <h2>{t(item.titleKey)}</h2>
                  <p>{t(item.textKey)}</p>
                  <button type="button" onClick={() => setActivePopup(item.popupKey)}>{t("home.cardAction")} →</button>
                </div>
              </article>
            ))}
          </section>

          <footer className="box-home-footer">
            <div className="box-home-partner">
              <span className="box-home-partner-logo" />
              <p>
                {t("home.partnerText")} <strong>{t("home.partnerName")}</strong>
              </p>
            </div>

            <div className="box-home-footer-mark" aria-hidden="true" />

            <p className="box-home-copy">{t("home.copyright")}</p>
          </footer>
        </div>

        <div className="box-home-social" aria-label={t("home.socialLabel")}>
          <a
            href="https://www.instagram.com/pho3nixff.ec"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram PHO3NIX"
            title="Instagram PHO3NIX"
          >
            ◎
          </a>
          <a
            href="https://www.tiktok.com/@pho3nixff.ec"
            target="_blank"
            rel="noreferrer"
            aria-label="TikTok PHO3NIX"
            title="TikTok PHO3NIX"
          >
            ♪
          </a>
          <a
            href="https://wa.me/59397927407"
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp PHO3NIX"
            title="WhatsApp PHO3NIX"
          >
            ☎
          </a>
        </div>

        {activePopup ? (
          <HomeInfoPopup
            type={activePopup}
            locale={locale}
            t={t}
            onClose={() => setActivePopup(null)}
          />
        ) : null}
      </section>
    </PublicShell>
  )
}
