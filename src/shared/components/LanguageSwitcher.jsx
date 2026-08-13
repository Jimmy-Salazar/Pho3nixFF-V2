import { useI18n } from "../../i18n/I18nProvider.jsx"

const LANGUAGES = [
  { code: "es", label: "Español", flag: "🇪🇨" },
  { code: "en", label: "English", flag: "🇺🇸" },
]

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()

  return (
    <div className="phx-language-switcher" aria-label="Selector de idioma">
      {LANGUAGES.map((language) => {
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
  )
}
