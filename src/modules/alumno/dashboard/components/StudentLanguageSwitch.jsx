import { useI18n } from "../../../../i18n/I18nProvider.jsx"

const OPTIONS = [
  { locale: "es", label: "ES" },
  { locale: "en", label: "EN" },
]

export default function StudentLanguageSwitch({ compact = false }) {
  const { locale, setLocale } = useI18n()
  const activeLocale = locale === "en" ? "en" : "es"

  return (
    <div className={compact ? "student-language-switch is-compact" : "student-language-switch"}>
      {OPTIONS.map((option) => (
        <button
          key={option.locale}
          type="button"
          className={option.locale === activeLocale ? "is-active" : ""}
          onClick={() => setLocale(option.locale)}
          aria-label={option.locale === "es" ? "Cambiar a español" : "Switch to English"}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
