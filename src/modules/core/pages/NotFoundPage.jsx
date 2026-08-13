import { Link } from "react-router-dom"
import PublicShell from "../../../shared/layouts/PublicShell.jsx"
import { useI18n } from "../../../i18n/I18nProvider.jsx"
export default function NotFoundPage() {
  const { t } = useI18n()
  return <PublicShell><section className="phx-auth-page"><div className="phx-auth-card"><p className="phx-eyebrow">404</p><h1>{t("notFound.title")}</h1><p>{t("notFound.subtitle")}</p><Link to="/" className="phx-button phx-button-primary">{t("common.goHome")}</Link></div></section></PublicShell>
}
