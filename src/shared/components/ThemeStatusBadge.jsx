import { useI18n } from "../../i18n/I18nProvider.jsx"
import { useTheme } from "../../theme/ThemeProvider.jsx"
export default function ThemeStatusBadge() {
  const { t } = useI18n()
  const { theme, loadingTheme, isRemoteTheme } = useTheme()
  return (
    <div className="phx-theme-badge">
      <span className="phx-theme-dot" />
      <span>{loadingTheme ? t("common.loading") : isRemoteTheme ? t("common.remoteTheme") : t("common.localTheme")}</span>
      <strong>{theme?.name || "PHO3NIX"}</strong>
    </div>
  )
}
