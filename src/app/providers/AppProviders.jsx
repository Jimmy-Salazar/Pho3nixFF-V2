import { I18nProvider } from "../../i18n/I18nProvider.jsx"
import { ThemeProvider } from "../../theme/ThemeProvider.jsx"
import { AuthProvider } from "../../modules/auth/context/AuthContext.jsx"

export default function AppProviders({ children }) {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  )
}
