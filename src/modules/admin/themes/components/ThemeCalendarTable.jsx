import {
  describeThemeRule,
  getThemeLabel,
} from "../utils/themeAdminLabels.js"

export default function ThemeCalendarTable({
  entries,
}) {
  return (
    <section className="phx-theme-calendar">
      <div className="phx-theme-calendar__header">
        <div>
          <p className="phx-theme-admin__eyebrow">
            CALENDARIO MAESTRO
          </p>

          <h2>
            {entries.length} reglas automáticas
          </h2>
        </div>
      </div>

      <div className="phx-theme-calendar__table-wrap">
        <table className="phx-theme-calendar__table">
          <thead>
            <tr>
              <th>Theme</th>
              <th>Activación</th>
              <th>Prioridad</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {entries.map(
              (entry) => (
                <tr key={entry.themeKey}>
                  <td>
                    <strong>
                      {getThemeLabel(
                        entry.themeKey
                      )}
                    </strong>

                    <small>
                      {entry.themeKey}
                    </small>
                  </td>

                  <td>
                    {describeThemeRule(
                      entry.rule
                    )}
                  </td>

                  <td>
                    {entry.priority}
                  </td>

                  <td>
                    <span className="phx-theme-status phx-theme-status--auto">
                      {entry.enabled !== false
                        ? "Programado"
                        : "No disponible"}
                    </span>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
