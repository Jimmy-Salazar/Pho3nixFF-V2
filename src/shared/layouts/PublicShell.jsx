import { Link } from "react-router-dom"
import { useI18n } from "../../i18n/I18nProvider.jsx"

export default function PublicShell({ children }) {
  const { locale, setLocale, t } = useI18n()

  const languages = [
    { code: "es", label: "Español", flag: "🇪🇨" },
    { code: "en", label: "English", flag: "🇺🇸" },
  ]

  return (
    <main className="phx-public-shell">
      <header className="phx-topbar">
        <Link to="/" className="phx-brand" aria-label={t("app.brand")}>
          <div className="phx-brand-mark" aria-hidden="true" />
          <div className="phx-brand-copy">
            <strong>{t("app.brand")}</strong>
            <span>{t("app.tagline")}</span>
          </div>
        </Link>

        <div className="phx-topbar-actions">
          <div className="phx-language-switcher" aria-label="Selector de idioma">
            {languages.map((language) => {
              const active = locale === language.code

              return (
                <button
                  key={language.code}
                  type="button"
                  className={`phx-language-flag ${active ? "is-active" : "is-inactive"}`}
                  aria-label={language.label}
                  aria-pressed={active}
                  title={language.label}
                  onClick={() => setLocale(language.code)}
                >
                  <span aria-hidden="true">{language.flag}</span>
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {children}
    </main>
  )
}
