import {
  getThemeLabel,
} from "../utils/themeAdminLabels.js"

export default function ThemeManualControl({
  runtimeConfig,
  themeKeys,
  saving,
  onAutomatic,
  onManual,
}) {
  const manualKey =
    runtimeConfig?.manualThemeKey ||
    "phoenix"

  return (
    <article className="phx-theme-admin-card">
      <h2>Control global</h2>

      <p className="phx-theme-admin-card__text">
        AUTO usa el calendario. MANUAL fuerza el mismo theme en todos los clientes sincronizados.
      </p>

      <div className="phx-theme-mode-buttons">
        <button
          type="button"
          className={
            runtimeConfig?.mode !== "manual"
              ? "is-active"
              : ""
          }
          disabled={saving}
          onClick={onAutomatic}
        >
          Automático
        </button>

        <select
          aria-label="Theme manual"
          defaultValue={manualKey}
          disabled={saving}
          onChange={(event) => {
            const key =
              event.target.value

            if (key) {
              onManual(key)
            }
          }}
        >
          {themeKeys.map(
            (themeKey) => (
              <option
                key={themeKey}
                value={themeKey}
              >
                {getThemeLabel(
                  themeKey
                )}
              </option>
            )
          )}
        </select>
      </div>

      <p className="phx-theme-admin-card__hint">
        El preview DEV de una PC continúa siendo local; este control publica el estado global.
      </p>
    </article>
  )
}
