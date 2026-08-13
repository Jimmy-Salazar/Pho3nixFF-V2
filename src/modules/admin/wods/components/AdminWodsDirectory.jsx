import {
  WOD_STATUS,
  canEditWod,
  formatDate,
  formatModality,
  formatRanking,
  getStatusLabel,
  getWodStatus,
} from "../utils/adminWodsUtils.js"
import { interpolateAdminWodsCopy } from "../i18n/adminWodsCopy.js"

const FILTERS = [
  { key: "all", icon: "▦" },
  { key: WOD_STATUS.DRAFT, icon: "✎" },
  { key: WOD_STATUS.SCHEDULED, icon: "◷" },
  { key: WOD_STATUS.ACTIVE, icon: "●" },
  { key: WOD_STATUS.HISTORICAL, icon: "↺" },
]

export default function AdminWodsDirectory({
  copy,
  locale,
  weekRows,
  monthGroups,
  selectedMonthKey,
  stats,
  loading,
  search,
  statusFilter,
  onSearch,
  onStatusFilter,
  onMonthChange,
  onCreate,
  onView,
  onEdit,
  onSchedule,
  onDelete,
}) {
  const counts = {
    all: stats.total,
    [WOD_STATUS.DRAFT]: stats.drafts,
    [WOD_STATUS.SCHEDULED]: stats.scheduled,
    [WOD_STATUS.ACTIVE]: stats.active,
    [WOD_STATUS.HISTORICAL]: stats.historical,
  }

  const filterLabels = {
    all: copy.all,
    [WOD_STATUS.DRAFT]: copy.drafts,
    [WOD_STATUS.SCHEDULED]: copy.scheduled,
    [WOD_STATUS.ACTIVE]: copy.active,
    [WOD_STATUS.HISTORICAL]: copy.historical,
  }

  const selectedMonth =
    monthGroups.find((group) => group.key === selectedMonthKey) || monthGroups[0] || null

  const visibleCount = weekRows.length + (selectedMonth?.rows.length || 0)

  return (
    <section className="admin-panel admin-wods-directory">
      <div className="admin-panel-heading admin-wods-directory-heading">
        <div>
          <span>{copy.directoryEyebrow}</span>
          <h2>{copy.directoryTitle}</h2>
          <p>{copy.directorySubtitle}</p>
        </div>

        <button type="button" className="admin-wods-primary-button" onClick={onCreate}>
          <span aria-hidden="true">＋</span>
          {copy.newWod}
        </button>
      </div>

      <div className="admin-wods-toolbar">
        <label className="admin-wods-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder={copy.searchPlaceholder}
          />
        </label>

        <div className="admin-wods-status-filters" role="group" aria-label={copy.status}>
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={statusFilter === filter.key ? "is-active" : ""}
              onClick={() => onStatusFilter(filter.key)}
            >
              <span aria-hidden="true">{filter.icon}</span>
              {filterLabels[filter.key]}
              <small>{counts[filter.key]}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="admin-wods-results-bar">
        {interpolateAdminWodsCopy(copy.visibleResults, { count: visibleCount })}
      </div>

      <div className="admin-wods-section-stack">
        <WodTableSection
          className="is-week"
          eyebrow={copy.weekEyebrow}
          title={copy.weekTitle}
          subtitle={copy.weekSubtitle}
          countLabel={interpolateAdminWodsCopy(copy.weekCount, { count: weekRows.length })}
          copy={copy}
          locale={locale}
          rows={weekRows}
          loading={loading}
          emptyText={copy.weekEmpty}
          onView={onView}
          onEdit={onEdit}
          onSchedule={onSchedule}
          onDelete={onDelete}
        />

        <section className="admin-wods-monthly-block">
          <div className="admin-wods-subsection-heading">
            <div>
              <span>{copy.monthlyEyebrow}</span>
              <h3>{copy.monthlyTitle}</h3>
              <p>{copy.monthlySubtitle}</p>
            </div>

            {selectedMonth ? (
              <strong>
                {interpolateAdminWodsCopy(copy.monthCount, {
                  count: selectedMonth.rows.length,
                })}
              </strong>
            ) : null}
          </div>

          {monthGroups.length > 0 ? (
            <div className="admin-wods-month-tabs" role="tablist" aria-label={copy.monthlyTitle}>
              {monthGroups.map((group) => (
                <button
                  key={group.key}
                  type="button"
                  role="tab"
                  aria-selected={group.key === selectedMonth?.key}
                  className={group.key === selectedMonth?.key ? "is-active" : ""}
                  onClick={() => onMonthChange(group.key)}
                >
                  <span>{group.label}</span>
                  <small>{group.rows.length}</small>
                </button>
              ))}
            </div>
          ) : null}

          <WodTableSection
            className="is-month"
            title={selectedMonth?.label || copy.noMonthSelected}
            subtitle={selectedMonth ? copy.selectedMonthSubtitle : copy.monthEmpty}
            copy={copy}
            locale={locale}
            rows={selectedMonth?.rows || []}
            loading={loading}
            emptyText={copy.monthEmpty}
            hideHeading={!selectedMonth}
            onView={onView}
            onEdit={onEdit}
            onSchedule={onSchedule}
            onDelete={onDelete}
          />
        </section>
      </div>
    </section>
  )
}

function WodTableSection({
  className = "",
  eyebrow,
  title,
  subtitle,
  countLabel,
  copy,
  locale,
  rows,
  loading,
  emptyText,
  hideHeading = false,
  onView,
  onEdit,
  onSchedule,
  onDelete,
}) {
  return (
    <section className={["admin-wods-table-section", className].filter(Boolean).join(" ")}>
      {!hideHeading ? (
        <div className="admin-wods-subsection-heading">
          <div>
            {eyebrow ? <span>{eyebrow}</span> : null}
            <h3>{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {countLabel ? <strong>{countLabel}</strong> : null}
        </div>
      ) : null}

      <div className="admin-wods-table-wrap">
        <table className="admin-wods-table">
          <thead>
            <tr>
              <th>{copy.wod}</th>
              <th>{copy.date}</th>
              <th className="admin-wods-col-modality">{copy.modality}</th>
              <th className="admin-wods-col-ranking">{copy.ranking}</th>
              <th className="admin-wods-col-estimate">{copy.estimate}</th>
              <th>{copy.status}</th>
              <th>{copy.actions}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRows />
            ) : rows.length === 0 ? (
              <tr><td colSpan="7" className="admin-wods-empty">{emptyText}</td></tr>
            ) : (
              rows.map((wod) => (
                <WodRow
                  key={wod.id}
                  copy={copy}
                  locale={locale}
                  wod={wod}
                  onView={() => onView(wod)}
                  onEdit={() => onEdit(wod)}
                  onSchedule={() => onSchedule(wod)}
                  onDelete={() => onDelete(wod)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function WodRow({ copy, locale, wod, onView, onEdit, onSchedule, onDelete }) {
  const status = getWodStatus(wod)
  const editable = canEditWod(wod)
  const scheduleLabel = status === WOD_STATUS.SCHEDULED ? copy.reschedule : copy.schedule

  return (
    <tr>
      <td>
        <button type="button" className="admin-wod-name-cell" onClick={onView}>
          <span className="admin-wod-row-icon" aria-hidden="true">W</span>
          <span>
            <strong>{wod.nombre || copy.noName}</strong>
            <small>{wod.descripcion || copy.noDescription}</small>
          </span>
        </button>
      </td>
      <td>
        <div className="admin-wod-date-cell">
          <strong>{wod.fecha ? formatDate(wod.fecha, locale) : copy.noDate}</strong>
          {wod.fecha_publicacion ? <small>19:30</small> : null}
        </div>
      </td>
      <td className="admin-wods-col-modality">
        <span className="admin-wod-soft-badge">{formatModality(wod.modalidad, copy)}</span>
      </td>
      <td className="admin-wods-col-ranking">
        <span className="admin-wod-soft-badge">{formatRanking(wod.modo_ranking, copy)}</span>
      </td>
      <td className="admin-wods-col-estimate">
        {wod.calorias_min || wod.calorias_max ? (
          <div className="admin-wod-estimate-cell">
            <strong>🔥 {wod.calorias_min || 0} - {wod.calorias_max || 0}</strong>
            <small>{wod.intensidad_estimada || "kcal"}</small>
          </div>
        ) : (
          <span className="admin-wod-muted">{copy.noEstimate}</span>
        )}
      </td>
      <td><StatusBadge copy={copy} status={status} /></td>
      <td>
        <div className="admin-wod-row-actions">
          <ActionButton label={copy.view} icon="◉" onClick={onView} />
          {editable ? <ActionButton label={copy.edit} icon="✎" onClick={onEdit} /> : null}
          {editable ? <ActionButton label={scheduleLabel} icon="◷" onClick={onSchedule} primary /> : null}
          <ActionButton label={copy.delete} icon="×" onClick={onDelete} danger />
        </div>
      </td>
    </tr>
  )
}

function StatusBadge({ copy, status }) {
  return (
    <span className={`admin-wod-status-badge is-${status}`}>
      <i aria-hidden="true" />
      {getStatusLabel(status, copy)}
    </span>
  )
}

function ActionButton({ label, icon, onClick, primary = false, danger = false }) {
  const className = [
    "admin-wod-action-button",
    primary ? "is-primary" : "",
    danger ? "is-danger" : "",
  ].filter(Boolean).join(" ")

  return (
    <button type="button" className={className} onClick={onClick} title={label} aria-label={label}>
      <span aria-hidden="true">{icon}</span>
      <small>{label}</small>
    </button>
  )
}

function LoadingRows() {
  return Array.from({ length: 4 }, (_, index) => (
    <tr key={index} className="admin-wods-loading-row">
      <td colSpan="7"><span /></td>
    </tr>
  ))
}
