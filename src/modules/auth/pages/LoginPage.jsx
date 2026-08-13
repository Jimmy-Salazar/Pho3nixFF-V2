import { useMemo, useState } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"

import PublicShell from "../../../shared/layouts/PublicShell.jsx"
import { useI18n } from "../../../i18n/I18nProvider.jsx"
import { useAuth } from "../context/AuthContext.jsx"

const COPY = {
  es: {
    eyebrow: "Acceso PHO3NIX",
    title: "Iniciar sesión",
    description:
      "Ingresa con el mismo usuario registrado en Supabase. El sistema detectará tu rol y abrirá tu panel.",
    email: "Correo electrónico",
    password: "Contraseña",
    submit: "Ingresar",
    submitting: "Validando...",
    backHome: "Volver al Home",
    noAccount: "Si no tienes acceso, comunícate con administración.",
    alreadyLogged: "Sesión activa",
    emailPlaceholder: "tu@email.com",
    passwordPlaceholder: "Tu contraseña",
  },
  en: {
    eyebrow: "PHO3NIX Access",
    title: "Sign in",
    description:
      "Use the same Supabase account. The system will detect your role and open your dashboard.",
    email: "Email",
    password: "Password",
    submit: "Sign in",
    submitting: "Validating...",
    backHome: "Back Home",
    noAccount: "If you do not have access, contact administration.",
    alreadyLogged: "Active session",
    emailPlaceholder: "you@email.com",
    passwordPlaceholder: "Your password",
  },
}

function getCopy(locale) {
  return COPY[locale] || COPY.es
}

export default function LoginPage() {
  const { locale } = useI18n()
  const copy = useMemo(() => getCopy(locale), [locale])
  const location = useLocation()
  const navigate = useNavigate()
  const { signIn, loading, isAuthenticated, role, getRoleDestination, authError } = useAuth()

  const [form, setForm] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")

  const redirectTo = location.state?.from?.pathname || getRoleDestination(role)

  if (isAuthenticated && role) {
    return <Navigate to={redirectTo || "/app"} replace />
  }

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

    const result = await signIn(form)

    if (!result.ok) {
      setError(result.error)
      return
    }

    navigate(result.redirectTo, { replace: true })
  }

  return (
    <PublicShell>
      <main className="phx-login-page">
        <section className="phx-login-card" aria-labelledby="login-title">
          <div className="phx-login-brand">
            <span className="phx-login-logo" aria-hidden="true" />
            <div>
              <p>{copy.eyebrow}</p>
              <h1 id="login-title">{copy.title}</h1>
            </div>
          </div>

          <p className="phx-login-description">{copy.description}</p>

          {(error || authError) && (
            <div className="phx-login-error" role="alert">
              {error || authError}
            </div>
          )}

          <form className="phx-login-form" onSubmit={handleSubmit}>
            <label>
              <span>{copy.email}</span>
              <input
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder={copy.emailPlaceholder}
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                required
              />
            </label>

            <label>
              <span>{copy.password}</span>
              <input
                type="password"
                autoComplete="current-password"
                placeholder={copy.passwordPlaceholder}
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                required
              />
            </label>

            <button type="submit" className="phx-login-submit" disabled={loading}>
              {loading ? copy.submitting : copy.submit}
              <span>→</span>
            </button>
          </form>

          <footer className="phx-login-footer">
            <small>{copy.noAccount}</small>
            <Link to="/">{copy.backHome}</Link>
          </footer>
        </section>
      </main>
    </PublicShell>
  )
}
