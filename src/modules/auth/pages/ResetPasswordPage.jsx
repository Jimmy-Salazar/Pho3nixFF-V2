import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import PublicShell from "../../../shared/layouts/PublicShell.jsx"
import { useI18n } from "../../../i18n/I18nProvider.jsx"
import { getPasswordRecoveryCopy } from "../i18n/passwordRecoveryCopy.js"
import {
  finishPasswordRecovery,
  readPasswordRecoverySession,
  subscribePasswordRecoverySession,
  updateRecoveredPassword,
} from "../services/passwordRecoveryService.js"

export default function ResetPasswordPage() {
  const { locale } = useI18n()
  const copy = useMemo(() => getPasswordRecoveryCopy(locale), [locale])

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  })

  const [checkingSession, setCheckingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    async function bootstrapRecoverySession() {
      try {
        const session = await readPasswordRecoverySession()

        if (!active) return

        setHasSession(Boolean(session))
      } catch (sessionError) {
        console.error(
          "PASSWORD RECOVERY SESSION ERROR:",
          sessionError
        )

        if (active) {
          setHasSession(false)
        }
      } finally {
        if (active) {
          setCheckingSession(false)
        }
      }
    }

    const unsubscribe = subscribePasswordRecoverySession(
      (session) => {
        if (!active) return

        setHasSession(Boolean(session))
        setCheckingSession(false)
      }
    )

    bootstrapRecoverySession()

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (submitting) return

    setError("")

    if (!form.password) {
      setError(copy.passwordRequired)
      return
    }

    if (form.password !== form.confirmPassword) {
      setError(copy.passwordMismatch)
      return
    }

    try {
      setSubmitting(true)

      await updateRecoveredPassword(form.password)
      await finishPasswordRecovery()

      setSuccess(true)
      setHasSession(false)
    } catch (updateError) {
      console.error(
        "PASSWORD RECOVERY UPDATE ERROR:",
        updateError
      )

      setError(copy.updateError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PublicShell>
      <main className="phx-login-page">
        <section
          className="phx-login-card phx-login-card-recovery"
          aria-labelledby="password-reset-title"
        >
          <div className="phx-login-brand">
            <span className="phx-login-logo" aria-hidden="true" />
            <div>
              <p>{copy.resetEyebrow}</p>
              <h1 id="password-reset-title">{copy.resetTitle}</h1>
            </div>
          </div>

          {success ? (
            <>
              <div className="phx-login-success" role="status">
                <strong>{copy.passwordUpdatedTitle}</strong>
                <span>{copy.passwordUpdated}</span>
              </div>

              <footer className="phx-login-footer">
                <Link to="/login">{copy.backToLogin}</Link>
              </footer>
            </>
          ) : checkingSession ? (
            <p className="phx-login-description">
              {copy.resetDescription}
            </p>
          ) : !hasSession ? (
            <>
              <div className="phx-login-error" role="alert">
                {copy.invalidRecovery}
              </div>

              <footer className="phx-login-footer">
                <Link to="/recuperar-contrasena">
                  {copy.requestAnotherLink}
                </Link>
              </footer>
            </>
          ) : (
            <>
              <p className="phx-login-description">
                {copy.resetDescription}
              </p>

              {error ? (
                <div className="phx-login-error" role="alert">
                  {error}
                </div>
              ) : null}

              <form
                className="phx-login-form"
                onSubmit={handleSubmit}
              >
                <label>
                  <span>{copy.newPassword}</span>

                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder={copy.newPasswordPlaceholder}
                    value={form.password}
                    onChange={(event) =>
                      updateField("password", event.target.value)
                    }
                    required
                  />
                </label>

                <label>
                  <span>{copy.confirmPassword}</span>

                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder={copy.confirmPasswordPlaceholder}
                    value={form.confirmPassword}
                    onChange={(event) =>
                      updateField(
                        "confirmPassword",
                        event.target.value
                      )
                    }
                    required
                  />
                </label>

                <button
                  type="submit"
                  className="phx-login-submit"
                  disabled={submitting}
                >
                  {submitting
                    ? copy.updatingPassword
                    : copy.updatePassword}

                  <span>→</span>
                </button>
              </form>
            </>
          )}
        </section>
      </main>
    </PublicShell>
  )
}