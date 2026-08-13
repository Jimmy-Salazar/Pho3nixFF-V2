import { useI18n } from "../../../../i18n/I18nProvider.jsx"

const OPTIONS = [
  { locale: "es", label: "ES" },
  { locale: "en", label: "EN" },
]

export default function StudentWodsLanguageSwitch() {
  const { locale, setLocale } = useI18n()
  const activeLocale = locale === "en" ? "en" : "es"

  return (
    <div className="student-wods-language">
      {OPTIONS.map((option) => (
        <button
          key={option.locale}
          type="button"
          className={option.locale === activeLocale ? "is-active" : ""}
          onClick={() => setLocale(option.locale)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
