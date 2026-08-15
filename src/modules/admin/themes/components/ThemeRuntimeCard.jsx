import {
  getThemeLabel,
} from "../utils/themeAdminLabels.js"

export default function ThemeRuntimeCard({
  overview,
}) {
  const runtime =
    overview?.runtimeConfig || {}

  const current =
    overview?.currentSelection || {}

  const next =
    overview?.nextTransition || null

  return (
    <article className="phx-theme-admin-card">
      <div className="phx-theme-admin-card__heading">
        <span className="phx-theme-status phx-theme-status--auto">
          AUTOMÁTICO
        </span>

        <span className="phx-theme-admin-card__source">
          {overview?.source || "local"}
        </span>
      </div>

      <dl className="phx-theme-admin-stats">
        <div>
          <dt>Theme actual</dt>
          <dd>
            {getThemeLabel(
              current.themeKey
            )}
          </dd>
          <small>
            {current.themeKey || "phoenix"}
          </small>
        </div>

        <div>
          <dt>Próximo theme</dt>
          <dd>
            {next
              ? getThemeLabel(
                  next.toThemeKey
                )
              : "Sin cambio próximo"}
          </dd>

          <small>
            {next?.dateTimeKey || "—"}
          </small>
        </div>

        <div>
          <dt>Zona horaria</dt>
          <dd>
            {runtime.timeZone ||
              "America/Guayaquil"}
          </dd>
        </div>

        <div>
          <dt>Modo de producción</dt>
          <dd>AUTO-ONLY</dd>
          <small>
            Calendario oficial
          </small>
        </div>
      </dl>
    </article>
  )
}
