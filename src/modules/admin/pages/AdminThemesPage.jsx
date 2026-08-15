import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import ThemeRuntimeCard from "../themes/components/ThemeRuntimeCard.jsx"
import ThemeCalendarTable from "../themes/components/ThemeCalendarTable.jsx"

import {
  getThemeAdminOverview,
  subscribeThemeAdminChanges,
} from "../themes/services/themeAdminService.js"

import "../themes/adminThemes.css"

export default function AdminThemesPage() {
  const [overview, setOverview] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      if (!quiet) {
        setLoading(true)
      }

      try {
        const next =
          await getThemeAdminOverview()

        setOverview(next)
        setError("")
      } catch (loadError) {
        console.error(loadError)

        setError(
          loadError?.message ||
          "No se pudo cargar el estado del Theme Engine."
        )
      } finally {
        if (!quiet) {
          setLoading(false)
        }
      }
    },
    []
  )

  useEffect(() => {
    load()

    const unsubscribe =
      subscribeThemeAdminChanges(
        () => {
          load({ quiet: true })
        }
      )

    return unsubscribe
  }, [load])

  const calendar =
    useMemo(
      () =>
        overview?.calendarEntries || [],
      [overview]
    )

  return (
    <main className="phx-theme-admin">
      <header className="phx-theme-admin__header">
        <div>
          <p className="phx-theme-admin__eyebrow">
            PHO3NIX V2
          </p>

          <h1>
            Theme Engine
          </h1>

          <p className="phx-theme-admin__subtitle">
            Monitor del calendario automático de PHO3NIX.
          </p>
        </div>

        <button
          type="button"
          className="phx-theme-admin__refresh"
          onClick={() => load()}
          disabled={loading}
        >
          Actualizar
        </button>
      </header>

      <div
        className="phx-theme-admin__alert phx-theme-admin__alert--success"
        role="status"
      >
        El Theme Engine opera automáticamente. No requiere intervención de Admin ni Coach.
      </div>

      {error ? (
        <div
          className="phx-theme-admin__alert phx-theme-admin__alert--error"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {loading && !overview ? (
        <section className="phx-theme-admin__loading">
          Cargando Theme Engine…
        </section>
      ) : (
        <>
          <section className="phx-theme-admin__grid phx-theme-admin__grid--single">
            <ThemeRuntimeCard
              overview={overview}
            />
          </section>

          <ThemeCalendarTable
            entries={calendar}
          />
        </>
      )}
    </main>
  )
}
