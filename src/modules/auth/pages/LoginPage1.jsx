import { Link } from "react-router-dom"
import PublicShell from "../../../shared/layouts/PublicShell.jsx"
import { useI18n } from "../../../i18n/I18nProvider.jsx"
export default function LoginPage() {
  const { t } = useI18n()
  return (
    <PublicShell><section className="phx-auth-page"><form className="phx-auth-card"><p className="phx-eyebrow">{t("app.brand")}</p><h1>{t("login.title")}</h1><p>{t("login.subtitle")}</p><label><span>{t("login.email")}</span><input type="email" placeholder="admin@pho3nix.com" /></label><label><span>{t("login.password")}</span><input type="password" placeholder="••••••••" /></label><button type="button" className="phx-button phx-button-primary">{t("login.submit")}</button><small>{t("login.demoNotice")}</small><Link to="/" className="phx-inline-link">{t("common.goHome")}</Link></form></section></PublicShell>
  )
}
