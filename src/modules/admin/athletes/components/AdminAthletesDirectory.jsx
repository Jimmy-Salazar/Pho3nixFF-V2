import { getInitials } from "../../dashboard/utils/adminDashboardUtils.js"
import {
  ROLE_OPTIONS,
  STATUS_FILTERS,
  formatDate,
  formatMembershipHint,
  getRoleLabel,
  getStatusCount,
  getStatusLabel,
} from "../utils/adminAthletesUtils.js"

export default function AdminAthletesDirectory({
  copy,
  locale,
  loading,
  rows,
  allRows,
  search,
  role,
  statusFilter,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onCreate,
  onExport,
  onRefresh,
  onEdit,
  onDelete,
  onMembership,
}) {
  return (
    <section className="admin-panel admin-athletes-directory" id="admin-quick-actions">
      <div className="admin-panel-heading admin-athletes-directory-heading">
        <div>
          <span>{copy.directoryEyebrow}</span>
          <h2>{copy.directoryTitle}</h2>
          <p>{copy.directorySubtitle}</p>
        </div>

        <div className="admin-athletes-heading-actions">
          <button type="button" className="admin-athletes-secondary-button" onClick={onRefresh}>
            <span aria-hidden="true">↻</span>
            {copy.refresh}
          </button>
          <button type="button" className="admin-athletes-secondary-button" onClick={onExport}>
            <span aria-hidden="true">⇩</span>
            {copy.export}
          </button>
          <button type="button" className="admin-athletes-primary-button" onClick={onCreate}>
            <span aria-hidden="true">＋</span>
            {copy.newAthlete}
          </button>
        </div>
      </div>

      <div className="admin-athletes-toolbar">
        <label className="admin-athletes-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={copy.searchPlaceholder}
          />
        </label>

        <div className="admin-athletes-status-filters" aria-label={copy.status}>
          {STATUS_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={statusFilter === item.value ? "is-active" : ""}
              onClick={() => onStatusChange(item.value)}
            >
              {copy[item.key]}
              <small>{getStatusCount(allRows, item.value)}</small>
            </button>
          ))}
        </div>

        <label className="admin-athletes-role-filter">
          <span className="sr-only">{copy.role}</span>
          <select value={role} onChange={(event) => onRoleChange(event.target.value)}>
            {ROLE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {copy[item.key]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="admin-athletes-results-bar">
        <span>{loading ? copy.loading : `${rows.length} ${copy.results}`}</span>
      </div>

      <div className="admin-athletes-table-wrap">
        <table className="admin-athletes-table">
          <thead>
            <tr>
              <th>{copy.athlete}</th>
              <th>{copy.role}</th>
              <th>{copy.membership}</th>
              <th>{copy.nextPayment}</th>
              <th>{copy.status}</th>
              <th>{copy.actions}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}><EmptyState text={copy.loading} /></td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6}><EmptyState text={copy.noResults} /></td>
              </tr>
            ) : (
              rows.map((user) => (
                <AthleteTableRow
                  key={user.id}
                  user={user}
                  copy={copy}
                  locale={locale}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onMembership={onMembership}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function AthleteTableRow({ user, copy, locale, onEdit, onDelete, onMembership }) {
  const status = user.status

  return (
    <tr>
      <td>
        <AthleteIdentity user={user} />
      </td>
      <td><RolePill role={user.role} copy={copy} /></td>
      <td><StatusPill status={status} copy={copy} /></td>
      <td>
        <div className="admin-athletes-payment-date">
          <strong>{status.forced ? "—" : formatDate(status.membership?.fecha_fin, locale)}</strong>
          <small>{formatMembershipHint(status, copy)}</small>
        </div>
      </td>
      <td>
        <button
          type="button"
          className={`admin-athletes-access-button is-${status.code}`}
          disabled={status.forced}
          onClick={() => onMembership(user)}
        >
          <span aria-hidden="true">●</span>
          {status.active ? copy.deactivate : copy.activate}
        </button>
      </td>
      <td>
        <div className="admin-athletes-row-actions">
          <button type="button" onClick={() => onEdit(user)} aria-label={copy.edit} title={copy.edit}>✎</button>
          <button type="button" className="is-danger" onClick={() => onDelete(user)} aria-label={copy.delete} title={copy.delete}>⌫</button>
        </div>
      </td>
    </tr>
  )
}

function AthleteIdentity({ user }) {
  const name = user.nombre || user.email || "PHO3NIX"

  return (
    <div className="admin-athletes-identity">
      <div className="admin-athletes-avatar">
        {user.foto_url ? <img src={user.foto_url} alt={name} /> : <span>{getInitials(name)}</span>}
      </div>
      <div>
        <strong>{name}</strong>
        <small>{user.email || "—"}</small>
        <small>{user.telefono || user.cedula || "—"}</small>
      </div>
    </div>
  )
}

function RolePill({ role, copy }) {
  const normalized = String(role || "").toLowerCase()
  const className = normalized.includes("admin")
    ? "is-admin"
    : normalized.includes("coach")
      ? "is-coach"
      : "is-athlete"

  return <span className={`admin-athletes-role-pill ${className}`}>{getRoleLabel(role, copy)}</span>
}

function StatusPill({ status, copy }) {
  return (
    <span className={`admin-athletes-status-pill is-${status.code}`}>
      <span aria-hidden="true">●</span>
      {getStatusLabel(status, copy)}
    </span>
  )
}

function EmptyState({ text }) {
  return <div className="admin-athletes-empty">{text}</div>
}
