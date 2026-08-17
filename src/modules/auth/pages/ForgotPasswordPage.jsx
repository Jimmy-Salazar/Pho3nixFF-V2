import { useMemo, useState } from "react"
import { Link } from "react-router-dom"

import PublicShell from "../../../shared/layouts/PublicShell.jsx"
import { useI18n } from "../../../i18n/I18nProvider.jsx"
import { getPasswordRecoveryCopy } from "../i18n/passwordRecoveryCopy.js"
import { requestPasswordRecovery } from "../services/passwordRecoveryService.js"

export default function ForgotPasswordPage() {
  const { locale } = useI18n()
  const copy = useMemo(() => getPasswordRecoveryCopy(locale), [locale])

  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event) {
    event.preventDefault()

    if (submitting) return

    try {
      setSubmitting(true)
      setError("")

      await requestPasswordRecovery(email)

      setSent(true)
    } catch (requestError) {
      console.error("PASSWORD RECOVERY REQUEST ERROR:", requestError)
      setError(copy.recoveryError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PublicShell>
      <main className="phx-login-page">
        <section
          className="phx-login-card phx-login-card-recovery"
          aria-labelledby="password-recovery-title"
        >
          <div className="phx-login-brand">
            <span className="phx-login-logo" aria-hidden="true" />
            <div>
              <p>{copy.recoverEyebrow}</p>
              <h1 id="password-recovery-title">{copy.recoverTitle}</h1>
            </div>
          </div>

          <p className="phx-login-description">
            {copy.recoverDescription}
          </p>

          {error ? (
            <div className="phx-login-error" role="alert">
              {error}
            </div>
          ) : null}

          {sent ? (
            <div className="phx-login-success" role="status">
              <strong>{copy.recoverySentTitle}</strong>
              <span>{copy.recoverySent}</span>
            </div>
          ) : (
            <form className="phx-login-form" onSubmit={handleSubmit}>
              <label>
                <span>{copy.email}</span>

                <input
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder={copy.emailPlaceholder}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>

              <button
                type="submit"
                className="phx-login-submit"
                disabled={submitting}
              >
                {submitting
                  ? copy.sendingRecovery
                  : copy.sendRecovery}

                <span>→</span>
              </button>
            </form>
          )}

          <footer className="phx-login-footer">
            <Link to="/login">{copy.backToLogin}</Link>
          </footer>
        </section>
      </main>
    </PublicShell>
  )
}